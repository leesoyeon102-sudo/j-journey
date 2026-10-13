import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { HomeEditIcon, HomeIcon } from "./HomeIcon"

const meta = {
  title: "App/HomeIcon",
  component: HomeIcon,
  tags: ["autodocs"],
  args: { className: "size-6" },
} satisfies Meta<typeof HomeIcon>

export default meta
type Story = StoryObj<typeof meta>

// 집 칩에 쓰는 집 아이콘
export const Home: Story = {}

// 홈 오른쪽 위 "집 주소 변경" 버튼의 집+연필 아이콘
export const HomeEdit: Story = {
  render: (args) => <HomeEditIcon {...args} />,
}
