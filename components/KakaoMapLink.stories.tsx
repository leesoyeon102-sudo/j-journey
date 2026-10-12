import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect } from "storybook/test"

import KakaoMapLink from "./KakaoMapLink"

const meta = {
  title: "App/KakaoMapLink",
  component: KakaoMapLink,
  tags: ["autodocs"],
  args: {
    origin: { name: "집", lat: 37.5547, lng: 126.9707 },
    destination: { name: "강남역", lat: 37.4979, lng: 127.0276 },
  },
  decorators: [
    (Story) => (
      <div className="w-[390px] p-5">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof KakaoMapLink>

export default meta
type Story = StoryObj<typeof meta>

// 출발지·도착지 이름과 좌표(위도,경도)로 카카오맵 대중교통 길찾기를 새 창에서 연다
export const Default: Story = {
  play: async ({ canvas }) => {
    const link = canvas.getByRole("link", { name: "카카오맵에서 전체 경로 보기" })
    await expect(link).toHaveAttribute(
      "href",
      "https://map.kakao.com/link/by/traffic/%EC%A7%91,37.554700,126.970700/%EA%B0%95%EB%82%A8%EC%97%AD,37.497900,127.027600",
    )
    await expect(link).toHaveAttribute("target", "_blank")
  },
}
