import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import Toast from "./Toast"

const meta = {
  title: "App/Toast",
  component: Toast,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    // 화면 아래에 고정되므로 문서 페이지에서는 iframe 안에서 보여준다.
    docs: { story: { inline: false, iframeHeight: 240 } },
  },
} satisfies Meta<typeof Toast>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { args: { message: "경로가 삭제되었습니다." } }
export const LongMessage: Story = {
  args: { message: "경로가 삭제되었습니다. 경로 내역에서 더 이상 볼 수 없어요." },
}
