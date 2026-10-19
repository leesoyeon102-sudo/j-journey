import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { useState } from "react"

import { Switch } from "./switch"

const meta = {
  title: "UI/Switch",
  component: Switch,
  tags: ["autodocs"],
  args: { checked: false, onCheckedChange: () => {}, "aria-label": "알림 허용" },
} satisfies Meta<typeof Switch>

export default meta
type Story = StoryObj<typeof meta>

// ── 상태 ──
export const Off: Story = {}
export const On: Story = { args: { checked: true } }
export const Disabled: Story = { args: { disabled: true } }

// 눌러서 켜고 끄는 모습
export const Interactive: Story = {
  render: (args) => {
    const [checked, setChecked] = useState(false)
    return <Switch {...args} checked={checked} onCheckedChange={setChecked} />
  },
}
