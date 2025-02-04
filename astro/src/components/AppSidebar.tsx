import type { SelectedFiles } from "@/lib/types"
import { FileList } from "./FileList"
import { Sidebar, SidebarContent } from "./ui/sidebar"
import { Button } from "./ui/button"
import { NavUser } from "./NavUser"

export function AppSidebar({
  selectedFiles,
  setSelectedFiles,
  editTemplate,
  setEditTemplate,
}: {
  selectedFiles: SelectedFiles
  setSelectedFiles: React.Dispatch<React.SetStateAction<SelectedFiles>>
  editTemplate: boolean
  setEditTemplate: React.Dispatch<React.SetStateAction<boolean>>
}) {
  return (
    <Sidebar>
      <SidebarContent className="p-1 bg-zinc-800 text-zinc-100 ">
        {editTemplate ? (
          <>
            <FileList
              key="template" // force React to dismount and remount the component
              type="template"
              selectedFiles={selectedFiles}
              setSelectedFiles={setSelectedFiles}
            />
            <FileList
              key="templateAsset"
              type="templateAsset"
              selectedFiles={selectedFiles}
              setSelectedFiles={setSelectedFiles}
            />
          </>
        ) : (
          <>
            <FileList
              key="page"
              type="page"
              selectedFiles={selectedFiles}
              setSelectedFiles={setSelectedFiles}
            />
            <FileList
              key="asset"
              type="asset"
              selectedFiles={selectedFiles}
              setSelectedFiles={setSelectedFiles}
            />
          </>
        )}
        <Button
          className="mt-auto text-zinc-100 bg-zinc-800"
          variant="outline"
          onClick={() => setEditTemplate(editTemplate => !editTemplate)}>
          Edit {editTemplate ? "Content" : "Template"}
        </Button>
        <NavUser />
      </SidebarContent>
    </Sidebar>
  )
}
