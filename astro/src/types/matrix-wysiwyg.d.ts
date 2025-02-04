declare module "@vector-im/matrix-wysiwyg" {
  export interface WysiwygAPI {
    undo: () => void
    redo: () => void
    bold: () => void
    italic: () => void
    underline: () => void
    strikeThrough: () => void
    orderedList: () => void
    unorderedList: () => void
    inlineCode: () => void
    clear: () => void
  }

  export interface UseWysiwygResult {
    ref: React.RefObject<HTMLDivElement>
    isWysiwygReady: boolean
    wysiwyg: WysiwygAPI
  }

  export function useWysiwyg(options: {
    isAutoFocusEnabled: boolean
  }): UseWysiwygResult
}
