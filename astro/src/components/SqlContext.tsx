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

const defaultCss = `h1 {
  font-size: 2rem;
  font-weight: bold;
 }

h2 {
  font-size: 1.5rem;
  font-weight: bold;
}`

const defaultHbs = `<style>{{{css}}}</style>
<div class="preview-pane">
  <h1>{{heading}}</h1>
  {{{content}}}
            
  {{#if show_footer}}
  <footer>
    <p>{{footer_text}}</p>
  </footer>
  {{/if}}
</div>`

const defaultMd = `---
heading: My Document
---
## Welcome to My Document

This is a sample Markdown file.`

const SqlContext = createContext<ExtendedUseSqlResult | undefined>(undefined)

export const SqlProvider: React.FC<SqlProviderProps> = ({ children }) => {
  const sql = useSql()
  const [schemaInitialized, setSchemaInitialized] = useState<boolean>(false)
  const [schemaError, setSchemaError] = useState<Error | null>(null)

  useEffect(() => {
    if (!sql.loading && !sql.error && sql.execute && !schemaInitialized) {
      const initializeSchemaAndData = () => {
        const queries = [
          // 1. Create the 'files' table
          {
            query: `CREATE TABLE IF NOT EXISTS files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT NOT NULL CHECK (type IN ('css', 'hbs', 'hbsp', 'md', 'asset')),
            content TEXT,
            file_path TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(name, type)
          );`,
          },

          // 2. Create a partial unique index for 'type' = 'css'
          {
            query: `CREATE UNIQUE INDEX IF NOT EXISTS unique_type_css ON files(type) WHERE type = 'css';`,
          },

          // 3. Create indexes for performance optimization
          {
            query: `CREATE INDEX IF NOT EXISTS idx_files_type ON files(type);`,
          },
          {
            query: `CREATE INDEX IF NOT EXISTS idx_files_name ON files(name);`,
          },

          // 4. Create a trigger to update 'updated_at' on record updates
          {
            query: `CREATE TRIGGER IF NOT EXISTS update_files_updated_at
            AFTER UPDATE ON files
            FOR EACH ROW
            BEGIN
              UPDATE files SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
            END;`,
          },

          // 5. Insert test file: styles.css
          {
            query: `INSERT OR IGNORE INTO files (name, type, content) VALUES (?, ?, ?);`,
            params: ["styles", "css", defaultCss],
          },

          // 6. Insert test file: index.hbs
          {
            query: `INSERT OR IGNORE INTO files (name, type, content) VALUES (?, ?, ?);`,
            params: ["index", "hbs", defaultHbs],
          },

          // 7. Insert test file: main.md
          {
            query: `INSERT OR IGNORE INTO files (name, type, content) VALUES (?, ?, ?);`,
            params: ["main", "md", defaultMd],
          },
        ]

        try {
          // Begin Transaction
          sql.execute("BEGIN TRANSACTION;")
          console.log("Transaction started.")

          // Execute each SQL statement sequentially
          for (const { query, params } of queries) {
            sql.execute(query, params)
            console.log(
              `Executed query: ${query.split("\n")[0].slice(0, 50)}...`
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
