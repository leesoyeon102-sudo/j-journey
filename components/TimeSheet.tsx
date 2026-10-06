"use client";

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
        className="flex h-14 w-full flex-col justify-center rounded-xl bg-soft px-4 text-left"
      >
        <span className="text-[11px] text-sub">{label}</span>
        <span className="text-[16px] font-medium tabular-nums">{display(a, h, m)}</span>
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
      <div className="fade-backdrop absolute inset-0 bg-black/30" onClick={onClose} />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={`${label} 선택`}
        className="alert-in relative w-full rounded-2xl bg-white p-5 shadow-xl"
      >
        <h2 className="text-center text-[17px] font-semibold">{label}</h2>

        <div
          className="relative mt-3 grid grid-cols-[0.8fr_1fr_1fr] gap-1"
          style={{ height: ITEM * VISIBLE }}
        >
          {/* 선택 줄: 가운데 한 칸 */}
          <div
            className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-xl bg-soft"
            style={{ height: ITEM }}
          />
          <Wheel label="오전 오후" items={AMPM} selected={ampm} onSelect={setAmpm} />
          <Wheel label="시" items={HOURS} selected={hourIdx} onSelect={setHourIdx} />
          <Wheel label="분" items={MINUTES} selected={minute} onSelect={setMinute} />
          {/* 위·아래로 갈수록 흐려지는 막 */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-16 bg-gradient-to-b from-white to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-16 bg-gradient-to-t from-white to-transparent" />
        </div>

        <div className="mt-4 grid grid-cols-[1fr_2fr] gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-12 rounded-xl bg-soft text-[15px] text-ink/80 active:opacity-80"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => onConfirm(join(ampm, hourIdx, minute))}
            className="h-12 rounded-xl bg-ink text-[15px] font-medium text-white active:opacity-80"
          >
            {display(ampm, hourIdx, minute)} 설정
          </button>
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

  return (
    <div
      ref={ref}
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
              on ? "text-[20px] font-semibold text-ink" : "text-[18px] text-sub"
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
