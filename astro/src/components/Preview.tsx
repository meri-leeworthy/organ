import { useEffect, useState } from "react"
import { useSqlContext } from "./SqlContext"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert.jsx"
import type { FileData, SelectedFile } from "../lib/types.jsx"
import type { ParamsObject } from "sql.js"
import { useDebounce } from "@/hooks/useDebounce.js"

export const Preview = ({
  selectedFile,
  setSelectedFile,
}: {
  selectedFile: SelectedFile
  setSelectedFile: React.Dispatch<React.SetStateAction<SelectedFile>>
}) => {
  // essentially all files need to be loaded from the database
  // and then passed to the WASM module. i wonder what memoisation etc i could use

  // maybe instead of selectedFileName it's an object with the file name, type, and the relevant content file
  // which may or may not be the same as the selected file name

  const { execute, loading, error, schemaInitialized } = useSqlContext()
  const [files, setFiles] = useState<FileData[]>([])
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [refresh, setRefresh] = useState<number>(0)
  const debouncedRefresh = useDebounce(refresh, 50)
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

  useEffect(() => {
    if (!schemaInitialized || loading || error) return
    const fetchData = async () => {
      try {
        const query = "SELECT * FROM files;"
        const result = execute(query)
        const files = result.map((file: ParamsObject) => ({
          name: file.name?.toString() || "",
          content: file.content?.toString() || "",
          type: file.type?.toString() as FileData["type"],
        }))
        // console.log("Preview.tsx: Result from SQL.js:", result)
        setFiles(files)
      } catch (err) {
        console.error("Error fetching data:", err)
      }
    }

    fetchData()
  }, [
    execute,
    loading,
    error,
    schemaInitialized,
    selectedFile,
    debouncedRefresh,
  ])

  // Update the selected content when the selected file changes
  // useEffect(() => {
  //   const contentFileNames = contentFiles.map(file => file.name)
  //   if (contentFileNames.includes(selectedFileName)) {
  //     setSelectedContent(selectedFileName)
  //   }
  // }, [selectedFileName])

  const [imageURLs, setImageURLs] = useState<Record<string, string>>({})

  // console.log("refresh:", refresh)

  // Create object URLs for image assets
  // useEffect(() => {
  //   const urls: Record<string, string> = {}

  //   assets.forEach(asset => {
  //     // Adjust the MIME type based on your requirements
  //     if (asset.name.match(/\.(jpg|jpeg|png|gif|svg)$/i)) {
  //       urls[asset.name] = URL.createObjectURL(
  //         new Blob([asset.content], { type: "image/*" })
  //       )
  //     }
  //   })

  //   setImageURLs(urls)

  //   // Cleanup: Revoke object URLs when assets change or component unmounts
  //   return () => {
  //     Object.values(urls).forEach(url => URL.revokeObjectURL(url))
  //   }
  // }, [assets])

  // Update the preview content when the templates or content files change
  useEffect(() => {
    // console.log("Updating preview content...")
    // setRefresh(false)
    if (!wasmModule) {
      console.error("WASM module not loaded yet")
      setErrorMessage(
        "WASM module not loaded yet. Please wait a moment and try again."
      )
      return
    }

    const template = files.find(file => file.name === "template.hbs")
    const markdownFile = files.find(
      file => file.name === selectedFile.contentFile
    )
    const cssFile = files.find(file => file.name.endsWith(".css"))

    try {
      const markdownContent = markdownFile ? markdownFile.content : ""
      const templateContent = template ? template.content : ""
      const cssContent = cssFile ? cssFile.content : ""

      // Pass imageURLs as a JSON string or appropriate format
      const combinedContent = wasmModule.render(
        templateContent,
        markdownContent,
        cssContent,
        ".preview-pane",
        {}, // existing partials
        imageURLs // new parameter for image mapping
      )

      // console.log("Conversion result:", combinedContent)
      setPreviewContent(combinedContent)
      setErrorMessage("")
    } catch (e) {
      console.error("Error during conversion:", e)
      setPreviewContent("")
      setErrorMessage(String(e))
    }
  }, [selectedFile, wasmModule, imageURLs, files, loading, debouncedRefresh]) //,

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      setRefresh(refresh => refresh + 1) // Trigger rerender by updating state
    }

    window.addEventListener("keydown", handleKeyDown)

    // Clean up the event listener on component unmount
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  const handleLinkClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
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
    setSelectedFile({
      activeFile: href.slice(1),
      type: "md",
      contentFile: href.slice(1),
    })
    // setSelectedContent(href.slice(1))
  }

  return (
    <>
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
    </>
  )
}
