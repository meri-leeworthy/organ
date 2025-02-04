export interface FileData<
  TData extends CollectionSchema = Record<string, any>,
> {
  id: number
  name: string
  type: Collection
  data?: TData
  blob_url?: string
  url?: string
}

export const fileDataDefault: FileData = {
  id: 0,
  name: "",
  type: "template",
  data: {
    body: {
      type: "html",
      content: "<p>Hello World</p>",
    },
  },
}

export interface SelectedFiles {
  activeFileId: number | null
  contentFileId: number
}

export type Collection =
  | "template"
  | "page"
  | "asset"
  | "templateAsset"
  | "partial"
  | "post"

export const extensionMap = {
  template: "hbs",
  partial: "hbsp",
} as const

export const headingMap = {
  template: "Templates",
  page: "Pages",
  templateAsset: "Template Assets",
  asset: "Assets",
  partial: "Partials",
  post: "Posts",
} as const

export type BodySchema<T extends "plaintext" | "html" = "plaintext"> = {
  type: T
  content: string
}

export type PageSchema = {
  url?: string
  template: number
  title: string
  body: BodySchema<"html">
}

export type PostSchema = {
  url?: string
  template: number
  body: BodySchema<"html">
  title: string
  date: string
  tags: string[]
}

export type TemplateAssetSchema = {
  url?: string
  body: BodySchema<"plaintext">
}

export type TemplateSchema = {
  body: BodySchema<"plaintext">
}

export type PartialSchema = {
  body: BodySchema<"html">
}

export type AssetSchema = {
  url?: string
  mime_type: string
}

export type CollectionSchema =
  | PageSchema
  | PostSchema
  | TemplateAssetSchema
  | AssetSchema
  | TemplateSchema
  | PartialSchema
  | Record<string, string>
