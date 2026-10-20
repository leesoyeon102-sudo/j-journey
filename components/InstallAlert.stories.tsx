import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import InstallAlert from "./InstallAlert"

const meta = {
  title: "App/InstallAlert",
  component: InstallAlert,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    // 화면 전체를 덮으므로 문서 페이지에서는 iframe 안에서 보여준다.
    docs: { story: { inline: false, iframeHeight: 400 } },
  },
  args: { onClose: () => {}, onGuide: () => {} },
} satisfies Meta<typeof InstallAlert>

export default meta
type Story = StoryObj<typeof meta>

// 사파리로 열었을 때: 나중에 / 방법 보기
export const Safari: Story = {}

// 인스타그램 같은 앱 안의 브라우저로 열었을 때: 확인 하나
export const InApp: Story = {
  args: { inApp: true },
}
