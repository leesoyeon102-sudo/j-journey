import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { useState } from "react"
import { expect } from "storybook/test"

import PlanFilter, { type PlanTab } from "./PlanFilter"

const meta = {
  title: "App/PlanFilter",
  component: PlanFilter,
  tags: ["autodocs"],
  args: { value: "recommended", onChange: () => {}, count: 1, page: 0 },
  decorators: [
    (Story) => (
      <div className="w-[390px] pt-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PlanFilter>

export default meta
type Story = StoryObj<typeof meta>

// 추천: 경로가 하나라서 오른쪽 인디게이터가 없다
export const Recommended: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("tab", { name: "추천" })).toHaveAttribute("aria-selected", "true")
    await expect(canvas.queryByLabelText(/번째 안/)).toBeNull()
  },
}

// 지하철 우선: 3가지 안을 넘길 수 있어서 오른쪽에 인디게이터가 뜬다
export const SubwayFirst: Story = {
  args: { value: "subway", count: 3, page: 1 },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("tab", { name: "지하철 우선" })).toHaveAttribute("aria-selected", "true")
    await expect(canvas.getByLabelText("3개 중 2번째 안")).toBeVisible()
  },
}

// 버스 우선
export const BusFirst: Story = {
  args: { value: "bus", count: 3, page: 0 },
}

// 버스 경로가 없으면 칩이 비활성
export const BusUnavailable: Story = {
  args: { unavailable: { bus: true } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("tab", { name: "버스 우선" })).toBeDisabled()
  },
}

// 눌러서 칩을 바꿀 수 있다
export const Interactive: Story = {
  render: (args) => {
    const [tab, setTab] = useState<PlanTab>(args.value)
    return <PlanFilter {...args} value={tab} onChange={setTab} count={tab === "recommended" ? 1 : 3} />
  },
  play: async ({ canvas }) => {
    await canvas.getByRole("tab", { name: "버스 우선" }).click()
    await expect(canvas.getByRole("tab", { name: "버스 우선" })).toHaveAttribute("aria-selected", "true")
    await expect(canvas.getByLabelText("3개 중 1번째 안")).toBeVisible()
  },
}
