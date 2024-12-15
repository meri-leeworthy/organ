import { SqlProvider } from "./SqlContext"
import React, { useEffect, useState } from "react"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable.tsx"
import { Preview } from "./Preview.jsx"
import type { SelectedFile } from "../lib/types.jsx"
import { SidebarProvider } from "./ui/sidebar.jsx"
import { AppSidebar } from "./AppSidebar.jsx"
import { SelectedFileDisplay } from "./SelectedFileDisplay.jsx"

const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<SelectedFile>({
    activeFile: "main",
    type: "md",
    contentFile: "main",
  })
  const [isVertical, setIsVertical] = useState(false)
  const [editTemplate, setEditTemplate] = useState(false)

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
    <SqlProvider>
      <SidebarProvider>
        <ResizablePanelGroup
          direction={isVertical ? "vertical" : "horizontal"}
          className="min-h-screen max-h-screen">
          <ResizablePanel defaultSize={50} minSize={30} className="flex">
            <AppSidebar
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
              editTemplate={editTemplate}
              setEditTemplate={setEditTemplate}
            />
            <div className="flex-grow h-full">
              <SelectedFileDisplay selectedFile={selectedFile} />
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
      </SidebarProvider>
    </SqlProvider>
  )
}

export default App
