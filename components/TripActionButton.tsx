"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { burstConfetti } from "@/lib/celebrate";

/** 도착 버튼은 안내된 소요 시간보다 이만큼 일찍부터 누를 수 있다. */
export const ARRIVE_OPEN_BEFORE_MIN = 5;
/** 안내된 소요 시간보다 이만큼 넘게 걸리면 "늦었어요"로 기록한다. */
export const LATE_AFTER_MIN = 5;

export type TripPhase = "ready" | "moving" | "arrivable";

/**
 * 출발 전 → 이동 중 → 도착 가능. 출발한 뒤 소요 시간(분)보다 5분 일찍 지나면 도착을 누를 수 있다.
 * 안내의 도착 예정 시각(arriveAtMin, 하루 0시 기준 분)을 알면, 늦게 출발해서 소요 시간이 덜 지났어도 그 시각이 되면 누를 수 있다.
 */
export function tripPhase(departedAt: number | undefined, durationMin: number, now: number, arriveAtMin?: number): TripPhase {
  if (!departedAt) return "ready";
  const elapsedMin = (now - departedAt) / 60_000;
  if (elapsedMin >= durationMin - ARRIVE_OPEN_BEFORE_MIN) return "arrivable";
  if (arriveAtMin !== undefined && new Date(now).toDateString() === new Date(departedAt).toDateString()) {
    const d = new Date(now);
    if (d.getHours() * 60 + d.getMinutes() >= arriveAtMin - ARRIVE_OPEN_BEFORE_MIN) return "arrivable";
  }
  return "moving";
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
  /** 안내된 도착 예정 시각(하루 0시 기준 분). 이 시각이 지나면 출발한 지 오래되지 않았어도 도착을 누를 수 있다. */
  arriveAtMin?: number;
  onDepart: () => void;
  onArrive: (onTime: boolean) => void;
  /** 현재 위치에서 다시 찾은 안이면 출발 전 버튼 글자가 "이어서 출발할게요"가 된다. 출발 전에만 쓴다. */
  resume?: boolean;
}

/** 출발 안내 화면 하단의 단계 버튼: 출발했어요 → 이 계획대로 이동중 → 도착했어요! */
export default function TripActionButton({ departedAt, durationMin, arriveAtMin, onDepart, onArrive, resume }: Props) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!departedAt) return;
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, [departedAt]);

  const phase = tripPhase(departedAt, durationMin, now, arriveAtMin);

  // 도착했어요!를 누르면 버튼에서 컨페티가 터지고, 연출이 끝난 뒤에 onArrive를 부른다. (얼럿이 연출과 겹치지 않게)
  const buttonRef = useRef<HTMLButtonElement>(null);
  const finish = useRef<(() => void) | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  useEffect(
    () => () => {
      // 연출 도중 화면을 떠나도 도착 기록은 남긴다.
      if (timer.current) clearTimeout(timer.current);
      finish.current?.();
    },
    [],
  );
  const arrive = () => {
    if (celebrating) return;
    const onTime = !isLate(departedAt!, durationMin, Date.now());
    const run = () => {
      finish.current = null;
      onArrive(onTime);
    };
    const wait = buttonRef.current ? burstConfetti(buttonRef.current) : 0;
    if (wait === 0) return run();
    setCelebrating(true);
    finish.current = run;
    timer.current = setTimeout(run, wait);
  };

  if (phase === "ready") {
    return (
      <Button size="lg" className="w-full" onClick={onDepart}>
        <span key="ready" className="fade-in">{resume ? "이어서 출발할게요" : "출발할게요"}</span>
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
        <span key="moving" className="fade-in">이 계획대로 이동중</span>
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
    <Button ref={buttonRef} size="lg" className="w-full" onClick={arrive} aria-disabled={celebrating || undefined}>
      {celebrating ? (
        <span key="done" className="fade-in">도착 기록 완료</span>
      ) : (
        <span key="arrivable" className="fade-in">도착했어요!</span>
      )}
    </Button>
  );
}
