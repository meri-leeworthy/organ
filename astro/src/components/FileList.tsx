import { useEffect, useState } from "react"
import {
  extensionMap,
  headingMap,
  type Collection,
  type FileData,
  type SelectedFile,
} from "../lib/types"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible"
import { File, Plus } from "lucide-react"
import { useSqlContext } from "./SqlContext"
import type { ParamsObject } from "sql.js"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { deleteAssetFromIndexedDB, saveAssetToIndexedDB } from "@/lib/idbHelper"
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
} from "./ui/sidebar"
import { DotsVerticalIcon } from "@radix-ui/react-icons"

export function FileList({
  type,
  selectedFile,
  setSelectedFile,
}: {
  type: Collection
  selectedFile: SelectedFile
  setSelectedFile: React.Dispatch<React.SetStateAction<SelectedFile>>
}) {
  const [isOpen, setIsOpen] = useState<boolean>(true)
  const [files, setFiles] = useState<FileData[]>([])
  const [contextMenuFile, setContextMenuFile] = useState<string>("")

  const { execute, loading, error, schemaInitialized } = useSqlContext()

  useEffect(() => {
    if (!schemaInitialized || loading || error) return
    const fetchData = async () => {
      try {
        const queryMap = {
          template: "SELECT * FROM files WHERE type IN ('hbs');",
          content: "SELECT * FROM files WHERE type = 'md';",
          asset: "SELECT * FROM files WHERE type = 'asset';",
          css: "SELECT * FROM files WHERE type = 'css';",
        }

        const query = queryMap[type]
        const result = execute(query)
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
  }, [execute, loading, error, schemaInitialized, selectedFile])

  if (loading || !schemaInitialized) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  const handleAddFile = (type: Collection) => {
    if (!schemaInitialized || loading || error) return
    const fileExtension = type === "template" ? "hbs" : "md"

    // Function to generate unique filename
    const generateUniqueFileName = (baseName: string, files: FileData[]) => {
      let fileName = `${baseName}`
      let counter = 1

      // Check if file with this name already exists
      while (files.some(file => file.name === fileName)) {
        fileName = `${baseName}${counter}`
        counter++
      }

      return fileName
    }

    const newFileName = generateUniqueFileName("untitled", files)

    execute(
      "INSERT OR IGNORE INTO files (name, type, content) VALUES (?, ?, ?);",
      [newFileName, fileExtension, ""]
    )
    setFiles([
      ...files,
      { name: newFileName, type: fileExtension, content: "" },
    ])
  }

  const handleUploadFile = async (type: Collection) => {
    if (!schemaInitialized || loading || error) return
    const input = document.createElement("input")
    input.type = "file"

    const uploadExtensionMap = {
      template: ".html,.htm,.hbs",
      content: ".md",
      css: ".css",
      asset: "*",
    }
    input.accept = uploadExtensionMap[type]

    const normalizedType = extensionMap[type]
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const content =
          type === "asset" ? await file.arrayBuffer() : await file.text()
        const newFile = { name: file.name, content }

        if (
          type === "asset" &&
          file.name.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)
        ) {
          const url = URL.createObjectURL(
            new Blob([content], { type: "image/*" })
          )

          execute(
            "INSERT OR IGNORE INTO files (name, type, content) VALUES (?, ?, ?);",
            [file.name, normalizedType, url]
          )
        } else {
          execute(
            "INSERT OR IGNORE INTO files (name, type, content) VALUES (?, ?, ?);",
            [file.name, normalizedType, content as string]
          )
        }

        setFiles([...files, newFile] as FileData<string>[])
        setSelectedFile({
          activeFile: file.name,
          type: normalizedType,
          contentFile:
            type === "content" ? file.name : selectedFile.contentFile,
        })

        // insert into IndexedDB
        if (type === "asset") {
          saveAssetToIndexedDB(file.name, new Blob([content]))
        }
      }
    }
    input.click()
  }

  const handleContextMenu = (e: React.MouseEvent<HTMLLIElement>) => {
    const fileName = e.currentTarget.textContent || ""
    setContextMenuFile(fileName) // Store the clicked file's name
  }

  const handleRenameFile = (oldName: string, newName: string) => {
    if (!schemaInitialized || loading || error) return
    execute("UPDATE files SET name = ? WHERE name = ?;", [newName, oldName])
    setFiles(files =>
      files.map(file =>
        file.name === oldName ? { ...file, name: newName } : file
      )
    )
    if (selectedFile.activeFile === oldName) {
      setSelectedFile(selectedFile => ({
        activeFile: newName,
        type: selectedFile.type,
        contentFile: selectedFile.contentFile,
      }))
    }
  }

  const handleRenameFileClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const newName = prompt("Enter new name:", contextMenuFile as string)
    if (newName) {
      handleRenameFile(contextMenuFile as string, newName)
    }
  }

  const handleDeleteFile = (fileName: string) => {
    if (!schemaInitialized || loading || error) return

    const extension = extensionMap[type]
    execute("DELETE FROM files WHERE name = ? AND type = ?;", [
      fileName,
      extension,
    ])
    setFiles(files => files.filter(file => file.name !== fileName))
    if (selectedFile.activeFile === fileName) {
      setSelectedFile(selectedFile => ({
        activeFile: "",
        type: selectedFile.type,
        contentFile: selectedFile.contentFile,
      }))
    }
    if (type === "asset") {
      deleteAssetFromIndexedDB(fileName)
    }
  }

  const handleDeleteFileClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (confirm(`Are you sure you want to delete ${contextMenuFile}?`)) {
      handleDeleteFile(contextMenuFile as string)
    }
  }

  const heading = headingMap[type]

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="group/collapsible">
      <SidebarGroup>
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger>{heading}</CollapsibleTrigger>
        </SidebarGroupLabel>
        <SidebarGroupAction title={"Add " + type}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Plus className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {type === "asset" ? null : (
                <DropdownMenuItem onClick={() => handleAddFile(type)}>
                  New File
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => handleUploadFile(type)}>
                Upload File
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarGroupAction>

        <CollapsibleContent>
          <ul className="">
            {files.map(file => (
              <DropdownMenu key={file.name}>
                <li
                  onContextMenu={handleContextMenu}
                  className={`group/file flex cursor-pointer items-center gap-2 rounded p-2 ${
                    selectedFile.activeFile === file.name &&
                    selectedFile.type === file.type
                      ? "bg-accent"
                      : "hover:bg-accent/50"
                  }`}
                  onClick={() =>
                    setSelectedFile(selectedFile => ({
                      activeFile: file.name,
                      type: file.type,
                      contentFile:
                        file.type === "md"
                          ? file.name
                          : selectedFile.contentFile,
                    }))
                  }>
                  <File className="h-4 w-4" />
                  {/* {file.name.length > 12
                    ? file.name.slice(0, 12) + "..."
                    : file.name} */}
                  {file.name}
                  <DropdownMenuTrigger className="ml-auto invisible group-hover/file:visible group-active:visible">
                    <DotsVerticalIcon />
                  </DropdownMenuTrigger>
                </li>

                <DropdownMenuContent>
                  <DropdownMenuItem
                    className="flex text-sm cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-accent hover:outline-none"
                    onClick={handleRenameFileClick}>
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex text-sm cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-accent hover:outline-none"
                    onClick={handleDeleteFileClick}>
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ))}
          </ul>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
}
