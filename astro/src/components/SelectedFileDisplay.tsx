import { useSqlContext } from "./SqlContext"
import { type Collection, type FileData } from "../lib/types"
import { AutoResizeTextarea } from "./ui/textarea"
import { useBlobStore } from "./BlobStoreContext"
import { Label } from "./ui/label"
import {
  Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "./ui/select"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Card } from "./ui/card"
import { X } from "lucide-react"
import { useClient } from "@/hooks/useClient"
import useRender from "@/hooks/useRender"
import type { ParamsObject } from "sql.js"
import { EditorComponent as Editor } from "./Editor"
import type { Schema } from "./FileContainer"
import { useState } from "react"
import { toast } from "sonner"
import { SidebarTrigger } from "./ui/sidebar"

export interface Field {
  name: string
  type: "string" | "number" | "date" | "array" | "plaintext" | "html"
  required?: true
}

export const SelectedFileDisplay = ({
  file,
  setFile,
  type,
  schema,
  templates,
  onClose,
}: {
  file: FileData
  setFile: React.Dispatch<React.SetStateAction<FileData<Record<string, any>>>>
  type: Collection
  schema: Schema
  templates: Map<number, string>
  onClose: () => void
}) => {
  if (!file) return null

  const blobStore = useBlobStore()
  const client = useClient()
  const { render } = useRender()
  const { execute, loading, error, schemaInitialized } = useSqlContext()
  const [publishLoading, setPublishLoading] = useState(false)

  console.log("schema", schema)

  const handlePublishFile = async () => {
    if (!schemaInitialized || loading || error || !file) return
    console.log("uploading file", file)
    setPublishLoading(true)
    if (file.type === "asset") {
      const blob = await blobStore.getBlob(file.id)

      try {
        if (!file.data?.mime_type) {
          throw new Error("No mime type found")
        }
        const url = await client.uploadFile(
          blob,
          file.name,
          file.data.mime_type
        )
        if (!url) {
          throw new Error("No url found")
        }
        const newFile = {
          ...file,
          url,
        }
        console.log("success", newFile)
        setFile(newFile)
        execute("UPDATE file SET url = ? WHERE id = ?;", [url, file.id])
        setPublishLoading(false)
        toast.success("File published")
      } catch (error) {
        setPublishLoading(false)
        toast.error((error as Error).message)
      }
      return
    }

    if (!file.data || !file.data.body || !file.data.body.content) return

    if (file.type === "templateAsset") {
      try {
        let mimeType = "text/css"
        if (file.name.endsWith(".js")) {
          mimeType = "text/javascript"
        }
        const blob = new Blob([file.data.body.content], { type: mimeType })
        const url = await client.uploadFile(blob, file.name, mimeType)
        if (!url) throw new Error("No url found")
        const newFile = {
          ...file,
          url,
        }
        setFile(newFile)
        execute("UPDATE file SET url = ? WHERE id = ?;", [url, file.id])
        setPublishLoading(false)
        toast.success("File published")
      } catch (error) {
        setPublishLoading(false)
        toast.error((error as Error).message)
      }
      return
    }

    // render file if it is not an asset
    try {
      const query =
        "SELECT file.id, file.name, file.data, file.url, model.name as type FROM file JOIN model ON file.model_id = model.id;"
      const result = execute(query)
      const files = result.map((file: ParamsObject): [number, FileData] => [
        file.id as number,
        {
          id: file.id as number,
          name: file.name?.toString() || "",
          type: file.type?.toString() as FileData["type"],
          data: JSON.parse(file.data?.toString() || "{}"),
          url: file.url?.toString() || "",
        },
      ])
      const renderedFile = render(file.id, new Map(files))

      console.log("renderedFile", renderedFile)

      // now upload the rendered file
      const blob = new Blob([renderedFile], { type: "text/html" })
      const url = await client.uploadFile(blob, file.name, "text/html")
      if (!url) {
        throw new Error("No url found")
      }
      const newFile = {
        ...file,
        url,
      }
      setFile(newFile)
      execute("UPDATE file SET url = ? WHERE id = ?;", [url, file.id])
      setPublishLoading(false)
      toast.success("File published")
    } catch (error) {
      setPublishLoading(false)
      toast.error((error as Error).message)
    }
  }

  const handleDataChange = (fieldName: string, value: any) => {
    const newData = { ...file.data }

    if (fieldName === "body") {
      newData.body = { type: "html", content: value }
    } else {
      newData[fieldName] = value
    }

    const query = `
    UPDATE file
    SET data = ?
    WHERE id = ?;
    `
    try {
      execute(query, [JSON.stringify(newData), file.id])
      setFile({ ...file, data: newData })
    } catch (err) {
      console.error("Error updating data:", err)
    }
  }

  const renderFieldWithLabel = (field: Field) => {
    if (field.type === "html")
      return (
        <div className="flex flex-col gap-2" key={`${file.id}-${field.name}`}>
          <Label htmlFor="body" className="capitalize">
            Body
          </Label>
          <Editor
            key={file.id}
            file={file}
            onChange={html => handleDataChange("body", html)}
          />
        </div>
      )

    return (
      <div className="flex flex-col gap-2" key={`${file.id}-${field.name}`}>
        <Label htmlFor={field.name} className="capitalize">
          {field.name}
        </Label>
        {renderField(field)}
      </div>
    )
  }

  const renderField = (field: Field) => {
    if (!file.data) return null
    const value =
      field.name === "body" ? file.data?.body?.content : file.data[field.name]

    if (field.name === "template") {
      return (
        <Select
          value={value?.toString()}
          onValueChange={value => handleDataChange(field.name, value)}>
          <SelectTrigger className="">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[...templates.entries()].map(template => (
              <SelectItem
                key={template[0]}
                value={template[0].toString()}
                textValue={template[1]}>
                {template[1]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    switch (field.type) {
      case "string":
        return (
          <Input
            value={value || ""}
            onChange={e => handleDataChange(field.name, e.target.value)}
          />
        )
      case "number":
        return (
          <Input
            type="number"
            value={value || ""}
            onChange={e => handleDataChange(field.name, e.target.value)}
          />
        )
      case "date":
        return (
          <Input
            type="date"
            value={value || ""}
            onChange={e => handleDataChange(field.name, e.target.value)}
          />
        )
      case "array":
        return (
          <div className="space-y-2">
            {(value || []).map((item: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  value={item}
                  onChange={e => {
                    const newValue = [...value]
                    newValue[index] = e.target.value
                    handleDataChange(field.name, newValue)
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newValue = value.filter(
                      (_: string, i: number) => i !== index
                    )
                    handleDataChange(field.name, newValue)
                  }}>
                  Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                handleDataChange(field.name, [...(value || []), ""])
              }>
              Add Item
            </Button>
          </div>
        )
      case "plaintext":
        return (
          <AutoResizeTextarea
            key={file.id}
            className="flex-grow h-20 font-mono resize-none"
            placeholder="Enter your content here..."
            value={value || ""}
            onInput={e => {
              console.log("handling change", field, e.currentTarget.value)
              handleDataChange(field.name, e.currentTarget.value)
            }}
          />
        )
      default:
        return null
    }
  }

  if (templates.size === 0) {
    console.error("No templates found")
    return null
  }

  return (
    <div className="relative z-0 flex flex-col items-center justify-center flex-1 h-screen pt-12 min-w-96 bg-zinc-700">
      <header className="absolute top-0 left-0 right-0 flex items-center w-full h-8 max-w-full px-4 mb-auto overflow-hidden font-mono text-sm font-medium border-b border-black shadow-xl text-zinc-300 bg-zinc-900 text-nowrap text-ellipsis">
        {file.name}

        <a
          href={file.url}
          target="_blank"
          className="flex-grow ml-2 mr-auto overflow-hidden border-pink-400 text-zinc-400 text-nowrap text-ellipsis"
          rel="noopener noreferrer">
          {file.url}
        </a>
        {file.type !== "template" && (
          <Button
            className={`font-sans h-6 px-2 mr-2 ml-2 border rounded-xl border-green-400 hover:text-white text-zinc-900 bg-green-400 ${
              publishLoading ? "bg-green-500 text-zinc-900 animate-pulse" : ""
            }`}
            onClick={handlePublishFile}>
            Post
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="w-6 h-6 rounded-full">
          <X />
        </Button>
      </header>

      <Card className="w-5/6 p-4 my-10 overflow-y-scroll">
        {type === "asset" ? (
          <div className="flex flex-col gap-2">
            <img src={file.blob_url} alt="Selected Asset" />
          </div>
        ) : (
          <div className="flex flex-col h-full space-y-2">
            {schema.fields.map(renderFieldWithLabel)}
          </div>
        )}
      </Card>
    </div>
  )
}
