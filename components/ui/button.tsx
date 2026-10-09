import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

// Contra 스타일: 모든 버튼은 24px 필(rounded-button). 채움 버튼은 Charcoal 하나뿐이다.
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-button border border-transparent bg-clip-padding text-body-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ink focus-visible:ring-3 focus-visible:ring-ink/15 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-graphite aria-expanded:bg-graphite",
        outline:
          "border-hairline bg-paper text-ink hover:bg-mist aria-expanded:bg-mist",
        secondary:
          "bg-mist text-ink hover:bg-hairline aria-expanded:bg-hairline",
        ghost: "text-ink hover:bg-mist aria-expanded:bg-mist",
        // 코랄은 채움으로만 쓰고 글자는 와인(진한 자주)으로 둔다.
        destructive:
          "bg-coral/10 text-wine hover:bg-coral/20 focus-visible:border-coral focus-visible:ring-coral/25",
        // 경로 삭제처럼 되돌릴 수 없는 동작: danger 채움 + 흰 글자
        danger:
          "bg-danger text-on-primary hover:bg-danger/90 focus-visible:border-danger focus-visible:ring-danger/25",
        link: "rounded-none text-ink underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-9 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-7 gap-1 px-3 text-caption has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 px-3.5 text-[13px] has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-13 gap-2 px-6 text-[15px] has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-9",
        "icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
