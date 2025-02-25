import { useEffect, useState } from "react"
import {
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
import { Plus } from "lucide-react"
import { useSqlContext } from "./SqlContext"
import type { ParamsObject } from "sql.js"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
} from "./ui/sidebar"

import { useBlobStore } from "./BlobStoreContext"
import { MODEL_IDS } from "@/lib/consts"
import { loadAssetFile, loadTextFile } from "@/lib/loadFile"
import { FileListItem } from "./FileListItem"

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
  const [files, setFiles] = useState<Map<number, FileData>>(new Map())

  const { execute, loading, error, schemaInitialized } = useSqlContext()
  const blobStore = useBlobStore()

  // console.log("files", files)

  useEffect(() => {
    if (!schemaInitialized || loading || error) return

    try {
      const query = `
          SELECT file.id, file.name, file.data, file.url, model.name AS type
            FROM file
            JOIN model ON file.model_id = model.id
            WHERE model.name = '${type}';
        `
      if (!query) {
        throw new Error(`Unknown type: ${type}`)
      }
      const result = execute(query)
      console.log("Result from SQL.js:", result)
      const files: FileData[] = result.map((file: ParamsObject) => ({
        id: file.id as number,
        name: file.name?.toString() || "",
        type: file.type?.toString() as FileData["type"],
        data: JSON.parse(file.data?.toString() || "{}") as FileData["data"],
        url: file.url?.toString() || "",
      }))
      setFiles(new Map(files.map(file => [file.id, file])))
    } catch (err) {
      console.error("Error fetching data:", err)
    }
  }, [execute, loading, error, schemaInitialized, selectedFiles])

  if (loading || !schemaInitialized) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  const handleCreateFile = (type: Collection) => {
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

    const newFileName = generateUniqueFileName("untitled", [...files.values()])

    execute(
      "INSERT OR IGNORE INTO file (name, model_id, data) VALUES (?, ?, ?);",
      [
        newFileName,
        MODEL_IDS[type],
        JSON.stringify({
          template: 2,
          title: "",
          body: { type: "html", content: "" },
        }),
      ]
    )
    const result = execute("SELECT last_insert_rowid() as id;")
    console.log("insert result", result)

    const newFile: FileData = {
      id: result[0].id as number,
      name: newFileName,
      type,
      data: {
        body: {
          type: "html",
          content: "",
        },
      },
      url: "",
    }

    setFiles(files => files.set(newFile.id, newFile))
  }

  const handleLoadFile = async (type: Collection) => {
    if (!schemaInitialized || loading || error) return
    const input = document.createElement("input")
    input.type = "file"

    const loadExtensionMap = {
      template: ".html,.htm,.hbs",
      partial: ".html,.htm,.hbsp",
      page: ".md",
      post: ".md",
      templateAsset: ".css,.js,.json",
      asset: "*",
    } as const
    input.accept = loadExtensionMap[type]

    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        if (type === "asset") {
          // parse file and add to database
          const newFile = await loadAssetFile(file, execute, blobStore)
          setFiles(files => files.set(newFile.id, newFile))
          setSelectedFiles(selectedFiles => ({
            activeFileId: newFile.id,
            contentFileId: selectedFiles.contentFileId,
          }))
        } else {
          // parse file and add to database
          const newFile = await loadTextFile(file, type, execute)
          setFiles(files => files.set(newFile.id, newFile))
          setSelectedFiles(selectedFiles => ({
            activeFileId: newFile.id,
            contentFileId:
              type === "page" ? newFile.id : selectedFiles.contentFileId,
          }))
        }
      }
    }
    input.click()
  }

  const heading = headingMap[type]

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="group/collapsible">
      <SidebarGroup className="p-1">
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger className="text-zinc-100">
            {heading}
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <SidebarGroupAction title={"Add " + type} className="rounded-lg">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Plus className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {type === "asset" ? null : (
                <DropdownMenuItem onClick={() => handleCreateFile(type)}>
                  New File
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => handleLoadFile(type)}>
                Load File
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarGroupAction>

        <CollapsibleContent>
          <ul className="">
            {[...files.values()].map(file => (
              <FileListItem
                key={file.id}
                file={file}
                files={files}
                setFiles={setFiles}
                selectedFiles={selectedFiles}
                setSelectedFiles={setSelectedFiles}
              />
            ))}
          </ul>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
}
