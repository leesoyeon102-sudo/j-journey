import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Textarea } from "./textarea"

const meta = {
  title: "UI/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  args: { placeholder: "불편했던 점이나 바라는 점을 적어 주세요", className: "w-72" },
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

// ── 기본 ──
export const Default: Story = {}
export const WithValue: Story = { args: { defaultValue: "출발 시각이 정확해서 좋았어요." } }

// ── 상태 ──
// 포커스는 :focus-visible 클래스를 그대로 붙여 보여준다.
export const Focus: Story = { args: { defaultValue: "출발 시각이 정확해서 좋았어요.", className: "w-72 border-on-surface ring-3 ring-on-surface/10" } }
export const Disabled: Story = { args: { disabled: true, defaultValue: "출발 시각이 정확해서 좋았어요." } }
export const Invalid: Story = { args: { "aria-invalid": true, defaultValue: "" } }
