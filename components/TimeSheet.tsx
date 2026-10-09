"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  label: string;
  /** "HH:MM" (24시간) */
  value: string;
  onChange: (value: string) => void;
}

const ITEM = 44; // 한 칸 높이(px)
const VISIBLE = 5; // 보이는 칸 수
const pad = (n: number) => String(n).padStart(2, "0");

const AMPM = ["오전", "오후"];
const HOURS = Array.from({ length: 12 }, (_, i) => `${i + 1}시`);
const MINUTES = Array.from({ length: 60 }, (_, i) => `${pad(i)}분`);

/** "HH:MM" → [오전/오후(0|1), 시 인덱스(0~11 = 1~12시), 분] */
function split(value: string): [number, number, number] {
  const [h, m] = value.split(":").map(Number);
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return [h >= 12 ? 1 : 0, hour12 - 1, m];
}

function join(ampm: number, hourIdx: number, minute: number) {
  const hour12 = hourIdx + 1;
  const h = (hour12 % 12) + (ampm === 1 ? 12 : 0);
  return `${pad(h)}:${pad(minute)}`;
}

function display(ampm: number, hourIdx: number, minute: number) {
  return `${AMPM[ampm]} ${hourIdx + 1}:${pad(minute)}`;
}

/** 시각 카드. 누르면 화면 가운데 얼럿 창에서 오전/오후·시·분을 고른다. */
export default function TimeSheet({ label, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [a, h, m] = split(value);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-16 w-full flex-col justify-center rounded-input bg-muted px-4 py-3 text-left"
      >
        <span className="text-caption text-muted-foreground">{label}</span>
        <span className="text-body-lg font-medium tabular-nums">{display(a, h, m)}</span>
      </button>
      {open && (
        <Sheet
          label={label}
          value={value}
          onClose={() => setOpen(false)}
          onConfirm={(v) => {
            onChange(v);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

function Sheet({
  label,
  value,
  onClose,
  onConfirm,
}: {
  label: string;
  value: string;
  onClose: () => void;
  onConfirm: (value: string) => void;
}) {
  const [a0, h0, m0] = split(value);
  const [ampm, setAmpm] = useState(a0);
  const [hourIdx, setHourIdx] = useState(h0);
  const [minute, setMinute] = useState(m0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // 화면 가운데에 뜨는 얼럿 창. 부모 요소의 transform 영향을 받지 않도록 body에 그린다.
  return createPortal(
    <div
      className="fixed inset-0 z-[60] mx-auto flex w-[390px] max-w-full items-center justify-center px-6"
      role="presentation"
    >
      <div className="fade-backdrop absolute inset-0 bg-on-surface/40" onClick={onClose} />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={`${label} 선택`}
        className="alert-in relative w-full rounded-nav bg-surface p-5"
      >
        <h2 className="text-center text-subheading font-medium">{label}</h2>

        <div
          className="relative mt-3 grid grid-cols-[0.8fr_1fr_1fr] gap-1"
          style={{ height: ITEM * VISIBLE }}
        >
          {/* 선택 줄: 가운데 한 칸 */}
          <div
            className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-input bg-muted"
            style={{ height: ITEM }}
          />
          <Wheel label="오전 오후" items={AMPM} selected={ampm} onSelect={setAmpm} />
          <Wheel label="시" items={HOURS} selected={hourIdx} onSelect={setHourIdx} />
          <Wheel label="분" items={MINUTES} selected={minute} onSelect={setMinute} />
        </div>

        <div className="mt-4 grid grid-cols-[1fr_2fr] gap-2">
          <Button type="button" variant="secondary" size="lg" onClick={onClose}>
            취소
          </Button>
          <Button type="button" size="lg" onClick={() => onConfirm(join(ampm, hourIdx, minute))}>
            {display(ampm, hourIdx, minute)} 설정
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** 칸마다 가운데에서 떨어진 거리에 따라 기울기·크기·투명도를 줘서 휠처럼 보이게 한다. */
function paint(el: HTMLElement) {
  const top = el.scrollTop;
  for (const child of Array.from(el.children) as HTMLElement[]) {
    const i = Number(child.dataset.i);
    const d = (i * ITEM - top) / ITEM; // 가운데 칸 기준 거리(칸 수)
    const abs = Math.abs(d);
    child.style.opacity = String(Math.max(0.15, 1 - abs * 0.4));
    child.style.transform = `rotateX(${(-d * 18).toFixed(1)}deg) scale(${(1 - Math.min(abs, 3) * 0.06).toFixed(3)})`;
  }
}

function Wheel({
  label,
  items,
  selected,
  onSelect,
}: {
  label: string;
  items: string[];
  selected: number;
  onSelect: (i: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);

  // 열릴 때 선택된 칸이 가운데 오도록 첫 화면 그리기 전에 맞춘다.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = selected * ITEM;
    paint(el);
    return () => cancelAnimationFrame(frame.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      paint(el);
      const i = Math.min(items.length - 1, Math.max(0, Math.round(el.scrollTop / ITEM)));
      if (i !== selected) onSelect(i);
    });
  };

  const goTo = (i: number) =>
    ref.current?.scrollTo({ top: Math.min(items.length - 1, Math.max(0, i)) * ITEM, behavior: "smooth" });

  // 마우스로 끌어서 돌리기. 터치와 휠은 브라우저 스크롤이 처리한다.
  const drag = useRef<{ y: number; top: number; moved: boolean } | null>(null);
  const justDragged = useRef(false);
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse" || e.button !== 0) return;
    drag.current = { y: e.clientY, top: el.scrollTop, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    const d = drag.current;
    if (!el || !d) return;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.abs(dy) < 4) return;
    if (!d.moved) {
      d.moved = true;
      el.setPointerCapture(e.pointerId);
      el.style.scrollSnapType = "none"; // 끄는 동안은 스냅이 위치를 되돌리지 않게
    }
    el.scrollTop = d.top - dy;
  };
  const onPointerEnd = () => {
    const el = ref.current;
    const d = drag.current;
    drag.current = null;
    if (!el || !d?.moved) return;
    el.style.scrollSnapType = "";
    justDragged.current = true; // 곧 이어지는 click(칸 선택)은 무시한다
    setTimeout(() => (justDragged.current = false), 0);
    goTo(Math.round(el.scrollTop / ITEM));
  };

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onClickCapture={(e) => {
        if (justDragged.current) e.stopPropagation();
      }}
      role="listbox"
      aria-label={label}
      tabIndex={0}
      onScroll={onScroll}
      onKeyDown={(e) => {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          goTo(selected + 1);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          goTo(selected - 1);
        }
      }}
      className="relative z-10 snap-y snap-mandatory overflow-y-auto overscroll-contain outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{
        height: ITEM * VISIBLE,
        paddingBlock: (ITEM * (VISIBLE - 1)) / 2,
        perspective: 500,
      }}
    >
      {items.map((text, i) => {
        const on = i === selected;
        return (
          <button
            key={text}
            data-i={i}
            type="button"
            role="option"
            aria-selected={on}
            onClick={() => goTo(i)}
            className={`flex w-full snap-center items-center justify-center tabular-nums [scroll-snap-stop:always] ${
              on ? "text-subheading font-medium text-on-surface" : "text-subheading text-muted-foreground"
            }`}
            style={{ height: ITEM }}
          >
            {text}
          </button>
        );
      })}
    </div>
  );
}
