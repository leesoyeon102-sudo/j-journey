import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { CheckIcon } from "lucide-react"

import { Badge } from "./badge"

const meta = {
  title: "UI/Badge",
  component: Badge,
  tags: ["autodocs"],
  args: { children: "환승 1회" },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "destructive", "accent", "outline", "ghost", "link"],
    },
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

// ── variant ──
export const Default: Story = {}
export const Secondary: Story = { args: { variant: "secondary" } }
export const Destructive: Story = { args: { variant: "destructive", children: "지연" } }
export const Accent: Story = { args: { variant: "accent", children: "자주 이용한 경로 · 2회" } }
export const Outline: Story = { args: { variant: "outline" } }
export const Ghost: Story = { args: { variant: "ghost" } }
export const Link: Story = { args: { variant: "link" } }

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <CheckIcon data-icon="inline-start" />
        도착
      </>
    ),
  },
}

// ── 상태 ──
// hover 스타일은 링크(asChild + <a>)일 때만 적용된다. 해당 클래스를 그대로 붙여 보여준다.
export const Hover: Story = { args: { className: "bg-graphite" } }
export const Focus: Story = { args: { className: "border-ink ring-[3px] ring-ink/15" } }
export const Invalid: Story = { args: { "aria-invalid": true } }
