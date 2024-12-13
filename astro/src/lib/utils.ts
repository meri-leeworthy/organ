import type { Execute } from "@/hooks/useSql"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { loadAssetFromIndexedDB } from "./idbHelper"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function isBlobUrlValid(blobUrl: string): Promise<boolean> {
  try {
    const response = await fetch(blobUrl)
    return response.ok
  } catch (error) {
    return false
  }
}

export const getValidBlobUrl = async (
  fileName: string,
  url: string,
  execute: Execute
) => {
  const isValid = await isBlobUrlValid(url)
  if (!isValid) {
    const asset = await loadAssetFromIndexedDB(fileName)
    const blob = new Blob([asset], { type: "image/jpeg" })
    const url = URL.createObjectURL(blob)
    const query = `
  UPDATE files
  SET content = ?
  WHERE name = ?
  AND type = ?;
  `
    execute(query, [url, fileName, "asset"])
  }
  return url
}
