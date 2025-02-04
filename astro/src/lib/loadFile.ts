import type { Execute } from "@/hooks/useSql"
import type { AssetSchema, Collection, FileData } from "./types"
import { MODEL_IDS } from "./consts"
import type { BlobStore } from "@/components/BlobStoreContext"
import { fileTypeFromBuffer } from "file-type"

export async function loadTextFile(
  file: File,
  type: Collection,
  execute: Execute
): Promise<FileData> {
  const content = await file.text()
  const newFile = { name: file.name, content, id: 0, type: type }

  execute(
    "INSERT OR IGNORE INTO file (name, model_id, data) VALUES (?, ?, ?);",
    [
      file.name,
      MODEL_IDS[type],
      JSON.stringify({
        template: 2,
        title: "",
        body: { type: "html", content },
      }),
    ]
  )

  const idQuery = execute("SELECT last_insert_rowid() as id;")

  newFile.id = idQuery[0].id as number

  return newFile
}

export async function loadAssetFile(
  file: File,
  execute: Execute,
  blobStore: BlobStore
): Promise<FileData> {
  const fileBuffer = await file.arrayBuffer()
  const fileType = await fileTypeFromBuffer(fileBuffer)

  execute(
    "INSERT OR IGNORE INTO file (name, model_id, data) VALUES (?, ?, ?);",
    [
      file.name,
      MODEL_IDS["asset"],
      JSON.stringify({ mime_type: fileType?.mime || "" }),
    ]
  )

  const idQuery = execute("SELECT last_insert_rowid() as id;")

  const blob = new Blob([fileBuffer])
  const blobUrl = blobStore.addBlob(idQuery[0].id as number, blob)

  const newFile: FileData<AssetSchema> = {
    name: file.name,
    id: idQuery[0].id as number,
    type: "asset",
    blob_url: blobUrl,
    url: "",
    data: { mime_type: fileType?.mime || "" },
  }

  console.log("newFile", newFile)

  return newFile as FileData
}
