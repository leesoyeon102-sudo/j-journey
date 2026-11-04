"use client";

import { ChevronRightIcon } from "lucide-react";
import { fmt, fmtDate } from "@/lib/time";

interface Props {
  /** 예약한 출발 시각(ms) */
  leaveAtMs: number;
  destination: string;
  onClick: () => void;
}

/** "오늘" "내일" 또는 "11/6" */
function dayLabel(ms: number) {
  const target = new Date(ms);
  const today = new Date();
  const diff = Math.round(
    (new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime() -
      new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) /
      86_400_000,
  );
  return diff === 0 ? "오늘" : diff === 1 ? "내일" : fmtDate(ms);
}

/** 홈 상단: 외출 예약해 둔 안내를 작게 알리는 배너. 누르면 그 출발 안내 화면이 열린다. */
export default function ReservedTripBanner({ leaveAtMs, destination, onClick }: Props) {
  const d = new Date(leaveAtMs);
  return (
    <button
      type="button"
      onClick={onClick}
      className="fade-in glass flex w-full items-center gap-3 rounded-nav px-4 py-3 text-left transition-transform duration-(--motion-duration-fast) ease-(--motion-ease) active:scale-(--motion-press-scale)"
    >
      <div className="min-w-0 flex-1">
        <p className="text-caption text-muted-foreground">예정된 외출</p>
        <p className="truncate text-body font-semibold text-on-surface">
          <span className="text-brand">
            {dayLabel(leaveAtMs)} {fmt(d.getHours() * 60 + d.getMinutes())}
          </span>{" "}
          출발 · {destination}
        </p>
      </div>
      <ChevronRightIcon className="size-5 shrink-0 text-inactive" strokeWidth={1.8} aria-hidden="true" />
    </button>
  );
}
