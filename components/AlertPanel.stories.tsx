import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import AlertPanel from "./AlertPanel"
import { Button } from "./ui/button"

const meta = {
  title: "App/AlertPanel",
  component: AlertPanel,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    // 화면 전체를 덮으므로 문서 페이지에서는 iframe 안에서 보여준다.
    docs: { story: { inline: false, iframeHeight: 360 } },
  },
  args: { onClose: () => {} },
} satisfies Meta<typeof AlertPanel>

export default meta
type Story = StoryObj<typeof meta>

// 버튼 두 개: 출발 안내 화면을 나갈 때
export const TwoActions: Story = {
  args: {
    title: "출발 안내 화면을 나갈까요?",
    description: "안내 내역에서 다시 확인할 수 있어요.",
    children: (
      <>
        <Button variant="secondary" size="lg">취소</Button>
        <Button size="lg">나가기</Button>
      </>
    ),
  },
}

// 버튼 하나: 도착을 기록했을 때
export const OneAction: Story = {
  args: {
    title: "제시간에 도착했어요",
    description: "도착을 기록했어요. 확인을 누르면 홈으로 돌아가요.",
    children: <Button size="lg">확인</Button>,
  },
}

// 설명 아래에 입력란 같은 내용을 놓을 때
export const WithContent: Story = {
  args: {
    title: "의견을 남겨 주세요",
    description: "서비스가 어땠는지 알려 주세요.",
    content: <div className="h-24 rounded-input bg-muted" />,
    children: (
      <>
        <Button variant="secondary" size="lg">나중에</Button>
        <Button size="lg">보내기</Button>
      </>
    ),
  },
}

// 출발한 계획이 있을 때 안내 내역에서 다른 계획을 다시 검색하려는 경우
export const ReplanConfirm: Story = {
  args: {
    title: "이 계획을 다시 검색할까요?",
    description: "앞에서 출발한 계획은 사라져요.",
    children: (
      <>
        <Button variant="secondary" size="lg">취소</Button>
        <Button size="lg">다시 검색하기</Button>
      </>
    ),
  },
}

// "출발했어요"를 누른 직후: 소요 시간이 지난 뒤 도착했어요를 누르라고 알려 준다
export const DepartRecorded: Story = {
  args: {
    title: "출발을 기록했어요",
    description: (
      <>
        소요 시간(약 <b className="font-medium text-on-surface">38분</b>)이 지난 뒤, 도착하면
        <br />
        <b className="font-medium text-on-surface">도착했어요</b>를 눌러 주세요.
      </>
    ),
    children: <Button size="lg">확인</Button>,
  },
}
