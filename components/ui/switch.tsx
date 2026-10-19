"use client"

import { cn } from "@/lib/utils"

interface Props extends Omit<React.ComponentProps<"button">, "onChange" | "role"> {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

/** 켜짐(accent)·꺼짐(toggle-off)을 고르는 56×32 토글. 이름은 aria-labelledby나 aria-label로 붙인다. */
export function Switch({ checked, onCheckedChange, className, ...props }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative h-8 w-14 shrink-0 rounded-pill transition-colors disabled:opacity-50",
        checked ? "bg-brand" : "bg-toggle-off",
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          "absolute left-1 top-1 size-6 rounded-pill bg-surface transition-transform",
          checked && "translate-x-6",
        )}
      />
    </button>
  )
}
