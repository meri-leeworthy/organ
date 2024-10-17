import { useState } from "react"
import type { FileData } from "./TwoColumnLayout"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible"
import { ChevronDown, ChevronRight, File } from "lucide-react"
import { ScrollArea } from "./ui/scroll-area"

export function FileList({
  name,
  files,
  selectedFileName,
  setSelectedFileName,
}: {
  name: string
  files: FileData[]
  selectedFileName: string
  setSelectedFileName: React.Dispatch<React.SetStateAction<string>>
}) {
  const [isOpen, setIsOpen] = useState<boolean>(true)
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-[200px]">
      <CollapsibleTrigger className="flex w-full items-center justify-between p-4 pr-2 font-semibold">
        {name}
        {isOpen ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ScrollArea>
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
        </ScrollArea>
      </CollapsibleContent>
    </Collapsible>
  )
}
