import type { FileData } from "@/lib/types"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"

const extensions = [StarterKit]

export function Editor({
  file,
  onChange,
}: {
  file: FileData
  onChange: (html: string) => void
}) {
  const editor = useEditor({
    extensions: extensions,
    content: file.data?.body?.content || "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl focus:outline-none",
      },
    },
    shouldRerenderOnTransaction: true,
    onUpdate({ editor }) {
      onChange(editor.getHTML())
    },
  })

  console.log("Current file", file)

  return (
    <EditorContent
      name="body"
      editor={editor}
      className="border rounded-md border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring *:disabled:cursor-not-allowed *:disabled:opacity-50"
    />
  )
}
