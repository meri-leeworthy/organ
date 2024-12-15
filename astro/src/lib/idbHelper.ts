export const isBrowser = (): boolean =>
  typeof window !== "undefined" && typeof indexedDB !== "undefined"

export const openDatabase = () => {
  if (!isBrowser()) {
    console.warn("IndexedDB is not available in this environment.")
    return Promise.reject(new Error("IndexedDB is not available"))
  }

  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("sqljs-db", 4) // Ensure this version is higher if needed for schema changes
    // to clarify i think this means the indexedDB schema not the sql schema

    request.onupgradeneeded = event => {
      const db = request.result
      if (!db.objectStoreNames.contains("sqlfile")) {
        db.createObjectStore("sqlfile") // Create the 'sqlfile' object store
      }
      if (!db.objectStoreNames.contains("assets")) {
        db.createObjectStore("assets") // Create the 'assets' object store
      }
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}

export const saveToIndexedDB = async (data: Uint8Array) => {
  try {
    const db = await openDatabase()
    const transaction = db.transaction("sqlfile", "readwrite")
    const store = transaction.objectStore("sqlfile")
    store.put(data, "filedata")

    return new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => {
        resolve()
      }
      transaction.onerror = () => {
        reject(transaction.error)
      }
    })
  } catch (error) {
    console.error("IndexedDB error:", error)
    throw error
  }
}

export const saveAssetToIndexedDB = async (fileName: string, data: Blob) => {
  try {
    const db = await openDatabase()
    const transaction = db.transaction("assets", "readwrite")
    const store = transaction.objectStore("assets")
    store.put(data, fileName)

    console.log("Saved asset to IndexedDB:", fileName)

    return new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => {
        resolve()
      }
      transaction.onerror = () => {
        reject(transaction.error)
      }
    })
  } catch (error) {
    console.error("IndexedDB error:", error)
    throw error
  }
}

export const loadAssetFromIndexedDB = async (fileName: string) => {
  try {
    const db = await openDatabase()
    const transaction = db.transaction("assets", "readonly")
    const store = transaction.objectStore("assets")
    const request = store.get(fileName)

    return new Promise<Blob>((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result as Blob)
      }
      request.onerror = () => {
        reject(request.error)
      }
    })
  } catch (error) {
    console.error("IndexedDB error:", error)
    throw error
  }
}

export const deleteAssetFromIndexedDB = async (fileName: string) => {
  try {
    const db = await openDatabase()
    const transaction = db.transaction("assets", "readwrite")
    const store = transaction.objectStore("assets")
    store.delete(fileName)

    console.log("Deleted asset from IndexedDB:", fileName)

    return new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => {
        resolve()
      }
      transaction.onerror = () => {
        reject(transaction.error)
      }
    })
  } catch (error) {
    console.error("IndexedDB error:", error)
    throw error
  }
}

export const loadFromIndexedDB = async () => {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB is not available in this environment.")
  }

  const db = await openDatabase()
  const transaction = db.transaction("sqlfile", "readonly")
  const store = transaction.objectStore("sqlfile")
  const request = store.get("filedata")

  return new Promise<Uint8Array>((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result as Uint8Array)
    }
    request.onerror = () => {
      reject(request.error)
    }
  })
}
