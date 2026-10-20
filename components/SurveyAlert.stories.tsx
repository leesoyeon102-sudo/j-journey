import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import SurveyAlert from "./SurveyAlert"

const meta = {
  title: "App/SurveyAlert",
  component: SurveyAlert,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    // 화면 전체를 덮으므로 문서 페이지에서는 iframe 안에서 보여준다.
    docs: { story: { inline: false, iframeHeight: 360 } },
  },
  args: { href: "https://forms.google.com", onGo: () => {} },
} satisfies Meta<typeof SurveyAlert>

export default meta
type Story = StoryObj<typeof meta>

// 도착했어요!를 누른 뒤 뜨는 설문 참여 얼럿
export const Default: Story = {}
