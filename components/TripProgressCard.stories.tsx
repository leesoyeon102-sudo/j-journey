import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect, fn } from "storybook/test"

import TripProgressCard from "./TripProgressCard"

const meta = {
  title: "App/TripProgressCard",
  component: TripProgressCard,
  tags: ["autodocs"],
  args: {
    origin: "서울역",
    destination: "강남역",
    leaveAt: 14 * 60 + 14,
    arriveAt: 14 * 60 + 51,
    onDetail: fn(),
  },
  decorators: [
    (Story) => (
      <div className="sky-wash w-[390px] p-5">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TripProgressCard>

export default meta
type Story = StoryObj<typeof meta>

// 이동 중: 초록 점이 퍼지는 모션, 출발·도착 시각
export const Moving: Story = {}

// 상세 버튼을 누르면 출발 안내 화면으로
export const OpenDetail: Story = {
  play: async ({ canvas, args }) => {
    await canvas.getByRole("button", { name: "출발 안내 상세" }).click()
    await expect(args.onDetail).toHaveBeenCalled()
  },
}

// 긴 장소 이름
export const LongNames: Story = {
  args: { origin: "서울특별시 중구 세종대로 110 서울특별시청 본관 앞", destination: "경기도 성남시 분당구 판교역로 235 에이치스퀘어" },
}
