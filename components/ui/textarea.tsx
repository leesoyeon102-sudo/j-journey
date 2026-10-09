import * as React from "react"
import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // Input과 같은 모양(muted 배경, 10px 둥글기, border 테두리)에 여러 줄 입력용 높이
        "min-h-24 w-full resize-none rounded-input border border-border bg-muted px-4 py-3 text-body transition-colors outline-none placeholder:text-placeholder focus-visible:border-on-surface focus-visible:ring-3 focus-visible:ring-on-surface/10 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger aria-invalid:ring-3 aria-invalid:ring-danger/20",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
