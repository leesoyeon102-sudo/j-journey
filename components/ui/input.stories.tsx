import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Input } from "./input"

const meta = {
  title: "UI/Input",
  component: Input,
  tags: ["autodocs"],
  args: { placeholder: "시간을 입력하세요", className: "w-72" },
  argTypes: {
    type: { control: "select", options: ["text", "time", "password", "email", "file"] },
  },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

// ── 기본 ──
export const Default: Story = {}
export const WithValue: Story = { args: { defaultValue: "10:30" } }

// ── type ──
export const Time: Story = { args: { type: "time", defaultValue: "10:30" } }
export const Password: Story = { args: { type: "password", defaultValue: "secret" } }
export const File: Story = { args: { type: "file" } }

// ── 상태 ──
// 포커스는 :focus-visible 클래스를 그대로 붙여 보여준다.
export const Focus: Story = { args: { defaultValue: "10:30", className: "w-72 border-ink ring-3 ring-ink/10" } }
export const Disabled: Story = { args: { disabled: true, defaultValue: "10:30" } }
export const Invalid: Story = { args: { "aria-invalid": true, defaultValue: "25:99" } }
