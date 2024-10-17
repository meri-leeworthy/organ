import React, { useState, useEffect } from "react"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "astro/src/components/ui/resizable.jsx"
import { Textarea } from "astro/src/components/ui/textarea.jsx"
import { FileList } from "./FileList.jsx"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert.jsx"

export interface FileData {
  name: string
  content: string
}

const Component: React.FC = () => {
  const [selectedContent, setSelectedContent] = useState<string>("main.md")
  const [selectedFileName, setSelectedFileName] = useState<string>("main.md")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [previewContent, setPreviewContent] = useState<string>(
    "Generated HTMLtt will be rendered here"
  )
  const [wasmModule, setWasmModule] = useState<{
    render: (
      template: string,
      markdown: string,
      css: string,
      context: string
    ) => string
  } | null>(null)
  // the default files
  const [templates, setTemplates] = useState<FileData[]>([
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
  const [contentFiles, setContentFiles] = useState<FileData[]>([
    {
      name: "main.md",
      content: `---
heading: My Document
---
# Welcome to My Document

This is a sample Markdown file.`,
    },
  ])

  const selectedFile =
    templates.find(file => file.name === selectedFileName) ||
    contentFiles.find(file => file.name === selectedFileName)

  // load WASM module
  useEffect(() => {
    const loadWasm = async () => {
      try {
        console.log("Loading WASM module...")
        const module = await import(
          "../wasm/markdown_to_html/markdown_to_html.js"
        )
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
        ".preview-pane"
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

  return (
    <ResizablePanelGroup direction="horizontal" className="min-h-screen">
      <ResizablePanel defaultSize={50} minSize={30}>
        <div className="flex h-full">
          <div className="flex flex-col">
            <FileList
              name="Templates"
              files={templates}
              selectedFileName={selectedFileName}
              setSelectedFileName={setSelectedFileName}
            />
            <FileList
              name="Content"
              files={contentFiles}
              selectedFileName={selectedFileName}
              setSelectedFileName={setSelectedFileName}
            />
          </div>
          <div className="flex-1 p-4 pl-2">
            <Textarea
              className="h-full min-h-[calc(100vh-32px)] resize-none font-mono"
              placeholder="Enter your code here..."
              value={selectedFile ? selectedFile.content : ""}
              onChange={handleInputChange}
            />
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
