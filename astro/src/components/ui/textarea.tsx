import * as React from "react"

import { cn } from "@/lib/utils"
import { forwardRef } from "react"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="grow-wrap">
        <textarea
          className={cn(
            "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          data-replicated-value={props.value}
          onInput={(e: React.FormEvent<HTMLTextAreaElement>) => {
            const textarea = e.currentTarget
            const parent = textarea.parentElement
            if (parent) {
              parent.dataset.replicatedValue = textarea.value
            }
          }}
          {...props}
        />
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }

const MIN_TEXTAREA_HEIGHT = 32
const MAX_TEXTAREA_HEIGHT = 700

function useAutoResize(
  ref: React.RefObject<HTMLTextAreaElement>,
  value: string
) {
  React.useLayoutEffect(() => {
    if (!ref.current) return
    // Reset height - important to shrink on delete
    ref.current.style.height = "inherit"
    // Set height with both min and max constraints
    ref.current.style.height = `${Math.min(
      Math.max(ref.current.scrollHeight, MIN_TEXTAREA_HEIGHT),
      MAX_TEXTAREA_HEIGHT
    )}px`
  }, [value])
}

interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const AutoResizeTextarea = forwardRef<
  HTMLTextAreaElement,
  TextAreaProps
>((props: TextareaProps, ref) => {
  const internalRef = React.useRef<HTMLTextAreaElement>(null)
  const [value, setValue] = React.useState(props.value?.toString() || "")
  useAutoResize(internalRef, value)
  return (
    <Textarea
      {...props}
      className={cn("max-h-[70vh] overflow-y-auto", props.className)}
      ref={internalRef}
      value={value}
      onChange={e => setValue(e.target.value)}
    />
  )
})
