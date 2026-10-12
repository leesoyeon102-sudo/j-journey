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

/** 여유 시간 카드. 마이너스·플러스 버튼으로 약속 시각보다 얼마나 일찍 도착할지 정한다. */
export default function BufferStepper({ value, onChange, min = 0, max = 60, step = 5 }: Props) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  return (
    <div className="flex min-h-16 w-full items-center justify-between rounded-input bg-muted px-4 py-3">
      <div>
        <span className="block text-caption text-muted-foreground">여유 시간</span>
        <span className="block text-body-lg font-medium tabular-nums" aria-live="polite">
          {value === 0 ? "여유 없이" : `${value}분 일찍 도착`}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
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
          size="icon-lg"
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
