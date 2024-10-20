import { useEffect, useState } from "react"
import type { FileData, SelectedFile } from "../lib/types"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible"
import { ChevronDown, ChevronRight, File, Plus } from "lucide-react"
import { useSqlContext } from "./SqlContext"
import type { ParamsObject } from "sql.js"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { Button } from "./ui/button"

export function FileList<T>({
  type,
  selectedFile,
  setSelectedFile,
}: {
  type: "template" | "content" | "asset"
  selectedFile: SelectedFile
  setSelectedFile: React.Dispatch<React.SetStateAction<SelectedFile>>
}) {
  const [isOpen, setIsOpen] = useState<boolean>(true)
  const [files, setFiles] = useState<FileData[]>([])

  const { execute, loading, error, schemaInitialized } = useSqlContext()

  useEffect(() => {
    if (!schemaInitialized || loading || error) return
    const fetchData = async () => {
      try {
        const query =
          type === "template"
            ? "SELECT * FROM files WHERE type IN ('css', 'hbs');"
            : type === "content"
              ? "SELECT * FROM files WHERE type = 'md';"
              : "SELECT * FROM files WHERE type = 'asset';"
        const result = await execute(query)
        const files = result.map((file: ParamsObject) => ({
          name: file.name?.toString() || "",
          content: file.content?.toString() || "",
          type: file.type?.toString() as FileData["type"],
        }))
        console.log("Result from SQL.js:", result)
        setFiles(files)
      } catch (err) {
        console.error("Error fetching data:", err)
      }
    }

    fetchData()
  }, [execute, loading, error, schemaInitialized])

  if (loading || !schemaInitialized) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  const handleAddFile = (type: "template" | "content" | "asset") => {
    if (!schemaInitialized || loading || error) return
    const fileExtension = type === "template" ? "hbs" : "md"

    // Function to generate unique filename
    const generateUniqueFileName = (
      baseName: string,
      files: FileData[],
      extension: string
    ) => {
      let fileName = `${baseName}.${extension}`
      let counter = 1

      // Check if file with this name already exists
      while (files.some(file => file.name === fileName)) {
        fileName = `${baseName}${counter}.${extension}`
        counter++
      }

      return fileName
    }

    const newFileName = generateUniqueFileName("newfile", files, fileExtension)

    console.log(
      "Running INSERT INTO files query with new file: ",
      newFileName,
      " of type: ",
      fileExtension
    )

    execute(
      "INSERT OR IGNORE INTO files (name, type, content) VALUES (?, ?, ?);",
      [newFileName, fileExtension, ""]
    )
    setFiles([
      ...files,
      { name: newFileName, type: fileExtension, content: "" },
    ])
  }

  // const handleUploadFile = async (type: "template" | "content" | "asset") => {
  //   const input = document.createElement("input")
  //   input.type = "file"
  //   input.accept =
  //     type === "template" ? ".html" : type === "content" ? ".md" : "*"
  //   input.onchange = async (e: Event) => {
  //     const file = (e.target as HTMLInputElement).files?.[0]
  //     if (file) {
  //       const content =
  //         type === "asset" ? await file.arrayBuffer() : await file.text()
  //       const newFile = { name: file.name, content }
  //       if (type === "template") {
  //         setTemplates([...templates, newFile] as FileData<string>[])
  //       } else if (type === "content") {
  //         setContentFiles([...contentFiles, newFile] as FileData<string>[])
  //       } else {
  //         setAssets([...assets, newFile] as FileData<ArrayBuffer>[])
  //       }
  //       setSelectedFileName(file.name)
  //     }
  //   }
  //   input.click()
  // }

  // const handleRemoveAsset = (fileName: string) => {
  //   setAssets(prevAssets => prevAssets.filter(file => file.name !== fileName))
  //   setImageURLs(prevURLs => {
  //     const { [fileName]: _, ...rest } = prevURLs
  //     URL.revokeObjectURL(_)
  //     return rest
  //   })
  // }

  const heading =
    type === "template"
      ? "Templates"
      : type === "content"
        ? "Content"
        : "Assets"

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-[200px]">
      <div className="flex w-full items-center justify-between p-4 pr-2 font-semibold">
        <CollapsibleTrigger>{heading}</CollapsibleTrigger>
        <div className="flex items-center space-x-2">
          <CollapsibleTrigger>
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </CollapsibleTrigger>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleAddFile(type)}>
                New File
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => 'handleUploadFile("template")'}>
                Upload File
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CollapsibleContent>
        <ul className="p-4">
          {files.map(file => (
            <li
              key={file.name}
              className={`flex cursor-pointer items-center gap-2 rounded p-2 ${
                selectedFile.activeFile === file.name
                  ? "bg-accent"
                  : "hover:bg-accent/50"
              }`}
              onClick={() =>
                setSelectedFile(selectedFile => ({
                  activeFile: file.name,
                  type: file.type,
                  contentFile:
                    file.type === "md" ? file.name : selectedFile.contentFile,
                }))
              }>
              <File className="h-4 w-4" />
              {file.name.length > 12
                ? file.name.slice(0, 12) + "..."
                : file.name}
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  )
}
