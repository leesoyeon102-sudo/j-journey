import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect, fn, userEvent, within } from "storybook/test"

import RouteCard from "./RouteCard"

const meta = {
  title: "App/RouteCard",
  component: RouteCard,
  tags: ["autodocs"],
  args: {
    origin: { name: "현재 위치", area: "서울 강서구 마곡동 760-3" },
    destination: { name: "석촌호수", area: "서울 송파구 잠실동" },
    time: "18:00",
    onPickOrigin: fn(),
    onPickDestination: fn(),
    onTimeChange: fn(),
    onSwap: fn(),
  },
  decorators: [
    (Story) => (
      <div className="sky-wash w-[390px] p-5">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RouteCard>

export default meta
type Story = StoryObj<typeof meta>

// 출발지·도착지·약속 시각이 한 카드 안에서 디바이더로 나뉘고, 바꾸기 버튼이 첫 디바이더 오른쪽에 걸쳐 있다.
export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "출발지와 도착지 바꾸기" }))
    await expect(args.onSwap).toHaveBeenCalled()
  },
}

// 도착지를 아직 안 골랐으면 바꾸기 버튼이 눌리지 않는다.
export const EmptyDestination: Story = {
  args: { destination: null },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("button", { name: "출발지와 도착지 바꾸기" })).toBeDisabled()
  },
}

// 긴 주소는 말줄임
export const LongAddress: Story = {
  args: { origin: { name: "현재 위치", area: "서울특별시 강서구 마곡중앙로 161-8 마곡 엠밸리 지식산업센터 12층" } },
}
