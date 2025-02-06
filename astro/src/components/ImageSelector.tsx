import { useCallback, useEffect, useState } from "react"
import { useSqlContext } from "./SqlContext"
import { DropdownMenuContent, DropdownMenuItem } from "./ui/dropdown-menu"
import { MODEL_IDS } from "@/lib/consts"
import type { FileData } from "@/lib/types"
import type { Editor } from "@tiptap/react"
import { useBlobStore } from "./BlobStoreContext"

export function ImageSelector({ editor }: { editor: Editor }) {
  // it's important that the image html tag has a data-id attribute with the id of the image

  const { execute, loading, error, schemaInitialized } = useSqlContext()
  const [images, setImages] = useState<FileData[]>([])
  const blobStore = useBlobStore()

  const addImage = useCallback(
    (id: number) => {
      const url = blobStore.getBlobURL(id)

      if (url) {
        editor
          .chain()
          .focus()
          .setImage({ src: url, title: id.toString() })
          .run()
      }
    },
    [editor]
  )

  useEffect(() => {
    if (!schemaInitialized || loading || error) return
    const result = execute("SELECT id, name FROM file WHERE model_id = ?", [
      MODEL_IDS.asset,
    ])
    const images = result.map(row => ({
      id: row.id as number,
      name: row.name as string,
      type: "asset",
    }))
    setImages(images as FileData[])
  }, [schemaInitialized, loading, error])

  return (
    <DropdownMenuContent>
      {images.map(image => {
        return (
          <DropdownMenuItem key={image.id} onClick={() => addImage(image.id)}>
            {image.name}
          </DropdownMenuItem>
        )
      })}
    </DropdownMenuContent>
  )
}
