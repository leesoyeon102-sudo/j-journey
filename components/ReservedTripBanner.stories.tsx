import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect, fn } from "storybook/test"

import ReservedTripBanner from "./ReservedTripBanner"

const DAY = 24 * 60 * 60_000

const meta = {
  title: "App/ReservedTripBanner",
  component: ReservedTripBanner,
  tags: ["autodocs"],
  args: { leaveAtMs: Date.now() + DAY, destination: "닭장맥주 홍대점", onClick: fn() },
  decorators: [
    (Story) => (
      <div className="sky-wash w-[390px] p-5">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ReservedTripBanner>

export default meta
type Story = StoryObj<typeof meta>

// 내일 예약: 누르면 onClick
export const Tomorrow: Story = {
  play: async ({ canvas, args }) => {
    await canvas.getByRole("button", { name: /내일/ }).click()
    await expect(args.onClick).toHaveBeenCalled()
  },
}

// 오늘 출발 예정
export const Today: Story = {
  args: { leaveAtMs: Date.now() + 60 * 60_000 },
}

// 도착지 이름이 길면 한 줄로 줄인다
export const LongDestination: Story = {
  args: { destination: "서울특별시 강동구 올림픽로 610 천호역 효성해링턴스퀘어 지하 1층" },
}
