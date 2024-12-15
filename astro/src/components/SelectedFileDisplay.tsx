import { useEffect, useState } from "react"
import { useSqlContext } from "./SqlContext"
import type { SelectedFile } from "../lib/types"
import { Textarea } from "./ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"
import { SidebarTrigger } from "./ui/sidebar"
import { getValidBlobUrl } from "@/lib/utils"

// I guess the idea here is now to create an interface for the structured data of the content
// which is no longer YAML but JSON
// first, I need to edit the schema for the SQLite database

export const SelectedFileDisplay = ({
  selectedFile,
}: {
  selectedFile: SelectedFile
}) => {
  const { execute, loading, error, schemaInitialized } = useSqlContext()
  const [content, setContent] = useState<string>("")
  const [data, setData] = useState<any>({})
  const [templates, setTemplates] = useState<string[]>([])

  useEffect(() => {
    if (!schemaInitialized || loading || error || !selectedFile) return

    const getSelectedFile = async () => {
      try {
        const query = `SELECT * FROM files WHERE name = ? AND type = ?;`
        const result = execute(query, [
          selectedFile.activeFile,
          selectedFile.type,
        ])

        setContent(result[0]?.content?.toString() || "")
        setData(JSON.parse(result[0]?.data?.toString() || "{}"))

        if (selectedFile.type === "asset") {
          const url = await getValidBlobUrl(
            selectedFile.activeFile,
            result[0]?.content?.toString() || "",
            execute
          )
          setContent(url)
        }
      } catch (err) {
        console.error("Error fetching file from database:", err)
      }
    }

    const getTemplates = async () => {
      try {
        const query = `SELECT name FROM files WHERE type = 'hbs';`
        const result = execute(query) as { name: string }[]
        console.log("Templates from database:", result)
        setTemplates(result.map((file: { name: string }) => file.name))
      } catch (err) {
        console.error("Error fetching templates from database:", err)
      }
    }

    getSelectedFile()
    getTemplates()
  }, [schemaInitialized, selectedFile?.activeFile])

  const handleInputChange = async (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    if (!selectedFile) return
    const newContent = e.target.value
    setContent(newContent)

    const query = `
    UPDATE files
    SET content = ?
    WHERE name = ?
    AND type = ?;
    `
    try {
      execute(query, [newContent, selectedFile.activeFile, selectedFile.type])
    } catch (err) {
      console.error("Error updating content:", err)
    }
  }

  const handleTemplateChange = async (newTemplate: string) => {
    console.log("New template:", newTemplate)

    const query = `
    UPDATE files
    SET data = ?
    WHERE name = ?
    AND type = ?;
    `
    try {
      execute(query, [
        JSON.stringify({ template: newTemplate }),
        selectedFile.activeFile,
        selectedFile.type,
      ])
      setData({ ...data, template: newTemplate })
    } catch (err) {
      console.error("Error updating template:", err)
    }
  }

  return (
    <div className="flex-1 p-2 h-full flex flex-col">
      {selectedFile?.type === "asset" ? (
        <img src={content} alt="Selected Asset" />
      ) : (
        <>
          <div className="flex justify-between pb-2">
            <SidebarTrigger />
            <Select value={data.template} onValueChange={handleTemplateChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map(template => (
                  <SelectItem key={template} value={template}>
                    {template}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-gray-500 pb-4 flex flex-col">
            <span>{selectedFile.activeFile}</span>
            <span>{JSON.stringify(data)}</span>
          </div>

          <Textarea
            className="h-20 flex-grow resize-none font-mono"
            placeholder="Enter your code here..."
            value={content}
            onChange={handleInputChange}
          />
        </>
      )}
    </div>
  )
}
