// src/components/Component.tsx

import React, { useState, useEffect } from "react"
import { ChevronRight, ChevronDown, File } from "lucide-react"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Textarea } from "@/components/ui/textarea"

const Component: React.FC = () => {
  interface FileData {
    name: string
    content: string
  }

  const [files, setFiles] = useState<FileData[]>([
    {
      name: "main.md",
      content: "# Welcome to My Document\n\nThis is a sample Markdown file.",
    },
    { name: "styles.css", content: "h1 { color: blue; }" },
    // Add more files as needed
  ])
  const [selectedFileName, setSelectedFileName] = useState<string>("main.md")
  const [isOpen, setIsOpen] = useState<boolean>(true)
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [previewContent, setPreviewContent] = useState<string>(
    "Generated HTML will be rendered here"
  )
  const [wasmModule, setWasmModule] = useState<{
    markdown_to_html: (input: string) => string
  } | null>(null)

  const selectedFile = files.find(file => file.name === selectedFileName)

  useEffect(() => {
    const loadWasm = async () => {
      try {
        console.log("Loading WASM module...")
        const module = await import(
          "../wasm/markdown_to_html/markdown_to_html.js"
        )
        setWasmModule(module as { markdown_to_html: (input: string) => string })
        console.log("WASM module loaded:", module)
      } catch (e) {
        console.error("Failed to load WASM module:", e)
        setErrorMessage("Failed to load WASM module.")
      }
    }
    loadWasm()
  }, [])

  // Load the WASM module asynchronously when the component mounts
  useEffect(() => {
    if (!wasmModule) {
      console.error("WASM module not loaded yet")
      setErrorMessage(
        "WASM module not loaded yet. Please wait a moment and try again."
      )
      return
    }

    const markdownFile = files.find(file => file.name.endsWith(".md"))
    const cssFile = files.find(file => file.name.endsWith(".css"))
    if (!markdownFile) {
      setErrorMessage("No Markdown file found.")
      return
    }

    try {
      console.log("Converting markdown:", markdownFile.content)
      const htmlContent = wasmModule.markdown_to_html(markdownFile.content)
      console.log("Conversion result:", htmlContent)

      const cssContent = cssFile ? cssFile.content : ""

      const combinedContent = `
        <style>
          ${cssContent}
        </style>
        ${htmlContent}
      `

      setPreviewContent(combinedContent)
      setErrorMessage("")
    } catch (e) {
      console.error("Error during conversion:", e)
      setPreviewContent("")
      setErrorMessage(String(e))
    }
  }, [files, wasmModule])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!selectedFile) return
    const newContent = e.target.value

    console.log(`Updating content of ${selectedFile.name}`)

    setFiles(prevFiles =>
      prevFiles.map(file =>
        file.name === selectedFile.name
          ? { ...file, content: newContent }
          : file
      )
    )
  }

  const cssFile = files.find(file => file.name.endsWith(".css"))
  const cssContent = cssFile ? cssFile.content : ""

  const combinedContent = `
  <style>
    ${cssContent}
  </style>
  ${previewContent}
`

  return (
    <ResizablePanelGroup direction="horizontal" className="min-h-screen">
      <ResizablePanel defaultSize={50} minSize={30}>
        <div className="flex h-full">
          <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className="w-[200px] border-r">
            <CollapsibleTrigger className="flex w-full items-center justify-between p-4 font-semibold">
              Files
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ScrollArea className="h-[calc(100vh-56px)]">
                <ul className="p-4">
                  {files.map(file => (
                    <li
                      key={file.name}
                      className={`flex cursor-pointer items-center gap-2 rounded p-2 ${
                        selectedFileName === file.name
                          ? "bg-accent"
                          : "hover:bg-accent/50"
                      }`}
                      onClick={() => setSelectedFileName(file.name)}>
                      <File className="h-4 w-4" />
                      {file.name}
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </CollapsibleContent>
          </Collapsible>
          <div className="flex-1 p-4">
            <Textarea
              className="h-full min-h-[calc(100vh-32px)] resize-none"
              placeholder="Enter your code here..."
              value={selectedFile ? selectedFile.content : ""}
              onChange={handleInputChange}
            />
          </div>
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={50}>
        <div
          className="h-full items-center"
          id="preview-pane"
          style={{
            border: "1px solid #ccc",
            padding: "10px",
            width: "100%",
            minHeight: "100px",
          }}
          dangerouslySetInnerHTML={{ __html: combinedContent }}></div>
        {errorMessage && (
          <p id="error-message" style={{ color: "red" }}>
            {errorMessage}
          </p>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

export default Component
