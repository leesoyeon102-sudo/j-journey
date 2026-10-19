"use client";

import { Button } from "@/components/ui/button";
import { kakaoMapUrl, naverMapUrl } from "@/lib/mapLinks";
import type { Plan } from "@/lib/types";
import { DropdownMenu } from "radix-ui";

interface Props {
  /** 카카오맵·네이버지도 길찾기에 넘길 출발지·도착지 */
  plan: Pick<Plan, "origin" | "destination" | "originCoord" | "destCoord">;
  /** 출발했던 것을 취소하고 출발 전 상태로 되돌린다. */
  onCancelDeparture: () => void;
}

/** 출발 안내 화면 오른쪽 위의 점 세 개 메뉴(카카오맵·네이버맵 검색, 출발 취소). 출발한 뒤에만 쓴다. */
export default function TripMenu({ plan, onCancelDeparture }: Props) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button type="button" variant="ghost" size="icon-lg" aria-label="더보기">
          <svg viewBox="0 0 24 24" className="size-6" fill="currentColor" aria-hidden="true">
            <circle cx="5" cy="12" r="1.6" />
            <circle cx="12" cy="12" r="1.6" />
            <circle cx="19" cy="12" r="1.6" />
          </svg>
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          className="fade-in z-[70] min-w-36 glass-strong rounded-nav p-1"
        >
          <DropdownMenu.Item asChild>
            <a href={kakaoMapUrl(plan)} target="_blank" rel="noopener noreferrer" className="flex h-11 cursor-pointer items-center rounded-chip px-3 text-body outline-none data-[highlighted]:bg-muted">
              카카오맵 검색
            </a>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild>
            <a href={naverMapUrl(plan)} target="_blank" rel="noopener noreferrer" className="flex h-11 cursor-pointer items-center rounded-chip px-3 text-body outline-none data-[highlighted]:bg-muted">
              네이버맵 검색
            </a>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={onCancelDeparture}
            className="flex h-11 cursor-pointer items-center rounded-chip px-3 text-body outline-none data-[highlighted]:bg-muted"
          >
            출발 취소
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
