import { extensionMap, type SelectedFiles } from "@/lib/types"
import type { FileData } from "@/lib/types"
import { useBlobStore } from "./BlobStoreContext"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { DotsVerticalIcon } from "@radix-ui/react-icons"
import { useClient } from "@/hooks/useClient"
import { useSqlContext } from "./SqlContext"
import { File } from "lucide-react"
import { toast } from "sonner"

export function FileListItem({
  file,
  files,
  setFiles,
  selectedFiles,
  setSelectedFiles,
}: {
  file: FileData
  files: Map<number, FileData>
  setFiles: React.Dispatch<React.SetStateAction<Map<number, FileData>>>
  selectedFiles: SelectedFiles
  setSelectedFiles: React.Dispatch<React.SetStateAction<SelectedFiles>>
}) {
  const { execute, loading, error, schemaInitialized } = useSqlContext()
  const blobStore = useBlobStore()
  const client = useClient()

  const handleRenameFileClick = async () => {
    if (!schemaInitialized || loading || error) return
    const newName = prompt("Enter new name:", file.name)
    if (newName) {
      try {
        // If the file has a URL (is in R2), rename it there first
        let newUrl: string | undefined = file.url
        if (file.url) {
          newUrl = await client.renameFile(file.url, newName)
        }

        // Update the file in the local database
        execute("UPDATE file SET name = ?, url = ? WHERE id = ?;", [
          newName,
          newUrl || null, // Use null if newUrl is undefined
          file.id,
        ])
        setFiles(files =>
          files.set(file.id, { ...file, name: newName, url: newUrl || "" })
        )
        toast.success("File renamed")
      } catch (error) {
        toast.error("Error renaming file")
        console.error("Error renaming file:", error)
      }
    }
  }

  const handleDeleteFile = async (fileId: number) => {
    if (!schemaInitialized || loading || error) return

    console.log("deleting file", fileId, file.type)

    // Delete from R2 if the file has a URL
    if (file.url) {
      try {
        await client.deleteFile(file.url)
      } catch (error) {
        console.error("Error deleting file from R2:", error)
        toast.error("Error deleting file from R2")
      }
    }

    execute(
      `
      DELETE FROM file
      WHERE id = ?
      `,
      [fileId]
    )

    // Delete the file from the blob store
    blobStore.deleteBlob(fileId)

    const newFiles = new Map(files)
    newFiles.delete(fileId)
    setFiles(newFiles)
    if (selectedFiles.activeFileId === fileId) {
      setSelectedFiles({
        activeFileId: 1,
        contentFileId: 1,
      })
    }
    if (file.type === "asset") {
      blobStore.deleteBlob(fileId)
    }
    toast.success("File deleted")
  }

  const handlePublishFile = async (id: number) => {
    if (!schemaInitialized || loading || error) return

    const file = files.get(id)
    if (!file) return
    console.log("uploading file", file)

    const blob = await blobStore.getBlob(file.id)

    try {
      if (!file.data?.mime_type) {
        throw new Error("No mime type found")
      }
      const url = await client.uploadFile(blob, file.name, file.data.mime_type)
      if (!url) {
        throw new Error("No url found")
      }
      const newFile = {
        ...file,
        url,
      }
      setFiles(files => files.set(file.id, newFile))
      execute("UPDATE file SET url = ? WHERE id = ?;", [url, file.id])
      toast.success("File published")
    } catch (error) {
      console.error("Error fetching blob:", error)
      toast.error("Error publishing file")
    }
  }

  const handleDeleteFileClick = () => {
    if (confirm(`Are you sure you want to delete ${file.name}?`)) {
      handleDeleteFile(file.id)
    }
  }

  return (
    <DropdownMenu key={file.id}>
      <li
        className={`group/file flex cursor-pointer items-center gap-2 rounded p-1 ${
          selectedFiles.activeFileId === file.id
            ? "bg-zinc-900"
            : "hover:bg-zinc-900/50"
        }`}
        onClick={() => {
          setSelectedFiles(selectedFiles => ({
            activeFileId: file.id,
            contentFileId:
              file.type === "page" || file.type === "post"
                ? file.id
                : selectedFiles.contentFileId,
          }))
        }}>
        <File className="w-4 h-4" />
        {(file.name.length > 16 ? file.name.slice(0, 16) + "..." : file.name) +
          (file.type === "template" ? `.${extensionMap[file.type]}` : "")}
        <DropdownMenuTrigger className="ml-auto invisible group-hover/file:visible group-active:visible mr-[6px] text-zinc-100 stroke-zinc-100">
          <DotsVerticalIcon />
        </DropdownMenuTrigger>
      </li>

      <DropdownMenuContent>
        <DropdownMenuItem
          className="flex items-center gap-2 px-2 py-1 text-sm rounded cursor-pointer hover:bg-accent hover:outline-none"
          onClick={() => handleRenameFileClick()}>
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex items-center gap-2 px-2 py-1 text-sm rounded cursor-pointer hover:bg-accent hover:outline-none"
          onClick={() => handleDeleteFileClick()}>
          Delete
        </DropdownMenuItem>
        {file.type === "asset" && (!file.data || file.url === "") && (
          <DropdownMenuItem
            className="flex items-center gap-2 px-2 py-1 text-sm rounded cursor-pointer hover:bg-accent hover:outline-none"
            onClick={() => handlePublishFile(file.id)}>
            Publish
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
