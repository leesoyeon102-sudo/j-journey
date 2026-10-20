import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import InstallAlert from "./InstallAlert"

const meta = {
  title: "App/InstallAlert",
  component: InstallAlert,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    // 화면 전체를 덮으므로 문서 페이지에서는 iframe 안에서 보여준다.
    docs: { story: { inline: false, iframeHeight: 520 } },
  },
  args: { onClose: () => {} },
} satisfies Meta<typeof InstallAlert>

export default meta
type Story = StoryObj<typeof meta>

// 사파리로 열었을 때: 방법 이미지 3장을 넘겨 보는 슬라이드 + 확인
export const Safari: Story = {}

// 인스타그램 같은 앱 안의 브라우저로 열었을 때: 확인 하나
export const InApp: Story = {
  args: { inApp: true },
}
