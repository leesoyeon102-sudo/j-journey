import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Button } from "./button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog"

const meta = {
  title: "UI/Dialog",
  component: Dialog,
  tags: ["autodocs"],
  parameters: {
    // 다이얼로그는 화면 전체를 덮으므로 문서 페이지에서는 iframe 안에서 보여준다.
    docs: { story: { inline: false, iframeHeight: 360 } },
  },
} satisfies Meta<typeof Dialog>

export default meta
type Story = StoryObj<typeof meta>

const header = (
  <DialogHeader>
    <DialogTitle>출발 알림을 켤까요?</DialogTitle>
    <DialogDescription>출발 30분 전에 알려드려요.</DialogDescription>
  </DialogHeader>
)

// ── 상태 ──
export const Closed: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">알림 설정</Button>
      </DialogTrigger>
      <DialogContent>{header}</DialogContent>
    </Dialog>
  ),
}

export const Open: Story = {
  render: () => (
    <Dialog defaultOpen>
      <DialogContent>
        {header}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">취소</Button>
          </DialogClose>
          <Button>확인</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

export const WithoutCloseButton: Story = {
  render: () => (
    <Dialog defaultOpen>
      <DialogContent showCloseButton={false}>
        {header}
        <DialogFooter>
          <Button>확인</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

export const FooterCloseButton: Story = {
  render: () => (
    <Dialog defaultOpen>
      <DialogContent>
        {header}
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  ),
}

export const Destructive: Story = {
  render: () => (
    <Dialog defaultOpen>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>약속을 삭제할까요?</DialogTitle>
          <DialogDescription>삭제하면 되돌릴 수 없어요.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">취소</Button>
          </DialogClose>
          <Button variant="destructive">삭제</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}
