import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { useState } from "react"
import { expect } from "storybook/test"

import BufferStepper from "./BufferStepper"

const meta = {
  title: "App/BufferStepper",
  component: BufferStepper,
  tags: ["autodocs"],
  args: { value: 5, onChange: () => {} },
  decorators: [
    (Story) => (
      <div className="w-[350px] p-5">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BufferStepper>

export default meta
type Story = StoryObj<typeof meta>

// 기본 5분. 누르면 5분씩 늘고 줄어든다.
export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.value)
    return <BufferStepper {...args} value={value} onChange={setValue} />
  },
  play: async ({ canvas }) => {
    await canvas.getByRole("button", { name: "여유 시간 늘리기" }).click()
    await expect(canvas.getByText("10분 일찍 도착")).toBeVisible()
    await canvas.getByRole("button", { name: "여유 시간 줄이기" }).click()
    await expect(canvas.getByText("5분 일찍 도착")).toBeVisible()
  },
}

// 0분이면 줄이기 버튼이 비활성
export const AtMinimum: Story = {
  args: { value: 0 },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("여유 없이")).toBeVisible()
    await expect(canvas.getByRole("button", { name: "여유 시간 줄이기" })).toBeDisabled()
  },
}

// 60분이면 늘리기 버튼이 비활성
export const AtMaximum: Story = {
  args: { value: 60 },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "여유 시간 늘리기" })).toBeDisabled()
  },
}
