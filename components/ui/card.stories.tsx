import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Badge } from "./badge"
import { Button } from "./button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card"

const meta = {
  title: "UI/Card",
  component: Card,
  tags: ["autodocs"],
  args: { className: "w-80" },
  argTypes: { size: { control: "select", options: ["default", "sm"] } },
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

const body = (
  <CardHeader>
    <CardTitle>성수역 → 강남역</CardTitle>
    <CardDescription>버스 2회 환승 · 약 42분</CardDescription>
  </CardHeader>
)

// ── size ──
export const Default: Story = { render: (args) => <Card {...args}>{body}</Card> }
export const Small: Story = { args: { size: "sm" }, render: (args) => <Card {...args}>{body}</Card> }

// ── 구성 ──
export const WithAction: Story = {
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>성수역 → 강남역</CardTitle>
        <CardDescription>버스 2회 환승 · 약 42분</CardDescription>
        <CardAction>
          <Badge variant="secondary">환승 2회</Badge>
        </CardAction>
      </CardHeader>
    </Card>
  ),
}

export const WithContent: Story = {
  render: (args) => (
    <Card {...args}>
      {body}
      <CardContent className="text-body-sm">10:30에 출발하세요.</CardContent>
    </Card>
  ),
}

export const WithFooter: Story = {
  render: (args) => (
    <Card {...args}>
      {body}
      <CardContent className="text-body-sm">10:30에 출발하세요.</CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="outline" size="sm">취소</Button>
        <Button size="sm">저장</Button>
      </CardFooter>
    </Card>
  ),
}
