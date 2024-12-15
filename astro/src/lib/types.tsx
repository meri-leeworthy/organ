export interface FileData<T = string> {
  name: string
  content: T
  type: "css" | "hbs" | "hbsp" | "md" | "asset"
  data?: Record<string, string>
}

export interface SelectedFile {
  activeFile: string
  type: "css" | "hbs" | "hbsp" | "md" | "asset"
  contentFile: string
}

export type Collection = "template" | "content" | "asset" | "css"

export const extensionMap = {
  template: "hbs",
  content: "md",
  asset: "asset",
  css: "css",
} as const

export const headingMap = {
  template: "Templates",
  content: "Content",
  css: "CSS",
  asset: "Assets",
} as const
