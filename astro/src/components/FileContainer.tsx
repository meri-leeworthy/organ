import { SelectedFileDisplay } from "./SelectedFileDisplay"

import { useEffect, useState } from "react"
import { useSqlContext } from "./SqlContext"
import {
  fileDataDefault,
  type Collection,
  type FileData,
  type SelectedFiles,
} from "@/lib/types"
import type { Field } from "./SelectedFileDisplay"
import { useBlobStore, type BlobStore } from "./BlobStoreContext"
import { updateImageUrls } from "@/lib/updateImageUrls"

export interface Schema {
  fields: Field[]
}

export function FileContainer({
  selectedFiles,
  onClose,
}: {
  selectedFiles: SelectedFiles
  onClose: () => void
}) {
  const [file, setFile] = useState<FileData>(fileDataDefault)
  const [type, setType] = useState<Collection>("page")
  const [schema, setSchema] = useState<Schema>({ fields: [] })
  const [templates, setTemplates] = useState<Map<number, string>>(new Map())

  const { execute, loading, error, schemaInitialized } = useSqlContext()
  const blobStore = useBlobStore()

  useEffect(() => {
    if (!schemaInitialized || loading || error || !selectedFiles) return
    if (!selectedFiles.activeFileId) return

    const getSelectedFile = async () => {
      // get templates
      try {
        const query = `SELECT file.name, file.id FROM file JOIN model ON file.model_id = model.id WHERE model.name = 'template';`
        const result = execute(query) as { name: string; id: number }[]
        console.log("Templates from database:", result)
        setTemplates(
          new Map(
            result.map((file: { name: string; id: number }) => [
              file.id,
              file.name,
            ])
          )
        )
      } catch (err) {
        console.error("Error fetching templates from database:", err)
      }

      // get current file
      try {
        const query = `SELECT file.id, file.url, file.name, file.data, model.name AS type, model.schema
            FROM file
            JOIN model ON file.model_id = model.id
            WHERE file.id = ?;`

        const result = execute(query, [selectedFiles.activeFileId])

        console.log("Selected file from database:", result)

        const data = JSON.parse(result[0].data as string)
        // here is where blob urls need to be refreshed for html content

        const newFile = {
          id: selectedFiles.activeFileId as number,
          name: result[0].name as string,
          type: result[0].type as Collection,
          data: data,
          url: result[0].url as string,
          blob_url: "",
        }

        newFile.data = updateImageUrls(newFile.data, blobStore.getBlobURL)

        if (result[0].type === "asset") {
          const url = blobStore.getBlobURL(selectedFiles.activeFileId as number)
          newFile.blob_url = url || ""
        }

        setFile(newFile)
        setType((result[0]?.type?.toString() as Collection) || "")
        setSchema(JSON.parse(result[0]?.schema?.toString() || ""))
      } catch (err) {
        console.error("Error fetching file from database:", err)
      }
    }

    getSelectedFile()
  }, [schemaInitialized, selectedFiles?.activeFileId])

  return (
    <SelectedFileDisplay
      file={file}
      setFile={setFile}
      type={type}
      schema={schema}
      templates={templates}
      onClose={onClose}
    />
  )
}
