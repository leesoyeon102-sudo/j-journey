"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

/** 도착 버튼은 안내된 소요 시간보다 이만큼 일찍부터 누를 수 있다. */
export const ARRIVE_OPEN_BEFORE_MIN = 5;
/** 안내된 소요 시간보다 이만큼 넘게 걸리면 "늦었어요"로 기록한다. */
export const LATE_AFTER_MIN = 5;

export type TripPhase = "ready" | "moving" | "arrivable";

/** 출발 전 → 이동 중 → 도착 가능. 소요 시간(분)보다 5분 일찍 지나면 도착을 누를 수 있다. */
export function tripPhase(departedAt: number | undefined, durationMin: number, now: number): TripPhase {
  if (!departedAt) return "ready";
  const elapsedMin = (now - departedAt) / 60_000;
  return elapsedMin >= durationMin - ARRIVE_OPEN_BEFORE_MIN ? "arrivable" : "moving";
}

/** 출발한 뒤 걸린 시간이 안내된 소요 시간을 크게 넘겼는지 */
export function isLate(departedAt: number, durationMin: number, now: number) {
  return (now - departedAt) / 60_000 > durationMin + LATE_AFTER_MIN;
}

interface Props {
  /** "출발할게요"를 누른 시각(ms). 아직 안 눌렀으면 비운다. */
  departedAt?: number;
  /** 안내된 총 소요 시간(분) */
  durationMin: number;
  onDepart: () => void;
  onArrive: (onTime: boolean) => void;
  /** 약속이 오늘이 아니면(내일 약속) 아직 출발할 수 없다. 출발 전에만 쓴다. */
  notToday?: boolean;
}

/** 출발 안내 화면 하단의 단계 버튼: 출발했어요 → 이 계획대로 이동중 → 도착했어요 */
export default function TripActionButton({ departedAt, durationMin, onDepart, onArrive, notToday }: Props) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!departedAt) return;
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, [departedAt]);

  const phase = tripPhase(departedAt, durationMin, now);

  if (phase === "ready" && notToday) {
    return (
      <Button size="lg" className="w-full" disabled>
        내일 출발할 수 있어요
      </Button>
    );
  }
  if (phase === "ready") {
    return (
      <Button size="lg" className="w-full" onClick={onDepart}>
        출발할게요
      </Button>
    );
  }
  if (phase === "moving") {
    // 눌러도 아무 일이 없지만 흐려 보이지 않게 disabled 대신 aria-disabled로 둔다.
    // 배경은 비활성(muted)보다 한 단계 어두운 fill-strong 색.
    return (
      <Button
        size="lg"
        className="w-full cursor-default bg-fill-strong text-on-surface hover:bg-fill-strong"
        aria-disabled="true"
        aria-live="polite"
      >
        이 계획대로 이동중
        {/* 점 세 개가 차례로 움직이는 진행 중 표시 */}
        <span className="ml-1 inline-flex items-center gap-1" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span key={i} className="dot-wave size-1 rounded-pill bg-current" style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </span>
      </Button>
    );
  }
  return (
    <Button size="lg" className="w-full" onClick={() => onArrive(!isLate(departedAt!, durationMin, Date.now()))}>
      도착했어요
    </Button>
  );
}
