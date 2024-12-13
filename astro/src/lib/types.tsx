export interface FileData<T = string> {
  name: string
  content: T
  type: "css" | "hbs" | "hbsp" | "md" | "asset"
}

export interface SelectedFile {
  activeFile: string
  type: "css" | "hbs" | "hbsp" | "md" | "asset"
  contentFile: string
}
