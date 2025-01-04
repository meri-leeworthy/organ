import { useEffect, useState } from "react"
import { useSqlContext } from "./SqlContext"
import type { SelectedFiles } from "../lib/types"
import { Textarea } from "./ui/textarea"
import { getValidBlobUrl } from "@/lib/utils"
import { MetadataForm, type Schema } from "./MetadataForm"

export const SelectedFileDisplay = ({
  selectedFiles,
}: {
  selectedFiles: SelectedFiles
}) => {
  const { execute, loading, error, schemaInitialized } = useSqlContext()
  const [content, setContent] = useState<string>("")
  const [type, setType] = useState<string>("")
  const [isOpen, setIsOpen] = useState(false)
  const [schema, setSchema] = useState<Schema>({ fields: [] })

  useEffect(() => {
    if (!schemaInitialized || loading || error || !selectedFiles) return

    const getSelectedFile = async () => {
      try {
        const query = `SELECT files.id, files.name, files.content, files.data, models.name AS type, models.schema
            FROM files
            JOIN models ON files.model_id = models.id
            WHERE files.id = ?;`

        const result = execute(query, [selectedFiles.activeFileId])

        console.log("Selected file from database:", result)

        setContent(result[0]?.content?.toString() || "")
        setType(result[0]?.name?.toString() || "")
        setSchema(JSON.parse(result[0]?.schema?.toString() || ""))

        if (result[0].name === "asset") {
          const url = await getValidBlobUrl(
            selectedFiles.activeFileId,
            result[0]?.content?.toString() || "",
            execute
          )
          setContent(url)
        }
      } catch (err) {
        console.error("Error fetching file from database:", err)
      }
    }

    getSelectedFile()
  }, [schemaInitialized, selectedFiles?.activeFileId])

  const handleInputChange = async (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    if (!selectedFiles) return
    const newContent = e.target.value
    setContent(newContent)

    const query = `
    UPDATE files
    SET content = ?
    WHERE id = ?;
    `
    try {
      execute(query, [newContent, selectedFiles.activeFileId])
    } catch (err) {
      console.error("Error updating content:", err)
    }
  }

  return (
    <div className="flex-1 p-2 h-full flex flex-col">
      {type === "asset" ? (
        <img src={content} alt="Selected Asset" />
      ) : (
        <>
          <MetadataForm
            schema={schema}
            selectedFiles={selectedFiles}
            isOpen={isOpen}
            setIsOpen={setIsOpen}
          />

          <Textarea
            className="h-20 flex-grow resize-none font-mono"
            placeholder="Enter your code here..."
            value={content}
            onChange={handleInputChange}
            disabled={isOpen}
          />
        </>
      )}
    </div>
  )
}
