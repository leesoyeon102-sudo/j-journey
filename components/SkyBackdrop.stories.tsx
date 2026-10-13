import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import SkyBackdrop from "./SkyBackdrop"

const meta = {
  title: "App/SkyBackdrop",
  component: SkyBackdrop,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="relative isolate h-[640px] w-[390px] bg-surface px-5 pt-7">
        <Story />
        <h1 className="text-heading font-medium text-on-sky">J의 외출</h1>
        <p className="mt-1 text-body text-on-sky-muted">어디로, 몇 시까지 갈지만 알려주세요.</p>
        <div className="glass-strong mt-6 rounded-nav px-4 py-3">
          <span className="text-caption text-muted-foreground">출발지</span>
          <p className="text-body-lg font-medium">서울역</p>
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof SkyBackdrop>

export default meta
type Story = StoryObj<typeof meta>

// 위는 하늘색, 아래로 갈수록 흰색으로 풀리고, 한쪽에 노을빛과 구름이 번진다.
export const Default: Story = {}
