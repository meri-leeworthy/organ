import { useCallback, useEffect, useState } from "react"
import { useBlobStore } from "@/components/BlobStoreContext"
import { type FileData } from "@/lib/types"

export type Context = Record<
  string,
  {
    name: string
    file_type: string
    data: string
    url: string
  }
>

export default function useRender() {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const blobStore = useBlobStore()

  const [wasmModule, setWasmModule] = useState<{
    render: (current_file_id: number, context: Context) => string
  } | null>(null)

  useEffect(() => {
    const loadWasm = async () => {
      try {
        setLoading(true)
        console.log("Loading WASM module...")
        const module = await import("../wasm/minissg/minissg.js")
        setWasmModule(module)
        console.log("WASM module loaded:", module)
        setLoading(false)
      } catch (e) {
        console.error("Failed to load WASM module:", e)
        setError("Failed to load WASM module.")
        setLoading(false)
      }
    }
    loadWasm()
  }, [])

  function injectLocalUrls(
    filesMap: Map<number, FileData<Record<string, any>>>
  ) {
    const files = [...filesMap.values()]

    const assets = files.filter(file => file.type === "asset")
    const updatedAssetsArray = assets.map(asset => {
      const url = blobStore.getBlobURL(asset.id)
      return {
        ...asset,
        url,
      }
    })

    updatedAssetsArray.forEach(asset => {
      filesMap.set(asset.id, asset)
    })

    const templateAssets = files.filter(file => file.type === "templateAsset")
    const updatedTemplateAssetsArray = templateAssets.map(asset => {
      if (!asset.data) return asset
      const blob = new Blob([asset.data.body.content], { type: "text/css" })
      const url = blobStore.addBlob(asset.id, blob)
      return {
        ...asset,
        url,
      }
    })

    updatedTemplateAssetsArray.forEach(templateAsset => {
      filesMap.set(templateAsset.id, templateAsset)
    })

    return filesMap
  }

  const render = useCallback(
    (
      contentFileId: number,
      files: Map<number, FileData<Record<string, any>>>
    ) => {
      if (!wasmModule) {
        throw new Error("WASM module not loaded")
      }

      const context: Context = {}
      files.forEach(file => {
        context[file.id] = {
          name: file.name,
          file_type: file.type,
          data: JSON.stringify(file.data),
          url: file.url || "",
        }
      })

      try {
        return wasmModule.render(contentFileId, context)
      } catch (e) {
        console.error("Failed to render:", e)
        setError("Failed to render.")
        return ""
      }
    },
    [wasmModule]
  )

  const renderLocal = useCallback(
    (
      contentFileId: number,
      files: Map<number, FileData<Record<string, any>>>
    ) => {
      const filesWithLocalUrls = injectLocalUrls(files)
      return render(contentFileId, filesWithLocalUrls)
    },
    [render]
  )

  return { loading, error, render, renderLocal }
}
