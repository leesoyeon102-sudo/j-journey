import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import PushSetup from "./PushSetup"

const meta = {
  title: "App/PushSetup",
  component: PushSetup,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="py-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PushSetup>

export default meta
type Story = StoryObj<typeof meta>

/** 아직 알림을 허용하기 전 */
export const Default: Story = {}

/** 허용한 뒤: 이 기기의 푸시 주소가 보이고 복사할 수 있다. */
export const TokenReceived: Story = {
  args: {
    initialToken:
      "fVq3xK2mR0e0Z-sample-token:APA91bH_9wYtGq6uJc7mP1nQ2sLk8oXvZ3aB4cD5eF6gH7iJ8kL9mN0oP1qR2sT3uV4wX5yZ6a7B8c9D0e1F2g3H4i5J6k7L8m9N0",
  },
}
