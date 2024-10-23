// hooks/useSql.ts
import { useEffect, useState, useCallback, useRef } from "react"
import type { BindParams, Database, ParamsObject } from "sql.js"
import { isBrowser, loadFromIndexedDB, saveToIndexedDB } from "../lib/idbHelper"
import { useDebounce } from "./useDebounce"

export type Execute = (query: string, params?: BindParams) => ParamsObject[]

export interface UseSqlResult {
  execute: Execute
  loading: boolean
  error: Error | null
  db: Database | null
  // save: () => Promise<void>
}

const useSql = (): UseSqlResult => {
  const [db, setDb] = useState<Database | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)
  const [saving, setSaving] = useState<number>(0)
  const debouncedSaving = useDebounce(saving, 2000)

  // Reference to track if the component is mounted
  const isMountedRef = useRef(true)

  // Debounced save function for saving to IndexedDB
  useEffect(() => {
    async function save() {
      if (!db) {
        throw new Error("Database is not initialized")
      }

      if (isBrowser()) {
        try {
          const data = db.export()
          await saveToIndexedDB(data)
          console.log("Database saved to IndexedDB.")
        } catch (saveError) {
          console.error("Failed to save database to IndexedDB:", saveError)
        }
      }
    }
    save()
  }, [debouncedSaving])

  useEffect(() => {
    // Cleanup function to update the mounted reference
    return () => {
      isMountedRef.current = false
      if (db) {
        db.close()
      }
    }
  }, [db])

  useEffect(() => {
    if (!isBrowser()) {
      // If not in the browser, skip database initialization
      console.warn(
        "Skipping database initialization in non-browser environment."
      )
      setLoading(false)
      return
    }

    const initializeSql = async () => {
      console.log("Initializing SQL.js...")
      try {
        const initSqlJs = await import("sql.js")
        const SQL = await initSqlJs.default({
          locateFile: (file: string) => `/sql-wasm.wasm`,
        })

        // Load database from IndexedDB if available
        const data = await loadFromIndexedDB()
        const database = data ? new SQL.Database(data) : new SQL.Database()

        console.log("SQL.js initialized.")
        if (isMountedRef.current) {
          setDb(database)
          setLoading(false)
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(err as Error)
          setLoading(false)
        }
      }
    }

    initializeSql()
  }, [])

  const execute = useCallback(
    (query: string, params: BindParams = []): ParamsObject[] => {
      if (!db) {
        throw new Error("Database is not initialized")
      }

      try {
        const stmt = db.prepare(query)
        if (Number(params?.length) > 0) {
          stmt.bind(params)
        }

        const rows: ParamsObject[] = []
        while (stmt.step()) {
          const row = stmt.getAsObject()
          rows.push(row)
        }
        stmt.free()

        // only setSaving if the query is not a SELECT statement
        if (!query.trim().toUpperCase().startsWith("SELECT")) {
          setSaving(saving => saving + 1)
        }

        return rows
      } catch (err) {
        throw err
      }
    },
    [db]
  )

  return { execute, loading, error, db }
}

export default useSql
