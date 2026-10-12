"use client";

import { Button } from "@/components/ui/button";

interface Props {
  /** 약속 시각보다 이만큼(분) 일찍 도착하도록 계산한다. */
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

/** 여유 시간 줄. "내일 약속이에요"처럼 카드 없이 한 줄로 놓고, 마이너스·플러스 버튼으로 약속 시각보다 얼마나 일찍 도착할지 정한다. */
export default function BufferStepper({ value, onChange, min = 0, max = 60, step = 5 }: Props) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  return (
    <div className="flex h-12 items-center justify-between px-1">
      <span className="text-body text-on-surface tabular-nums" aria-live="polite">
        {value === 0 ? "여유 없이 도착해요" : `${value}분 일찍 도착해요`}
      </span>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="여유 시간 줄이기"
          disabled={value <= min}
          onClick={() => onChange(clamp(value - step))}
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
            <path d="M6 12h12" />
          </svg>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="여유 시간 늘리기"
          disabled={value >= max}
          onClick={() => onChange(clamp(value + step))}
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
            <path d="M12 6v12M6 12h12" />
          </svg>
        </Button>
      </div>
    </div>
  )
}
