import { useEffect, useState } from "react"
import {
  extensionMap,
  headingMap,
  type Collection,
  type FileData,
  type SelectedFiles,
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
  selectedFiles,
  setSelectedFiles,
}: {
  type: Collection
  selectedFiles: SelectedFiles
  setSelectedFiles: React.Dispatch<React.SetStateAction<SelectedFiles>>
}) {
  const [isOpen, setIsOpen] = useState<boolean>(true)
  const [files, setFiles] = useState<FileData[]>([])
  const [contextMenuFile, setContextMenuFile] = useState<string>("")

  const { execute, loading, error, schemaInitialized } = useSqlContext()

  useEffect(() => {
    if (!schemaInitialized || loading || error) return
    const fetchData = async () => {
      try {
        const query = `
          SELECT files.id, files.name, files.content, models.name AS type
            FROM files
            JOIN models ON files.model_id = models.id
            WHERE models.name = '${type}';
        `
        if (!query) {
          throw new Error(`Unknown type: ${type}`)
        }
        const result = execute(query)
        const files = result.map((file: ParamsObject) => ({
          id: file.id as number,
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
  }, [execute, loading, error, schemaInitialized, selectedFiles])

  if (loading || !schemaInitialized) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  const handleAddFile = (type: Collection) => {
    if (!schemaInitialized || loading || error) return

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

    // Retrieve model IDs for inserting files
    const modelResult = execute(`SELECT id FROM models WHERE name = ?;`, [type])

    console.log("Result from SQL.js:", modelResult)
    if (
      !modelResult ||
      !Array.isArray(modelResult) ||
      modelResult.length === 0
    ) {
      throw new Error(`Model '${type}' not found.`)
    }
    console.log(modelResult[0])
    const modelId = modelResult[0]["id"] as number

    execute(
      "INSERT OR IGNORE INTO files (name, model_id, content, data) VALUES (?, ?, ?, ?);",
      [newFileName, modelId, "", JSON.stringify({ template: 2, title: "" })]
    )
    const result = execute("SELECT last_insert_rowid() as id;")

    console.log("insert result", result)
    setFiles([
      ...files,
      { id: result[0].id as number, name: newFileName, type, content: "" },
    ])
  }

  const handleUploadFile = async (type: Collection) => {
    if (!schemaInitialized || loading || error) return
    const input = document.createElement("input")
    input.type = "file"

    const uploadExtensionMap = {
      template: ".html,.htm,.hbs",
      partial: ".html,.htm,.hbsp",
      page: ".md",
      post: ".md",
      style: ".css",
      asset: "*",
    } as const
    input.accept = uploadExtensionMap[type]

    // const normalizedType = extensionMap[type]
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const content =
          type === "asset" ? await file.arrayBuffer() : await file.text()
        const newFile = { name: file.name, content }

        // Retrieve model IDs for inserting files
        const modelResult = execute(`SELECT id FROM models WHERE name = ?;`, [
          type,
        ])

        console.log("Result from SQL.js:", modelResult)
        if (
          !modelResult ||
          !Array.isArray(modelResult) ||
          modelResult.length === 0
        ) {
          throw new Error(`Model '${type}' not found.`)
        }
        console.log(modelResult[0])
        const modelId = modelResult[0]["id"] as number

        if (
          type === "asset" &&
          file.name.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)
        ) {
          const url = URL.createObjectURL(
            new Blob([content], { type: "image/*" })
          )

          execute(
            "INSERT OR IGNORE INTO files (name, model_id, content, data) VALUES (?, ?, ?, ?);",
            [file.name, modelId, url, JSON.stringify({})]
          )
        } else {
          execute(
            "INSERT OR IGNORE INTO files (name, model_id, content, data) VALUES (?, ?, ?, ?);",
            [
              file.name,
              modelId,
              content as string,
              JSON.stringify({ template: 2, title: "" }),
            ]
          )
        }

        const result = execute("SELECT last_insert_rowid() as id;")

        setFiles([...files, newFile] as FileData<string>[])
        setSelectedFiles({
          activeFileId: result[0].id as number,
          contentFileId:
            type === "page"
              ? (result[0].id as number)
              : selectedFiles.contentFileId,
        })

        // insert into IndexedDB
        if (type === "asset") {
          saveAssetToIndexedDB(result[0].id as number, new Blob([content]))
        }
      }
    }
    input.click()
  }

  const handleContextMenu = (e: React.MouseEvent<HTMLLIElement>) => {
    const fileName = e.currentTarget.textContent || ""
    setContextMenuFile(fileName) // Store the clicked file's name
  }

  const handleRenameFile = (id: number, newName: string) => {
    if (!schemaInitialized || loading || error) return
    execute("UPDATE files SET name = ? WHERE id = ?;", [newName, id])
    setFiles(files =>
      files.map(file => (file.id === id ? { ...file, name: newName } : file))
    )
  }

  const handleRenameFileClick = (id: number) => {
    const newName = prompt("Enter new name:", contextMenuFile as string)
    if (newName) {
      handleRenameFile(id, newName)
    }
  }

  const handleDeleteFile = (fileId: number) => {
    if (!schemaInitialized || loading || error) return

    execute(
      `
      DELETE FROM files
      WHERE id = ?
      `,
      [fileId, type]
    )
    setFiles(files => files.filter(file => file.id !== fileId))
    if (selectedFiles.activeFileId === fileId) {
      setSelectedFiles(selectedFiles => ({
        activeFileId: 0,
        contentFileId: 0,
      }))
    }
    if (type === "asset") {
      deleteAssetFromIndexedDB(fileId)
    }
  }

  const handleDeleteFileClick = (id: number) => {
    if (confirm(`Are you sure you want to delete ${contextMenuFile}?`)) {
      handleDeleteFile(id)
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
              <DropdownMenu key={file.id}>
                <li
                  onContextMenu={handleContextMenu}
                  className={`group/file flex cursor-pointer items-center gap-2 rounded p-2 ${
                    selectedFiles.activeFileId === file.id
                      ? "bg-accent"
                      : "hover:bg-accent/50"
                  }`}
                  onClick={() => {
                    console.log("selecting file", file)
                    setSelectedFiles(selectedFiles => ({
                      activeFileId: file.id,
                      contentFileId:
                        file.type === "page"
                          ? file.id
                          : selectedFiles.contentFileId,
                    }))
                  }}>
                  <File className="h-4 w-4" />
                  {(file.name.length > 16
                    ? file.name.slice(0, 16) + "..."
                    : file.name) +
                    (file.type === "template" || file.type === "style"
                      ? `.${extensionMap[file.type]}`
                      : "")}
                  <DropdownMenuTrigger className="ml-auto invisible group-hover/file:visible group-active:visible">
                    <DotsVerticalIcon />
                  </DropdownMenuTrigger>
                </li>

                <DropdownMenuContent>
                  <DropdownMenuItem
                    className="flex text-sm cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-accent hover:outline-none"
                    onClick={() => handleRenameFileClick(file.id)}>
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex text-sm cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-accent hover:outline-none"
                    onClick={() => handleDeleteFileClick(file.id)}>
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
