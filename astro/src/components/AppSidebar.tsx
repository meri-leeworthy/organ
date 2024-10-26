import type { SelectedFile } from "@/lib/types"
import { FileList } from "./FileList"
import { ScrollArea } from "./ui/scroll-area"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
} from "./ui/sidebar"
import { Collapsible, CollapsibleTrigger } from "./ui/collapsible"
import { Plus } from "lucide-react"

export function AppSidebar({
  selectedFile,
  setSelectedFile,
}: {
  selectedFile: SelectedFile
  setSelectedFile: React.Dispatch<React.SetStateAction<SelectedFile>>
}) {
  //className="flex h-full"
  //"h-full flex flex-col"

  return (
    <Sidebar>
      <SidebarContent>
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
      </SidebarContent>
    </Sidebar>
  )
}
