import { SqlProvider } from "./SqlContext.jsx"
import React, { useEffect, useState } from "react"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable.tsx"
import { Preview } from "./Preview.jsx"
import type { SelectedFiles } from "../lib/types.jsx"
import { SidebarProvider } from "./ui/sidebar.jsx"
import { AppSidebar } from "./AppSidebar.jsx"
import { Toaster } from "@/components/ui/sonner.tsx"
import { ClientProvider } from "./ClientContext.jsx"
import { BlobStoreProvider } from "./BlobStoreContext.jsx"
import { FileContainer } from "./FileContainer.jsx"

const App: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFiles>({
    activeFileId: null,
    contentFileId: 1,
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
    <>
      <SqlProvider>
        <BlobStoreProvider>
          <ClientProvider>
            <SidebarProvider>
              <AppSidebar
                selectedFiles={selectedFiles}
                setSelectedFiles={setSelectedFiles}
                editTemplate={editTemplate}
                setEditTemplate={setEditTemplate}
              />
              {selectedFiles.activeFileId ? (
                <ResizablePanelGroup
                  direction={isVertical ? "vertical" : "horizontal"}>
                  <ResizablePanel>
                    <div className="flex-grow h-full">
                      <FileContainer
                        selectedFiles={selectedFiles}
                        onClose={() => {
                          setSelectedFiles(selectedFiles => ({
                            activeFileId: null,
                            contentFileId: selectedFiles.contentFileId,
                          }))
                        }}
                      />
                    </div>
                  </ResizablePanel>
                  <ResizableHandle className="bg-zinc-700" />
                  <ResizablePanel maxSize={70}>
                    <Preview
                      selectedFiles={selectedFiles}
                      setSelectedFiles={setSelectedFiles}
                    />
                  </ResizablePanel>
                </ResizablePanelGroup>
              ) : (
                <Preview
                  selectedFiles={selectedFiles}
                  setSelectedFiles={setSelectedFiles}
                />
              )}
            </SidebarProvider>
          </ClientProvider>
        </BlobStoreProvider>
      </SqlProvider>
      <Toaster />
    </>
  )
}

export default App
