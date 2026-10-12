import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { useState } from "react"
import { expect } from "storybook/test"

import PlanSlider from "./PlanSlider"

const Card = ({ title, lines, tone }: { title: string; lines: number; tone: string }) => (
  <div className="px-5 py-4">
    <div className={`rounded-nav p-5 ${tone}`}>
      <p className="text-subheading font-medium">{title}</p>
      {Array.from({ length: lines }, (_, i) => (
        <p key={i} className="mt-2 text-body text-muted-foreground">
          경로 내용 {i + 1}
        </p>
      ))}
    </div>
  </div>
)

const meta = {
  title: "App/PlanSlider",
  component: PlanSlider,
  tags: ["autodocs"],
  args: { page: 0, onPageChange: () => {}, resetKey: "a", children: [] },
  decorators: [
    (Story) => (
      <div className="w-[390px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PlanSlider>

export default meta
type Story = StoryObj<typeof meta>

// 안마다 길이가 달라도 보이는 칸의 높이에 맞춰진다. 좌우로 끌어서 넘긴다. (세로 스크롤은 그대로 동작)
export const Default: Story = {
  render: (args) => {
    const [page, setPage] = useState(args.page)
    return (
      <>
        <p className="px-5 pb-2 text-caption text-muted-foreground" aria-label="현재 칸">
          {page + 1} / 3
        </p>
        <PlanSlider {...args} page={page} onPageChange={setPage}>
          {[
            <Card key="a" title="1안 (짧음)" lines={2} tone="bg-muted" />,
            <Card key="b" title="2안 (보통)" lines={6} tone="bg-accent-subtle" />,
            <Card key="c" title="3안 (김)" lines={11} tone="bg-success-subtle" />,
          ]}
        </PlanSlider>
      </>
    )
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("1 / 3")).toBeVisible()
  },
}
