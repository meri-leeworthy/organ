import React, { useState, useEffect } from "react"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable.tsx"
import { Textarea } from "@/components/ui/textarea.tsx"
import { FileList } from "./FileList.js"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert.js"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "./ui/button.js"
import { ScrollArea } from "./ui/scroll-area.js"
import { Plus } from "lucide-react"
import useSql, { type Execute } from "@/hooks/useSql.js"

export interface FileData<T = string> {
  name: string
  content: T
}

interface QueryResult {
  columns: string[]
  values: any[][]
}

const Component: React.FC = () => {
  const [selectedContent, setSelectedContent] = useState<string>("main.md")
  const [selectedFileName, setSelectedFileName] = useState<string>("main.md")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [previewContent, setPreviewContent] = useState<string>(
    "Generated HTML will be rendered here"
  )
  const [wasmModule, setWasmModule] = useState<{
    render: (
      template: string,
      markdown: string,
      css: string,
      context: string,
      partials: Record<string, string>,
      images: Record<string, string>
    ) => string
  } | null>(null)
  //   // the default files
  //   const [templates, setTemplates] = useState<FileData<string>[]>([
  //     {
  //       name: "styles.css",
  //       content: `h1 {
  // font-size: 2rem;
  // font-weight: bold;
  // }

  // h2 {
  // font-size: 1.5rem;
  // font-weight: bold;
  // }`,
  //     },
  //     {
  //       name: "template.html",
  //       content: `<style>{{{css}}}</style>
  // <div class="preview-pane"><h1>{{heading}}</h1>
  // {{{content}}}

  // {{#if show_footer}}
  // <footer>
  //     <p>{{footer_text}}</p>
  // </footer>
  // {{/if}}
  // </div>
  // `,
  //     },
  //   ])
  //   const [contentFiles, setContentFiles] = useState<FileData<string>[]>([
  //     {
  //       name: "main.md",
  //       content: `---
  // heading: My Document
  // ---
  // ## Welcome to My Document

  // This is a sample Markdown file.`,
  //     },
  //   ])
  //   const [assets, setAssets] = useState<FileData<ArrayBuffer>[]>([])
  //   const [imageURLs, setImageURLs] = useState<Record<string, string>>({})

  const { execute, loading, error } = useSql()

  const initializeSchema = async () => {
    const queries = `
      CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('css', 'hbs', 'md', 'asset')),
        content TEXT,
        file_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(type) WHERE type = 'css',
        UNIQUE(name, type)
      );
  
      CREATE TRIGGER IF NOT EXISTS update_files_updated_at
      AFTER UPDATE ON files
      FOR EACH ROW
      BEGIN
        UPDATE files SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
      END;
  
      CREATE INDEX IF NOT EXISTS idx_files_type ON files(type);
      CREATE INDEX IF NOT EXISTS idx_files_name ON files(name);
    `

    await execute(queries)
  }

  const addFile = async (
    name: string,
    type: "css" | "hbs" | "md",
    content: string
  ) => {
    const query = `
      INSERT INTO files (name, type, content)
      VALUES (?, ?, ?);
    `
    await execute(query, [name, type, content])
  }

  const addAsset = async (name: string, filePath: string) => {
    const query = `
      INSERT INTO files (name, type, file_path)
      VALUES (?, 'asset', ?);
    `
    await execute(query, [name, filePath])
  }

  const updateFile = async (id: number, newContent: string) => {
    const query = `
      UPDATE files
      SET content = ?
      WHERE id = ?;
    `
    await execute(query, [newContent, id])
  }

  const fetchAllFiles = async () => {
    const query = `
      SELECT * FROM files;
    `
    return await execute(query)
  }

  const deleteFile = async (id: number) => {
    const query = `
      DELETE FROM files
      WHERE id = ?;
    `
    await execute(query, [id])
  }

  useEffect(() => {
    if (!loading && !error) {
      initializeSchema()
    }
  })

  const getSelectedFile = async (selectedFileName: string) => {
    const query = `
      SELECT 
        id,
        name,
        type,
        content,
        file_path,
        created_at,
        updated_at,
        CASE 
          WHEN type IN ('css', 'hbs', 'md') THEN 1 
          ELSE 0 
        END AS isText
      FROM files
      WHERE name = ?;
    `

    const result = await execute(query, [selectedFileName])
    const selectedFile: FileData = {
      name: result[0].name?.toString() || "",
      content: result[0].content?.toString() || "",
    }
    const selectedFileIsText = result.length > 0 ? result[0] : null

    return { selectedFile, selectedFileIsText }
  }

  getSelectedFile(selectedFileName)

  // const selectedFile =
  //   templates.find(file => file.name === selectedFileName) ||
  //   contentFiles.find(file => file.name === selectedFileName) ||
  //   assets.find(file => file.name === selectedFileName)

  // const selectedFileIsText = Boolean(
  //   templates.find(file => file.name === selectedFileName) ||
  //     contentFiles.find(file => file.name === selectedFileName)
  // )

  const selectedImage =
    selectedFile &&
    !selectedFileIsText &&
    new Blob([selectedFile?.content], { type: "image/jpeg" }) // Change the MIME type to the correct one for your image

  // Create an object URL from the Blob
  const url = selectedImage ? URL.createObjectURL(selectedImage) : ""

  // load WASM module
  useEffect(() => {
    const loadWasm = async () => {
      try {
        console.log("Loading WASM module...")
        const module = await import("../wasm/minissg/minissg.js")
        setWasmModule(module)
        console.log("WASM module loaded:", module)
      } catch (e) {
        console.error("Failed to load WASM module:", e)
        setErrorMessage("Failed to load WASM module.")
      }
    }
    loadWasm()
  }, [])

  // Update the selected content when the selected file changes
  useEffect(() => {
    const contentFileNames = contentFiles.map(file => file.name)
    if (contentFileNames.includes(selectedFileName)) {
      setSelectedContent(selectedFileName)
    }
  }, [selectedFileName])

  // Update the preview content when the templates or content files change
  useEffect(() => {
    if (!wasmModule) {
      console.error("WASM module not loaded yet")
      setErrorMessage(
        "WASM module not loaded yet. Please wait a moment and try again."
      )
      return
    }

    const template = templates.find(file => file.name === "template.html")
    const markdownFile = contentFiles.find(
      file => file.name === selectedContent
    )
    const cssFile = templates.find(file => file.name.endsWith(".css"))

    try {
      const markdownContent = markdownFile ? markdownFile.content : ""
      const templateContent = template ? template.content : ""
      const cssContent = cssFile ? cssFile.content : ""

      console.log("Converting markdown:", markdownContent)

      // Pass imageURLs as a JSON string or appropriate format
      const combinedContent = wasmModule.render(
        templateContent,
        markdownContent,
        cssContent,
        ".preview-pane",
        {}, // existing partials
        imageURLs // new parameter for image mapping
      )

      console.log("Conversion result:", combinedContent)
      setPreviewContent(combinedContent)
      setErrorMessage("")
    } catch (e) {
      console.error("Error during conversion:", e)
      setPreviewContent("")
      setErrorMessage(String(e))
    }
  }, [
    selectedFileName,
    selectedContent,
    templates,
    contentFiles,
    wasmModule,
    imageURLs,
  ])

  // Create object URLs for image assets
  useEffect(() => {
    const urls: Record<string, string> = {}

    assets.forEach(asset => {
      // Adjust the MIME type based on your requirements
      if (asset.name.match(/\.(jpg|jpeg|png|gif|svg)$/i)) {
        urls[asset.name] = URL.createObjectURL(
          new Blob([asset.content], { type: "image/*" })
        )
      }
    })

    setImageURLs(urls)

    // Cleanup: Revoke object URLs when assets change or component unmounts
    return () => {
      Object.values(urls).forEach(url => URL.revokeObjectURL(url))
    }
  }, [assets])

  // const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  //   if (!selectedFile) return
  //   const newContent = e.target.value

  //   console.log(`Updating content of ${selectedFile.name}`)

  //   if (selectedFile.name.endsWith(".md")) {
  //     setContentFiles(prevFiles =>
  //       prevFiles.map(file =>
  //         file.name === selectedFile.name
  //           ? { ...file, content: newContent }
  //           : file
  //       )
  //     )
  //   } else {
  //     setTemplates(prevFiles =>
  //       prevFiles.map(file =>
  //         file.name === selectedFile.name
  //           ? { ...file, content: newContent }
  //           : file
  //       )
  //     )
  //   }
  // }

  const handleAddFile = (type: "template" | "content") => {
    const fileExtension = type === "template" ? "html" : "md"

    // Function to generate unique filename
    const generateUniqueFileName = (
      baseName: string,
      files: any[],
      extension: string
    ) => {
      let fileName = `${baseName}.${extension}`
      let counter = 1

      // Check if file with this name already exists
      while (files.some(file => file.name === fileName)) {
        fileName = `${baseName}${counter}.${extension}`
        counter++
      }

      return fileName
    }

    const newFileName = generateUniqueFileName(
      "newfile",
      type === "template" ? templates : contentFiles,
      fileExtension
    )
    const newFile = { name: newFileName, content: "" }

    if (type === "template") {
      setTemplates([...templates, newFile])
    } else {
      setContentFiles([...contentFiles, newFile])
    }

    setSelectedFileName(newFileName)
  }

  const handleUploadFile = async (type: "template" | "content" | "asset") => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept =
      type === "template" ? ".html" : type === "content" ? ".md" : "*"
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const content =
          type === "asset" ? await file.arrayBuffer() : await file.text()
        const newFile = { name: file.name, content }
        if (type === "template") {
          setTemplates([...templates, newFile] as FileData<string>[])
        } else if (type === "content") {
          setContentFiles([...contentFiles, newFile] as FileData<string>[])
        } else {
          setAssets([...assets, newFile] as FileData<ArrayBuffer>[])
        }
        setSelectedFileName(file.name)
      }
    }
    input.click()
  }

  const handleRemoveAsset = (fileName: string) => {
    setAssets(prevAssets => prevAssets.filter(file => file.name !== fileName))
    setImageURLs(prevURLs => {
      const { [fileName]: _, ...rest } = prevURLs
      URL.revokeObjectURL(_)
      return rest
    })
  }

  const handleLinkClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
    console.log("Link clicked:", event.target)
    let target = event.target as HTMLElement | null

    while (target && target !== event.currentTarget) {
      console.log("Target:", target)
      if (target.tagName.toLowerCase() === "a") {
        const href = (target as HTMLAnchorElement).getAttribute("href")
        console.log("Link href:", href)
        if (href) {
          const isInternal = href.startsWith("/")

          if (isInternal) {
            if (onLinkClick) {
              onLinkClick(href)
            }
          } else {
            // Optionally handle external links, e.g., open in new tab
            // event.preventDefault();
            // window.open(href, '_blank');
          }
        }
        break
      }
      target = target.parentElement
    }
  }

  const onLinkClick = (href: string) => {
    console.log("Link clicked:", href)
    setSelectedFileName(href.slice(1))
    setSelectedContent(href.slice(1))
  }

  return (
    <ResizablePanelGroup direction="horizontal" className="min-h-screen">
      <ResizablePanel defaultSize={50} minSize={30}>
        <div className="flex h-full">
          <ScrollArea className="h-full flex flex-col">
            <FileList
              type="Templates"
              files={templates}
              selectedFileName={selectedFileName}
              setSelectedFileName={setSelectedFileName}
              addFileMenu={
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleAddFile("template")}>
                      New File
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleUploadFile("template")}>
                      Upload File
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              }
            />
            <FileList
              type="Content"
              files={contentFiles}
              selectedFileName={selectedFileName}
              setSelectedFileName={setSelectedFileName}
              addFileMenu={
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleAddFile("content")}>
                      New File
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleUploadFile("content")}>
                      Upload File
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              }
            />
            <FileList
              type="Assets"
              files={assets}
              selectedFileName={selectedFileName}
              setSelectedFileName={setSelectedFileName}
              addFileMenu={
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleUploadFile("asset")}>
                      Upload File
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              }
            />
          </ScrollArea>
          <div className="flex-1 p-4 pl-2">
            {selectedFileIsText ? (
              <Textarea
                className="h-20 min-h-[calc(100vh-32px)] resize-none font-mono"
                placeholder="Enter your code here..."
                value={
                  selectedFile && typeof selectedFile.content === "string"
                    ? selectedFile.content
                    : ""
                }
                onChange={handleInputChange}
              />
            ) : (
              <img src={url} />
            )}
          </div>
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={50}>
        {errorMessage ? (
          <div
            id="error-message"
            className="flex items-center justify-center h-full">
            <div>
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            </div>
          </div>
        ) : (
          <div
            className="h-full items-center overflow-auto border-l-1 p-2 w-full"
            id="preview-pane"
            onClick={handleLinkClick}
            dangerouslySetInnerHTML={{ __html: previewContent }}></div>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

export default Component
