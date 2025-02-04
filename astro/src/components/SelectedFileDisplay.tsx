import { useSqlContext } from "./SqlContext"
import { type Collection, type FileData } from "../lib/types"
import { AutoResizeTextarea, Textarea } from "./ui/textarea"
import { useBlobStore } from "./BlobStoreContext"
import { Form, FormControl, FormField } from "./ui/form"
import { Label } from "./ui/label"
import { useForm } from "react-hook-form"
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
  const form = useForm()

  const client = useClient()

  const { render } = useRender()
  const { execute, loading, error, schemaInitialized } = useSqlContext()

  console.log("schema", schema)

  const handlePublishFile = async () => {
    if (!schemaInitialized || loading || error) return
    if (!file.data || !file.data.body || !file.data.body.content) return

    if (!file) return
    console.log("uploading file", file)

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
        setFile(newFile)
        execute("UPDATE file SET url = ? WHERE id = ?;", [url, file.id])
      } catch (error) {
        console.error("Error fetching blob:", error)
      } finally {
        return
      }
    }

    if (file.type === "templateAsset") {
      let mimeType = "text/css"
      if (file.name.endsWith(".js")) {
        mimeType = "text/javascript"
      }
      const blob = new Blob([file.data.body.content], { type: mimeType })
      const url = await client.uploadFile(blob, file.name, mimeType)
      if (!url) {
        throw new Error("No url found")
      }
      const newFile = {
        ...file,
        url,
      }
      setFile(newFile)
      execute("UPDATE file SET url = ? WHERE id = ?;", [url, file.id])
      return
    }

    // render file if it is not an asset
    try {
      const query =
        "SELECT file.id, file.name, file.data, file.url, model.name as type FROM file JOIN model ON file.model_id = model.id;"
      const result = execute(query)
      // console.log("Preview.tsx: Result from SQL.js:", result)
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
    } catch (err) {
      console.error("Error during render:", err)
    }
  }

  const handleDataChange = (formData: Record<string, any>) => {
    console.log("form data", formData)
    // console.log("Editor data", editor?.getHTML())

    const newData = { ...file.data }
    for (const field of schema.fields) {
      if (field.required && formData[field.name] === undefined) {
        console.error(`Field ${field.name} is required but not provided`)
        return
      }
      newData[field.name] = formData[field.name]
      if (field.name === "body") {
        newData.body = { type: "html", content: formData.body }
      }
    }

    setFile(file => ({ ...file, newData }))

    console.log("newData", newData)

    const query = `
    UPDATE file
    SET data = ?
    WHERE id = ?;
    `
    try {
      execute(query, [JSON.stringify(newData), file.id])
      setFile(file => ({ ...file, newData }))
    } catch (err) {
      console.error("Error updating data:", err)
    }
  }

  const renderFieldWithLabel = (field: Field) => {
    if (field.type === "html")
      return (
        <div className="flex flex-col gap-2">
          <Label htmlFor="body" className="capitalize">
            Body
          </Label>
          <Editor
            key={file.id}
            file={file}
            onChange={html => {
              handleDataChange({
                ...form.getValues(),
                body: html,
              })
            }}
          />
        </div>
      )

    return (
      <div className="flex flex-col gap-2">
        <Label htmlFor={field.name} className="capitalize">
          {field.name}
        </Label>
        {renderField(field)}
      </div>
    )
  }

  const renderField = (field: Field) => {
    if (!file.data) return null
    const defaultValue = file.data[field.name] || ""
    if (field.name === "template") {
      return (
        <FormField
          name={"template"}
          control={form.control}
          defaultValue={defaultValue.toString()}
          render={({ field: controlledField }) => (
            <Select
              name="Template"
              onValueChange={controlledField.onChange}
              defaultValue={controlledField.value}>
              <FormControl>
                <SelectTrigger className="">
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
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
          )}
        />
      )
    }

    switch (field.type) {
      case "string":
        return (
          <FormField
            name={field.name}
            control={form.control}
            defaultValue={file.data[field.name]}
            render={({ field }) => <Input {...field} />}
          />
        )
      case "number":
        return (
          <FormField
            name={field.name}
            control={form.control}
            defaultValue={file.data[field.name]}
            render={({ field }) => <Input {...field} />}
          />
        )
      case "date":
        return (
          <FormField
            name={field.name}
            control={form.control}
            defaultValue={file.data[field.name]}
            render={({ field }) => <Input type="date" {...field} />}
          />
        )
      case "array":
        return (
          <FormField
            name={field.name}
            control={form.control}
            defaultValue={file.data[field.name]}
            render={({ field: controlledField }) => (
              <div className="space-y-2">
                {controlledField.value.map((item: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      value={item}
                      onChange={e => {
                        const newValue = [...controlledField.value]
                        newValue[index] = e.target.value
                        controlledField.onChange(newValue)
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newValue = controlledField.value.filter(
                          (_: string, i: number) => i !== index
                        )
                        controlledField.onChange(newValue)
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
                    controlledField.onChange([...controlledField.value, ""])
                  }>
                  Add Item
                </Button>
              </div>
            )}
          />
        )
      case "plaintext":
        return (
          <FormField
            name={field.name}
            control={form.control}
            render={({ field: controlledField }) => (
              <AutoResizeTextarea
                key={file.id}
                {...controlledField}
                className="flex-grow h-20 font-mono resize-none"
                placeholder="Enter your content here..."
                value={file.data?.body?.content || ""}
                onInput={e => {
                  controlledField.onChange(e.currentTarget.value)
                }}
              />
            )}
          />
        )
      default:
        return null
    }
  }

  // with the controlled form inputs, the first time the form is rendered they can get stuck with
  // whatever values they are given at that point. So this basically is here to make sure there is data
  // to render.
  if (templates.size === 0) {
    console.error("No templates found")
    return null
  }

  return (
    <div className="relative flex flex-col items-center justify-center flex-1 h-screen pt-12 min-w-96 bg-zinc-700">
      <header className="absolute top-0 left-0 right-0 flex items-center w-full h-12 px-4 mb-auto font-medium border-b border-black shadow-xl text-zinc-200 bg-zinc-900">
        {file.name}
        {file.url}
        <Button
          className="ml-auto mr-2 text-black bg-green-400 hover:bg-green-500"
          onClick={handlePublishFile}>
          Publish
        </Button>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X />
        </Button>
      </header>

      <Card className="w-4/5 p-4 max-h-4/5">
        {type === "asset" ? (
          <div className="flex flex-col gap-2">
            <img src={file.blob_url} alt="Selected Asset" />
          </div>
        ) : (
          <Form {...form}>
            <form
              onChange={form.handleSubmit(handleDataChange)}
              className="flex flex-col h-full mb-2 space-y-2">
              {schema.fields.map(renderFieldWithLabel)}
            </form>
          </Form>
        )}
      </Card>
    </div>
  )
}
