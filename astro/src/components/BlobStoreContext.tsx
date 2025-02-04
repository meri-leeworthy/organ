import {
  deleteAssetFromIndexedDB,
  iterateIndexedDB,
  loadAssetFromIndexedDB,
  saveAssetToIndexedDB,
} from "@/lib/idbHelper"
import type { ReactNode } from "react"
import { createContext, useContext, useEffect, useState } from "react"

type BlobCache = Map<number, string>

export const BlobStoreContext = createContext<BlobCache>(new Map())

export function BlobStoreProvider({ children }: { children: ReactNode }) {
  const [blobCache, setBlobCache] = useState<BlobCache>(new Map())

  useEffect(() => {
    const cache: BlobCache = new Map<number, string>()

    async function loadCache() {
      const items = await iterateIndexedDB("assets")

      items.forEach(item => {
        const blob = new Blob([item.value as ArrayBuffer])
        const url = URL.createObjectURL(blob)
        cache.set(Number(item.key), url)
      })
      setBlobCache(cache)
    }

    loadCache()
  }, [])

  return (
    <BlobStoreContext.Provider value={blobCache}>
      {children}
    </BlobStoreContext.Provider>
  )
}

export type BlobStore = {
  addBlob: (key: number, value: Blob) => string
  deleteBlob: (key: number) => void
  getBlobURL: (key: number) => string
  getBlob: (key: number) => Promise<Blob>
}

export const useBlobStore = (): BlobStore => {
  const context = useContext(BlobStoreContext)
  if (!context) {
    throw new Error("useBlobStore must be used within a BlobStoreProvider")
  }

  function addBlob(key: number, value: Blob) {
    const url = URL.createObjectURL(value)
    context.set(key, url)
    saveAssetToIndexedDB(Number(key), value)
    return url
  }

  function deleteBlob(key: number) {
    URL.revokeObjectURL(context.get(key) as string)
    context.delete(key)
    deleteAssetFromIndexedDB(Number(key))
  }

  function getBlobURL(key: number) {
    return context.get(key) || ""
  }

  async function getBlob(key: number) {
    return await loadAssetFromIndexedDB(key)
  }

  return { addBlob, deleteBlob, getBlob, getBlobURL }
}
