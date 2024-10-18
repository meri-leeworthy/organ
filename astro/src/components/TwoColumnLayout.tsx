import React, { useState, useEffect } from "react"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable.tsx"
import { Textarea } from "@/components/ui/textarea.tsx"
import { FileList } from "./FileList.jsx"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert.jsx"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "./ui/button"
import { ScrollArea } from "./ui/scroll-area.jsx"
import { Plus } from "lucide-react"

export interface FileData<T = string> {
  name: string
  content: T
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
      partials: Record<string, string>
    ) => string
  } | null>(null)
  // the default files
  const [templates, setTemplates] = useState<FileData<string>[]>([
    { name: "styles.css", content: "h1 { color: blue; }" },
    {
      name: "template.html",
      content: `<h1>{{heading}}</h1>
{{{content}}}

{{#if show_footer}}
<footer>
    <p>{{footer_text}}</p>
</footer>
{{/if}}
`,
    },
  ])
  const [contentFiles, setContentFiles] = useState<FileData<string>[]>([
    {
      name: "main.md",
      content: `---
heading: My Document
---
# Welcome to My Document

This is a sample Markdown file.`,
    },
  ])
  const [assets, setAssets] = useState<FileData<ArrayBuffer>[]>([])

  const selectedFile =
    templates.find(file => file.name === selectedFileName) ||
    contentFiles.find(file => file.name === selectedFileName) ||
    assets.find(file => file.name === selectedFileName)

  const selectedFileIsText = Boolean(
    templates.find(file => file.name === selectedFileName) ||
      contentFiles.find(file => file.name === selectedFileName)
  )

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
        const module = await import("../wasm/minissg.js")
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

    //maybe there should only ever be one css file - change to its own state?
    const cssFile = templates.find(file => file.name.endsWith(".css"))

    try {
      const markdownContent = markdownFile ? markdownFile.content : ""
      const templateContent = template ? template.content : ""
      const cssContent = cssFile ? cssFile.content : ""

      console.log("Converting markdown:", markdownContent)

      // Call the WASM module with markdown, CSS, and the class name
      const combinedContent = wasmModule.render(
        templateContent,
        markdownContent,
        cssContent,
        ".preview-pane",
        {}
      )
      console.log("Conversion result:", combinedContent)

      setPreviewContent(combinedContent)
      setErrorMessage("")
    } catch (e) {
      console.error("Error during conversion:", e)
      setPreviewContent("")
      setErrorMessage(String(e))
    }
  }, [templates, contentFiles, wasmModule])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!selectedFile) return
    const newContent = e.target.value

    console.log(`Updating content of ${selectedFile.name}`)

    if (selectedFile.name.endsWith(".md")) {
      setContentFiles(prevFiles =>
        prevFiles.map(file =>
          file.name === selectedFile.name
            ? { ...file, content: newContent }
            : file
        )
      )
    } else {
      setTemplates(prevFiles =>
        prevFiles.map(file =>
          file.name === selectedFile.name
            ? { ...file, content: newContent }
            : file
        )
      )
    }
  }

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

  return (
    <ResizablePanelGroup direction="horizontal" className="min-h-screen">
      <ResizablePanel defaultSize={50} minSize={30}>
        <div className="flex h-full">
          <ScrollArea className="h-full flex flex-col">
            <FileList
              name="Templates"
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
              name="Content"
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
              name="Assets"
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
                className="h-full min-h-[calc(100vh-32px)] resize-none font-mono"
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
            dangerouslySetInnerHTML={{ __html: previewContent }}></div>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

export default Component
