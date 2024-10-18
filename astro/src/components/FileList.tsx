import { useState } from "react"
import type { FileData } from "./TwoColumnLayout"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible"
import { ChevronDown, ChevronRight, File, Plus } from "lucide-react"
import { Button } from "./ui/button"

export function FileList<T>({
  name,
  files,
  selectedFileName,
  setSelectedFileName,
  addFileMenu,
}: {
  name: string
  files: FileData<T>[]
  selectedFileName: string
  setSelectedFileName: React.Dispatch<React.SetStateAction<string>>
  addFileMenu: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState<boolean>(true)
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-[200px]">
      <div className="flex w-full items-center justify-between p-4 pr-2 font-semibold">
        <CollapsibleTrigger>{name}</CollapsibleTrigger>
        <div className="flex items-center space-x-2">
          {addFileMenu}
          <CollapsibleTrigger>
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </CollapsibleTrigger>
        </div>
      </div>

      <CollapsibleContent>
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
      </CollapsibleContent>
    </Collapsible>
  )
}
