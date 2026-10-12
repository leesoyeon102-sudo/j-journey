import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect, fn, screen, userEvent } from "storybook/test"

import TripMenu from "./TripMenu"

const meta = {
  title: "App/TripMenu",
  component: TripMenu,
  tags: ["autodocs"],
  args: { onCancelDeparture: fn() },
  decorators: [
    (Story) => (
      <div className="flex w-[390px] justify-end px-2 pt-2">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TripMenu>

export default meta
type Story = StoryObj<typeof meta>

// 닫힌 상태: 점 세 개 아이콘만 보인다
export const Closed: Story = {}

// 열린 상태: "출발 취소" 항목
export const Open: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "더보기" }))
    await expect(await screen.findByRole("menuitem", { name: "출발 취소" })).toBeVisible()
  },
}

// 출발 취소를 고르면 콜백이 불린다
export const SelectCancel: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "더보기" }))
    await userEvent.click(await screen.findByRole("menuitem", { name: "출발 취소" }))
    await expect(args.onCancelDeparture).toHaveBeenCalled()
  },
}
