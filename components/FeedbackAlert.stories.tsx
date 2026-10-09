import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { userEvent, within } from "storybook/test"

import FeedbackAlert from "./FeedbackAlert"

const meta = {
  title: "App/FeedbackAlert",
  component: FeedbackAlert,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    // 화면 전체를 덮으므로 문서 페이지에서는 iframe 안에서 보여준다.
    docs: { story: { inline: false, iframeHeight: 520 } },
  },
  args: { onSubmit: () => {}, onClose: () => {} },
} satisfies Meta<typeof FeedbackAlert>

export default meta
type Story = StoryObj<typeof meta>

// 별점을 고르기 전: 보내기 버튼이 비활성
export const Default: Story = {}

// 별점을 고른 뒤: 별이 채워지고 보내기 버튼이 활성
export const Rated: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement.ownerDocument.body).getByRole("radio", { name: "4점" }))
  },
}
