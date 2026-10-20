import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import LandingArt from "./LandingArt"

const meta = {
  title: "App/LandingArt",
  component: LandingArt,
  tags: ["autodocs"],
  args: { variant: "clock" },
} satisfies Meta<typeof LandingArt>

export default meta
type Story = StoryObj<typeof meta>

// "나갈 시각" 카드 왼쪽의 시계 일러스트
export const Clock: Story = {}

// "참여 선물" 카드 왼쪽의 선물 상자 일러스트
export const Gift: Story = {
  args: { variant: "gift" },
}
