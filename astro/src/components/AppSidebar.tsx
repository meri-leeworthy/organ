import type { SelectedFiles } from "@/lib/types"
import { FileList } from "./FileList"
import { Sidebar, SidebarContent, SidebarTrigger } from "./ui/sidebar"
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
    <>
      <Sidebar className="z-10">
        <SidebarContent className="relative z-10 p-1 bg-zinc-800 text-zinc-100">
          <SidebarTrigger className="ml-1 rounded-xl" />
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
                key="post"
                type="post"
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
            className="mt-auto rounded-xl text-zinc-100 bg-zinc-700 hover:bg-zinc-600"
            variant="secondary"
            onClick={() => setEditTemplate(editTemplate => !editTemplate)}>
            Edit {editTemplate ? "Content" : "Template"}
          </Button>
          <NavUser />
        </SidebarContent>
      </Sidebar>
    </>
  )
}
