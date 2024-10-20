import React, { useEffect, useState } from "react"
import useSql from "@/hooks/useSql" // Adjust the path as needed
import type { ParamsObject } from "sql.js"

const SqlComponent = () => {
  const { execute, loading, error } = useSql()
  const [result, setResult] = useState<ParamsObject[]>([])

  useEffect(() => {
    const setupAndQuery = async () => {
      try {
        // Initialize the database schema and insert data
        await execute(
          "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, age INTEGER);"
        )
        await execute(
          "INSERT INTO users (name, age) VALUES ('Alice', 30), ('Bob', 25), ('Charlie', 35);"
        )
        // Run a select query
        const rows = await execute("SELECT * FROM users;")
        setResult(rows)
      } catch (err) {
        console.error("SQL Error:", err)
      }
    }

    if (!loading && !error) {
      setupAndQuery()
    }
  }, [execute, loading, error])

  if (loading) return <p>Loading SQL engine...</p>
  if (error) return <p>Error initializing SQL engine: {error.message}</p>

  return (
    <div>
      <h3>Result from SQL.js:</h3>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  )
}

export default SqlComponent
