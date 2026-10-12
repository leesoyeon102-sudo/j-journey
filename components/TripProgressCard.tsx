"use client";

import { Button } from "@/components/ui/button";
import { fmt } from "@/lib/time";

interface Props {
  origin: string;
  destination: string;
  /** 하루 0시 기준 분 */
  leaveAt: number;
  arriveAt: number;
  onDetail: () => void;
  onCancel: () => void;
}

/** 홈 화면: 출발한 뒤 이동 중인 안내를 보여 주는 카드 */
export default function TripProgressCard({ origin, destination, leaveAt, arriveAt, onDetail, onCancel }: Props) {
  return (
    <section className="rounded-nav border border-border bg-surface p-5" aria-label="이동 중인 경로">
      <div className="flex items-center gap-2">
        {/* 초록 점이 퍼지는 모션으로 지금 진행 중임을 알린다. */}
        <span className="relative flex size-3" aria-hidden="true">
          <span className="absolute inline-flex size-full animate-ping rounded-pill bg-success opacity-60 motion-reduce:animate-none" />
          <span className="relative inline-flex size-3 rounded-pill bg-success" />
        </span>
        <span className="text-label font-semibold">이동중</span>
      </div>

      {/* 가장 크게 읽혀야 하는 것: 출발·도착 시각. 출발은 파랑, 도착은 본문색. */}
      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-end gap-2">
        <div>
          <p className="text-caption text-muted-foreground">출발</p>
          <p className="text-time font-medium tabular-nums text-brand">{fmt(leaveAt)}</p>
        </div>
        <svg viewBox="0 0 24 24" className="mb-2 size-5 text-inactive" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
        <div>
          <p className="text-caption text-muted-foreground">도착</p>
          <p className="text-time font-medium tabular-nums">{fmt(arriveAt)}</p>
        </div>
      </div>

      {/* 장소는 한 단계 낮춰 보조 정보로 */}
      <dl className="mt-5 space-y-2 border-t border-border pt-4">
        <div className="flex gap-3">
          <dt className="w-12 shrink-0 text-caption text-muted-foreground">출발지</dt>
          <dd className="min-w-0 text-body">{origin}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-12 shrink-0 text-caption text-muted-foreground">도착지</dt>
          <dd className="min-w-0 text-body">{destination}</dd>
        </div>
      </dl>

      <div className="mt-5 space-y-1">
        <Button size="lg" className="w-full" onClick={onDetail}>
          출발 안내 상세
        </Button>
        {/* 위계가 가장 낮은 버튼: 글자만 있는 ghost */}
        <Button variant="ghost" size="lg" className="w-full text-muted-foreground" onClick={onCancel}>
          출발 취소
        </Button>
      </div>
    </section>
  );
}
