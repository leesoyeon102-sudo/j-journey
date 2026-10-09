import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { ArrowRightIcon, PlusIcon } from "lucide-react"

import { Button } from "./button"

const meta = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
  args: { children: "출발 시각 저장" },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "outline", "secondary", "ghost", "destructive", "danger", "link"],
    },
    size: {
      control: "select",
      options: ["default", "xs", "sm", "lg", "icon", "icon-xs", "icon-sm", "icon-lg"],
    },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

// ── variant ──
// primary(default)는 한 화면에 하나만 쓴다. (DESIGN.md Do's and Don'ts)
export const Default: Story = {}
export const Secondary: Story = { args: { variant: "secondary" } }
export const Outline: Story = { args: { variant: "outline" } }
export const Ghost: Story = { args: { variant: "ghost" } }
export const Destructive: Story = { args: { variant: "destructive", children: "삭제" } }
export const Danger: Story = { args: { variant: "danger", children: "삭제" } }
export const Link: Story = { args: { variant: "link", children: "자세히 보기" } }

// ── size ──
export const ExtraSmall: Story = { args: { size: "xs" } }
export const Small: Story = { args: { size: "sm" } }
export const Large: Story = { args: { size: "lg" } }
export const Icon: Story = {
  args: { size: "icon", variant: "outline", "aria-label": "추가", children: <PlusIcon /> },
}

export const WithIcon: Story = {
  args: {
    children: (
      <>
        다음
        <ArrowRightIcon data-icon="inline-end" />
      </>
    ),
  },
}

// ── 상태 ──
// Storybook에는 :hover / :focus-visible를 강제로 켜는 기능이 없어서,
// 컴포넌트가 해당 상태에서 쓰는 클래스를 그대로 붙여 보여준다.
export const Hover: Story = { args: { className: "bg-graphite" } }
export const Focus: Story = { args: { className: "border-ink ring-3 ring-ink/15" } }
export const Disabled: Story = { args: { disabled: true } }
export const Invalid: Story = { args: { "aria-invalid": true } }
