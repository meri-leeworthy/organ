import type { SelectedFile } from "@/lib/types"
import { FileList } from "./FileList"
import { Sidebar, SidebarContent } from "./ui/sidebar"
import { Button } from "./ui/button"

export function AppSidebar({
  selectedFile,
  setSelectedFile,
  editTemplate,
  setEditTemplate,
}: {
  selectedFile: SelectedFile
  setSelectedFile: React.Dispatch<React.SetStateAction<SelectedFile>>
  editTemplate: boolean
  setEditTemplate: React.Dispatch<React.SetStateAction<boolean>>
}) {
  return (
    <Sidebar>
      <SidebarContent className="p-2">
        {editTemplate ? (
          <>
            <FileList
              key="template" // force React to dismount and remount the component
              type="template"
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
            />
            <FileList
              key="css"
              type="css"
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
            />
          </>
        ) : (
          <>
            <FileList
              key="content"
              type="content"
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
            />
            <FileList
              key="asset"
              type="asset"
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
            />
          </>
        )}
        <Button
          className="mt-auto bg-blue-600"
          onClick={() => setEditTemplate(editTemplate => !editTemplate)}>
          Edit {editTemplate ? "Content" : "Template"}
        </Button>
      </SidebarContent>
    </Sidebar>
  )
}
