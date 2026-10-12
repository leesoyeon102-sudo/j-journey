import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect } from "storybook/test"

import KakaoMapLink from "./KakaoMapLink"

const meta = {
  title: "App/KakaoMapLink",
  component: KakaoMapLink,
  tags: ["autodocs"],
  args: {
    from: { name: "집", lat: 37.5547, lng: 126.9707 },
    to: { name: "서울역", lat: 37.553, lng: 126.9726 },
  },
  decorators: [
    (Story) => (
      <div className="flex items-center gap-2 p-5 text-body text-muted-foreground">
        서울역까지 도보 7분
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof KakaoMapLink>

export default meta
type Story = StoryObj<typeof meta>

// 걷는 구간 설명 옆에 붙는 작은 흰색 버튼. 출발·도착 이름과 좌표(위도,경도)로 카카오맵 도보 길찾기를 새 창에서 연다.
export const Default: Story = {
  play: async ({ canvas }) => {
    const link = canvas.getByRole("link", { name: "집에서 서울역까지 카카오맵 도보 길찾기" })
    await expect(link).toHaveAttribute(
      "href",
      "https://map.kakao.com/link/by/walk/%EC%A7%91,37.554700,126.970700/%EC%84%9C%EC%9A%B8%EC%97%AD,37.553000,126.972600",
    )
    await expect(link).toHaveAttribute("target", "_blank")
  },
}
