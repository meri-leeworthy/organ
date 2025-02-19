// SqlContext.tsx
import React, {
  createContext,
  type ReactNode,
  useEffect,
  useState,
} from "react"
import useSql, { type UseSqlResult } from "@/hooks/useSql"
import { MODEL_IDS } from "@/lib/consts"
import { Alert } from "./ui/alert"

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
<link rel="stylesheet" href="style.css" />
<title>{{title}}</title>
</head>

<body>
<h1>{{title}}</h1>
{{{content}}}
</body>
</html>`

// const defaultMd = `This is a sample **Markdown** file.`

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
            query: `CREATE TABLE IF NOT EXISTS model (
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
            query: `CREATE TRIGGER IF NOT EXISTS update_model_updated_at
            AFTER UPDATE ON model
            FOR EACH ROW
            BEGIN
              UPDATE model SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
            END;`,
          },

          // Insert default models for 'pages' and 'posts'
          // these IDs being hardcoded is reflected in the MODEL_IDS const
          {
            query: `INSERT OR IGNORE INTO model (id, name, is_system, schema) VALUES
            (1, 'page', TRUE, '{"fields": [{"name": "template", "type": "number", "required": true}, {"name": "title", "type": "string", "required": true}, {"name": "body", "type": "html", "required": true}]}'),
            (2, 'post', TRUE, '{"fields": [{"name": "title", "type": "string", "required": true}, {"name": "body", "type": "html", "required": true}, {"name": "date", "type": "date", "required": true}, {"name": "tags", "type": "array"}]}'),
            (3, 'templateAsset', TRUE, '{"fields": [{"name": "body", "type": "plaintext"}]}'),
            (4, 'template', TRUE, '{"fields": [{"name": "body", "type": "plaintext"}]}'),
            (5, 'partial', TRUE, '{"fields": [{"name": "body", "type": "plaintext"}]}'),
            (6, 'asset', TRUE, '{"fields": [{"name": "mime_type", "type": "string", "required": true}]}');`,
          },

          // Create the 'files' table
          {
            query: `CREATE TABLE IF NOT EXISTS file (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            model_id INTEGER NOT NULL,
            data TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(data)),
            file_path TEXT,
            url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(name, model_id)
            FOREIGN KEY(model_id) REFERENCES model(id) ON DELETE CASCADE
            );`,
          },

          // Create indexes for performance optimization
          {
            query: `CREATE INDEX IF NOT EXISTS idx_file_type ON file(model_id);`,
          },
          {
            query: `CREATE INDEX IF NOT EXISTS idx_file_name ON file(name);`,
          },

          // Create a trigger to update 'updated_at' on record updates
          {
            query: `CREATE TRIGGER IF NOT EXISTS update_file_updated_at
            AFTER UPDATE ON file
            FOR EACH ROW
            BEGIN
              UPDATE file SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
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

          // Insert test files with corresponding model_id
          const fileQueries = [
            {
              query: `INSERT OR IGNORE INTO file (name, model_id, data) VALUES (?, ?, ?);`,
              params: [
                "main",
                MODEL_IDS["page"],
                JSON.stringify({
                  template: 2,
                  title: "Hello, Organ Pages!",
                  body: {
                    type: "html",
                    content: "<p>Hello, Organ Pages!</p>",
                  },
                }),
              ],
            },
            {
              query: `INSERT OR IGNORE INTO file (name, model_id, data) VALUES (?, ?, ?);`,
              params: [
                "index",
                MODEL_IDS["template"],
                JSON.stringify({
                  body: { type: "plaintext", content: defaultHbs },
                }),
              ],
            },
            {
              query: `INSERT OR IGNORE INTO file (name, model_id, data) VALUES (?, ?, ?);`,
              params: [
                "style.css",
                MODEL_IDS["templateAsset"],
                JSON.stringify({
                  body: { type: "plaintext", content: defaultCss },
                }),
              ],
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
    return (
      <div className="flex items-center justify-center w-screen h-screen gap-2 bg-zinc-950">
        <Alert className="w-64">Loading database...</Alert>
      </div>
    )
  }

  if (sql.error || schemaError) {
    return (
      <div className="flex items-center justify-center w-screen h-screen gap-2 bg-zinc-950">
        <Alert variant="destructive" className="w-64">
          Error initializing database:{" "}
          {sql.error?.message || schemaError?.message}
        </Alert>
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
