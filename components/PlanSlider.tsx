"use client";

import { useEffect, useRef } from "react";

interface Props {
  /** 지금 보여줄 칸(0부터) */
  page: number;
  onPageChange: (page: number) => void;
  /** 값이 바뀌면(칩을 바꾸는 등) 애니메이션 없이 첫 칸으로 되돌린다. */
  resetKey: string;
  /** 칸마다 하나씩 */
  children: React.ReactNode[];
}

/** 이만큼(px) 움직여야 가로로 끄는 것으로 본다. 세로로 더 움직였으면 페이지 스크롤에 맡긴다. */
const LOCK_PX = 8;
/** 칸 너비의 이 비율 이상 끌거나, 이 속도(px/ms) 이상으로 튕기면 다음 칸으로 넘어간다. */
const SWIPE_RATIO = 0.2;
const SWIPE_SPEED = 0.4;
const EASE = "transform 300ms cubic-bezier(0.22, 1, 0.36, 1)";

/**
 * 좌우로 넘기는 슬라이더. 브라우저의 스크롤·스냅 기능을 쓰지 않고 손가락·마우스 움직임을 직접 처리한다.
 * (스크롤 스냅은 넘기는 중에 높이가 바뀌면 사파리에서 스냅이 끊기고 반응이 없어졌다.)
 * 세로 스크롤은 `touch-action: pan-y`로 브라우저에 맡기고, 높이는 보이는 칸에 맞춰 부드럽게 바꾼다.
 */
export default function PlanSlider({ page, onPageChange, resetKey, children }: Props) {
  const view = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLDivElement | null)[]>([]);
  const gesture = useRef<{ id: number; x: number; y: number; t: number; dx: number; mode: "h" | "v" | null } | null>(null);
  const justDragged = useRef(false);
  const count = children.length;

  const place = (i: number, animate: boolean) => {
    const el = track.current;
    if (!el) return;
    el.style.transition = animate ? EASE : "none";
    el.style.transform = `translate3d(${-i * 100}%, 0, 0)`;
  };

  // 칩을 바꾸는 등 처음부터 다시 보여줄 때는 애니메이션 없이 첫 칸으로
  useEffect(() => place(0, false), [resetKey]);
  // 칸이 바뀌면 그 칸으로 미끄러진다.
  useEffect(() => place(page, true), [page]);

  // 보이는 칸의 높이에 슬라이더 높이를 맞춘다. (다른 칸이 더 길어도 아래에 빈 화면이 생기지 않게)
  useEffect(() => {
    const v = view.current;
    const it = items.current[page];
    if (!v || !it) return;
    const update = () => {
      v.style.height = `${it.offsetHeight}px`;
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(it);
    return () => ro.disconnect();
  }, [page, count, resetKey]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    gesture.current = { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp, dx: 0, mode: null };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (g.mode === null) {
      if (Math.abs(dx) < LOCK_PX && Math.abs(dy) < LOCK_PX) return;
      g.mode = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
      if (g.mode === "h") {
        view.current?.setPointerCapture(e.pointerId);
        if (view.current) view.current.style.userSelect = "none";
      }
    }
    if (g.mode !== "h") return;
    g.dx = dx;
    // 처음·끝 칸에서 바깥으로 끌면 저항을 준다.
    const off = (page === 0 && dx > 0) || (page === count - 1 && dx < 0) ? dx * 0.3 : dx;
    if (track.current) {
      track.current.style.transition = "none";
      track.current.style.transform = `translate3d(calc(${-page * 100}% + ${off}px), 0, 0)`;
    }
  };
  const onPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    gesture.current = null;
    if (view.current) view.current.style.userSelect = "";
    if (g.mode !== "h") return;
    justDragged.current = true; // 곧 이어지는 click은 무시한다
    setTimeout(() => (justDragged.current = false), 0);
    const w = view.current?.clientWidth ?? 1;
    const speed = g.dx / Math.max(1, e.timeStamp - g.t);
    let next = page;
    if (e.type !== "pointercancel" && (Math.abs(g.dx) > w * SWIPE_RATIO || Math.abs(speed) > SWIPE_SPEED)) {
      next = Math.max(0, Math.min(count - 1, page + (g.dx < 0 ? 1 : -1)));
    }
    if (next !== page) onPageChange(next);
    else place(page, true);
  };

  return (
    <div
      ref={view}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onClickCapture={(e) => {
        // 끌고 난 직후에는 버튼·링크가 눌리지 않게 막는다.
        if (justDragged.current) e.stopPropagation();
      }}
      className="touch-pan-y overflow-hidden transition-[height] duration-200 ease-out"
    >
      <div ref={track} className="flex items-start will-change-transform">
        {children.map((child, i) => (
          <div
            key={i}
            ref={(el) => {
              items.current[i] = el;
            }}
            inert={i !== page}
            className="w-full shrink-0"
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}
