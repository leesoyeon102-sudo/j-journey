import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

// Contra 스타일: 알약 모양 태그(32px). 기본은 Charcoal 채움, 보조는 Mist 배경.
const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-tag border border-transparent px-3 py-0.5 text-caption font-medium whitespace-nowrap transition-all focus-visible:border-ink focus-visible:ring-[3px] focus-visible:ring-ink/15 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-graphite",
        secondary: "bg-mist text-ink [a]:hover:bg-hairline",
        destructive: "bg-coral/10 text-wine [a]:hover:bg-coral/20",
        // 자주 이용한 경로처럼 앱에서 눈에 띄어야 하는 표시. accent는 출발 시각과 이 배지에만 쓴다.
        accent: "bg-accent-subtle px-1.5 text-caption-lg text-brand",
        outline: "border-hairline bg-paper text-ink [a]:hover:bg-mist",
        ghost: "text-ink hover:bg-mist",
        link: "rounded-none px-0 text-ink underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
