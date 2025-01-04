export interface FileData<T = string> {
  id: number
  name: string
  content: T
  type: Collection
  data?: Record<string, string>
}

export interface SelectedFiles {
  activeFileId: number
  contentFileId: number
}

export type Collection =
  | "template"
  | "page"
  | "asset"
  | "style"
  | "partial"
  | "post"

export const extensionMap = {
  template: "hbs",
  partial: "hbsp",
  style: "css",
} as const

export const headingMap = {
  template: "Templates",
  page: "Content",
  style: "Styles",
  asset: "Assets",
  partial: "Partials",
  post: "Posts",
} as const
