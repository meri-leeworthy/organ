import React, { useEffect, useState } from "react"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable.tsx"
import { FileList } from "./FileList.js"
import { ScrollArea } from "./ui/scroll-area.js"
import { SelectedFileDisplay } from "./SelectedFileDisplay.jsx"
import { Preview } from "./Preview.jsx"
import type { SelectedFile } from "../lib/types.jsx"

export const TwoColumnLayout: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<SelectedFile>({
    activeFile: "main.md",
    type: "md",
    contentFile: "main.md",
  })
  const [isVertical, setIsVertical] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      // Adjust the threshold width to your preference
      setIsVertical(window.innerWidth <= 768)
    }

    // Set the initial layout direction
    handleResize()

    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return (
    <ResizablePanelGroup
      direction={isVertical ? "vertical" : "horizontal"}
      className="min-h-screen">
      <ResizablePanel defaultSize={50} minSize={30}>
        <div className="flex h-full">
          <ScrollArea className="h-full flex flex-col">
            <FileList
              type="template"
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
            />
            <FileList
              type="content"
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
            />
            <FileList
              type="asset"
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
            />
          </ScrollArea>
          <div className="flex-1 p-4 pl-2">
            <SelectedFileDisplay selectedFile={selectedFile} />
          </div>
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={50}>
        <Preview
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
