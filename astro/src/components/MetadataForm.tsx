import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SidebarTrigger } from "./ui/sidebar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"
import { useSqlContext } from "./SqlContext"
import { useEffect, useState } from "react"
import type { SelectedFiles } from "@/lib/types"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible"
import { Form, FormControl, FormField } from "./ui/form"
import { useForm } from "react-hook-form"

interface Field {
  name: string
  type: "string" | "number" | "date" | "array"
  required?: true
}

export interface Schema {
  fields: Field[]
}

interface MetadataProps {
  schema: Schema
  selectedFiles: SelectedFiles
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export function MetadataForm({
  schema,
  selectedFiles,
  isOpen,
  setIsOpen,
}: MetadataProps) {
  const form = useForm()

  const { execute, loading, error, schemaInitialized } = useSqlContext()
  const [data, setData] = useState<Record<string, any>>({}) // TODO: types - schema can only be known at runtime
  const [templates, setTemplates] = useState<Map<number, string>>(new Map())

  console.log("schema: ", schema)
  console.log("data: ", data)

  // get data from db and set state
  useEffect(() => {
    if (!schemaInitialized || loading || error) return

    try {
      const query = `SELECT files.name, files.id FROM files JOIN models ON files.model_id = models.id WHERE models.name = 'template';`
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

    try {
      const query = `SELECT files.data FROM files WHERE files.id = ?;`
      const result = execute(query, [selectedFiles.activeFileId]) as {
        data: any
      }[]
      console.log("Data from database:", JSON.parse(result[0].data))
      setData(JSON.parse(result[0].data))
    } catch (err) {
      console.error("Error fetching data from database:", err)
    }
  }, [schemaInitialized, selectedFiles, isOpen])

  const handleSubmit = (data: Record<string, any>) => {
    console.log("form data", data)
    if (isOpen) {
      console.log("returning because isOpen")
      return
    }

    for (const field of schema.fields) {
      if (field.required && data[field.name] === undefined) {
        console.error(`Field ${field.name} is required but not provided`)
        return
      }
    }

    setData(data)

    const query = `
    UPDATE files
    SET data = ?
    WHERE id = ?;
    `
    try {
      execute(query, [JSON.stringify(data), selectedFiles.activeFileId])
      setData(data)
    } catch (err) {
      console.error("Error updating data:", err)
    }
  }

  const renderField = (field: Field) => {
    if (field.name === "template")
      return (
        <FormField
          name={"template"}
          control={form.control}
          defaultValue={data[field.name].toString()}
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
    switch (field.type) {
      case "string":
        return (
          <FormField
            name={field.name}
            control={form.control}
            defaultValue={data[field.name]}
            render={({ field }) => <Input {...field} />}
          />
        )
      case "number":
        return (
          <FormField
            name={field.name}
            control={form.control}
            defaultValue={data[field.name]}
            render={({ field }) => <Input {...field} />}
          />
        )
      case "date":
        return (
          <FormField
            name={field.name}
            control={form.control}
            defaultValue={data[field.name]}
            render={({ field }) => <Input type="date" {...field} />}
          />
        )
      case "array":
        return (
          <FormField
            name={field.name}
            control={form.control}
            defaultValue={data[field.name]}
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
      default:
        return null
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-2">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <div className="w-full flex justify-between">
            <SidebarTrigger />
            {schema.fields.length > 0 && (
              <CollapsibleTrigger asChild>
                {isOpen ? (
                  <Button type="submit">Done</Button>
                ) : (
                  <Button variant="secondary" type="submit">
                    Edit
                  </Button>
                )}
              </CollapsibleTrigger>
            )}
          </div>

          <CollapsibleContent>
            {schema.fields.map(field => (
              <div
                key={field.name}
                className="space-y-2 flex items-baseline gap-4">
                <Label
                  htmlFor={field.name}
                  className="text-gray-600 font-light pl-1 capitalize w-20 shrink-0">
                  {field.name}
                </Label>
                {renderField(field)}
              </div>
            ))}
          </CollapsibleContent>
          <div className="text-sm text-gray-500 pb-4 flex flex-col">
            <span>{selectedFiles.activeFileId}</span>
            <span>{JSON.stringify(data)}</span>
          </div>
        </Collapsible>
      </form>
    </Form>
  )
}
