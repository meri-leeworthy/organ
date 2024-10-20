export interface FileData<T = string> {
  name: string
  content: T
  type: "css" | "hbs" | "md" | "asset"
}

export interface SelectedFile {
  activeFile: string
  type: "css" | "hbs" | "md" | "asset"
  contentFile: string
}
