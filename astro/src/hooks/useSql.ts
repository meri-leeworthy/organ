// hooks/useSql.ts
import { useEffect, useState, useCallback, useRef } from "react"
import type { BindParams, Database, ParamsObject } from "sql.js"
import { isBrowser } from "../lib/idbHelper"
import { useDebounce } from "./useDebounce"

export type Execute = (query: string, params?: BindParams) => ParamsObject[]

export interface UseSqlResult {
  execute: Execute
  loading: boolean
  error: Error | null
  db: Database | null
}

const useSql = (): UseSqlResult => {
  const [db, setDb] = useState<Database | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)

  // Reference to track if the component is mounted
  const isMountedRef = useRef(true)

  // Debounced save function for saving to IndexedDB
  // const debouncedSaveToIndexedDB = useDebounce(async (data: Uint8Array) => {
  //   if (isBrowser()) {
  //     try {
  //       await saveToIndexedDB(data)
  //       console.log("Database saved to IndexedDB.")
  //     } catch (saveError) {
  //       console.error("Failed to save database to IndexedDB:", saveError)
  //     }
  //   }
  // }, 1000)

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
      try {
        const initSqlJs = await import("sql.js")
        const SQL = await initSqlJs.default({
          locateFile: (file: string) => `/sql-wasm.wasm`,
        })

        // Load database from IndexedDB if available
        // const data = await loadFromIndexedDB()
        const database = new SQL.Database() // data ? new SQL.Database(data) : new SQL.Database()

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

        // Schedule saving to IndexedDB after executing the query
        // const data = db.export()
        // debouncedSaveToIndexedDB(data)

        return rows
      } catch (err) {
        throw err
      }
    },
    [db] //, debouncedSaveToIndexedDB
  )

  return { execute, loading, error, db }
}

export default useSql
