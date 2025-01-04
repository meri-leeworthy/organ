// SqlContext.tsx
import React, {
  createContext,
  type ReactNode,
  useEffect,
  useState,
} from "react"
import useSql, { type UseSqlResult } from "@/hooks/useSql"

interface SqlProviderProps {
  children: ReactNode
}

interface ExtendedUseSqlResult extends UseSqlResult {
  schemaInitialized: boolean
}

const defaultCss = `* {
  font-family: sans-serif;
}

h1 {
  font-size: 2rem;
  font-weight: bold;
 }

h2 {
  font-size: 1.5rem;
  font-weight: bold;
}
  
img {
  width: 80%;
}`

const defaultHbs = `<!DOCTYPE html>
<html lang="en">

<head>
<style>{{{styles-css}}}</style>
<title>{{title}}</title>
</head>

<body>
<div class="preview-pane">
  <h1>{{title}}</h1>
  {{{content}}}
</div>
</body>
</html>`

const defaultMd = `This is a sample **Markdown** file.`

const SqlContext = createContext<ExtendedUseSqlResult | undefined>(undefined)

export const SqlProvider: React.FC<SqlProviderProps> = ({ children }) => {
  const sql = useSql()
  const [schemaInitialized, setSchemaInitialized] = useState<boolean>(false)
  const [schemaError, setSchemaError] = useState<Error | null>(null)

  useEffect(() => {
    if (!sql.loading && !sql.error && sql.execute && !schemaInitialized) {
      const initializeSchemaAndData = () => {
        const queries = [
          // Create the 'models' table
          {
            query: `CREATE TABLE IF NOT EXISTS models (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            is_system BOOLEAN NOT NULL DEFAULT FALSE,
            schema TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(schema)),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            CHECK (json_valid(schema))
            );`,
          },

          // Create a trigger to update 'updated_at' on record updates
          {
            query: `CREATE TRIGGER IF NOT EXISTS update_models_updated_at
            AFTER UPDATE ON models
            FOR EACH ROW
            BEGIN
              UPDATE models SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
            END;`,
          },

          // Insert default models for 'pages' and 'posts'
          {
            query: `INSERT OR IGNORE INTO models (id, name, is_system, schema) VALUES
            (1, 'page', TRUE, '{"fields": [{"name": "template", "type": "number", "required": true}, {"name": "title", "type": "string", "required": true}]}'),
            (2, 'post', TRUE, '{"fields": [{"name": "template", "type": "number", "required": true}, {"name": "title", "type": "string", "required": true}, {"name": "date", "type": "date", "required": true}, {"name": "tags", "type": "array"}]}'),
            (3, 'style', TRUE, '{"fields": []}'),
            (4, 'template', TRUE, '{"fields": []}'),
            (5, 'partial', TRUE, '{"fields": []}'),
            (6, 'asset', TRUE, '{"fields": [{"name": "metadata", "type": "json"}]}');`,
          },

          // Create the 'files' table
          {
            query: `CREATE TABLE IF NOT EXISTS files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            model_id INTEGER NOT NULL,
            content TEXT,
            data TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(data)),
            file_path TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(name, model_id)
            FOREIGN KEY(model_id) REFERENCES models(id) ON DELETE CASCADE
            );`,
          },

          // Create indexes for performance optimization
          {
            query: `CREATE INDEX IF NOT EXISTS idx_files_type ON files(model_id);`,
          },
          {
            query: `CREATE INDEX IF NOT EXISTS idx_files_name ON files(name);`,
          },

          // Create a trigger to update 'updated_at' on record updates
          {
            query: `CREATE TRIGGER IF NOT EXISTS update_files_updated_at
            AFTER UPDATE ON files
            FOR EACH ROW
            BEGIN
              UPDATE files SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
            END;`,
          },
        ]

        try {
          // Begin Transaction
          sql.execute("BEGIN TRANSACTION;")
          console.log("Transaction started.")

          // Execute each SQL statement sequentially
          for (const { query } of queries) {
            sql.execute(query)
            console.log(
              `Executed query: ${query.split("\n")[0].slice(0, 50)}...`
            )
          }

          // Retrieve model IDs for inserting files
          const models = ["style", "template", "page"]
          const modelIds: { [key: string]: number } = {}
          models.forEach(model => {
            const result = sql.execute(
              `SELECT id FROM models WHERE name = ?;`,
              [model]
            )

            console.log("Result from SQL.js:", result)
            if (result && Array.isArray(result) && result.length > 0) {
              modelIds[model] = (result as any)[0]["id"] as number // sue me
            } else {
              throw new Error(`Model '${model}' not found.`)
            }
          })

          // Insert test files with corresponding model_id
          const fileQueries = [
            {
              query: `INSERT OR IGNORE INTO files (name, model_id, content, data) VALUES (?, ?, ?, ?);`,
              params: [
                "main",
                modelIds["page"],
                defaultMd,
                JSON.stringify({
                  template: 2,
                  title: "Hello, Organ Static!",
                }),
              ],
            },
            {
              query: `INSERT OR IGNORE INTO files (name, model_id, content) VALUES (?, ?, ?);`,
              params: ["index", modelIds["template"], defaultHbs],
            },
            {
              query: `INSERT OR IGNORE INTO files (name, model_id, content) VALUES (?, ?, ?);`,
              params: ["styles", modelIds["style"], defaultCss],
            },
          ]

          for (const { query, params } of fileQueries) {
            sql.execute(query, params)
            console.log(
              `Executed file insert: ${query.split("\n")[0].slice(0, 50)}...`
            )
          }

          // Commit Transaction
          sql.execute("COMMIT;")
          console.log("Transaction committed successfully.")

          setSchemaInitialized(true)
        } catch (err) {
          console.error("Error during schema initialization:", err)
          try {
            sql.execute("ROLLBACK;")
            console.log("Transaction rolled back successfully.")
          } catch (rollbackError) {
            console.error("Error rolling back transaction:", rollbackError)
          }
          setSchemaError(err as Error)
        }
      }

      initializeSchemaAndData()
    }
  }, [sql.loading, sql.error, sql.execute, schemaInitialized])

  if (sql.loading || (!schemaInitialized && !schemaError)) {
    return <div>Loading database...</div>
  }

  if (sql.error || schemaError) {
    return (
      <div>
        Error initializing database:{" "}
        {sql.error?.message || schemaError?.message}
      </div>
    )
  }

  return (
    <SqlContext.Provider value={{ ...sql, schemaInitialized }}>
      {children}
    </SqlContext.Provider>
  )
}

export const useSqlContext = (): ExtendedUseSqlResult => {
  const context = React.useContext(SqlContext)
  if (!context) {
    throw new Error("useSqlContext must be used within a SqlProvider")
  }
  return context
}
