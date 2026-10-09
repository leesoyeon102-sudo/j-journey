import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Contra: Mist 배경, 10px 둥글기, Hairline 테두리 → 포커스 시 Ink 테두리
        "h-11 w-full min-w-0 rounded-input border border-hairline bg-mist px-4 py-3 text-body-sm transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-fog focus-visible:border-ink focus-visible:ring-3 focus-visible:ring-ink/10 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
