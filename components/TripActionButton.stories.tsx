import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect, fn } from "storybook/test"

import TripActionButton from "./TripActionButton"

const MIN = 60_000

const meta = {
  title: "App/TripActionButton",
  component: TripActionButton,
  tags: ["autodocs"],
  args: { durationMin: 30, onDepart: fn(), onArrive: fn() },
  decorators: [
    (Story) => (
      <div className="w-[350px] p-5">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TripActionButton>

export default meta
type Story = StoryObj<typeof meta>

// 출발 전: 누르면 onDepart
export const Ready: Story = {
  play: async ({ canvas, args }) => {
    await canvas.getByRole("button", { name: "출발할게요" }).click()
    await expect(args.onDepart).toHaveBeenCalled()
  },
}

// 내일 약속: 오늘은 출발할 수 없어서 문구가 바뀌고 버튼이 비활성
export const NotToday: Story = {
  args: { notToday: true },
  play: async ({ canvas, args }) => {
    const button = canvas.getByRole("button", { name: "내일 출발할 수 있어요" })
    await expect(button).toBeDisabled()
    await expect(args.onDepart).not.toHaveBeenCalled()
  },
}

// 이동 중: 눌러도 아무 일이 없다
export const Moving: Story = {
  args: { departedAt: Date.now() - 2 * MIN },
  play: async ({ canvas, args }) => {
    const button = canvas.getByRole("button", { name: "이 계획대로 이동중" })
    await expect(button).toHaveAttribute("aria-disabled", "true")
    await button.click()
    await expect(args.onArrive).not.toHaveBeenCalled()
  },
}

// 소요 시간(30분)보다 5분 일찍 지나면(25분 뒤) 도착을 누를 수 있다
export const Arrivable: Story = {
  args: { departedAt: Date.now() - 26 * MIN },
  play: async ({ canvas, args }) => {
    await canvas.getByRole("button", { name: "도착했어요!" }).click()
    await expect(args.onArrive).toHaveBeenCalledWith(true)
  },
}

// 소요 시간보다 5분 넘게 걸렸으면 늦은 것으로 기록
export const ArrivableLate: Story = {
  args: { departedAt: Date.now() - 40 * MIN },
  play: async ({ canvas, args }) => {
    await canvas.getByRole("button", { name: "도착했어요!" }).click()
    await expect(args.onArrive).toHaveBeenCalledWith(false)
  },
}
