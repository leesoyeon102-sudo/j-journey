"use client";

export type PlanTab = "recommended" | "subway" | "bus";

const TABS: { id: PlanTab; label: string }[] = [
  { id: "recommended", label: "추천" },
  { id: "subway", label: "지하철 우선" },
  { id: "bus", label: "버스 우선" },
];

interface Props {
  value: PlanTab;
  onChange: (tab: PlanTab) => void;
  /** 해당 종류의 경로가 없으면 칩을 비활성으로 둔다. */
  unavailable?: Partial<Record<PlanTab, boolean>>;
  /** 지금 칩에서 넘겨 볼 수 있는 안의 개수와 보고 있는 안. 안이 둘 이상일 때만 오른쪽에 인디게이터가 뜬다. */
  count: number;
  page: number;
}

/** 출발 안내 맨 위의 칩 필터: 추천(하나) / 지하철 우선 / 버스 우선(각각 여러 안). 오른쪽 끝에는 안을 넘기는 인디게이터. */
export default function PlanFilter({ value, onChange, unavailable = {}, count, page }: Props) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 pb-4">
      <div className="flex gap-2" role="tablist" aria-label="경로 종류">
        {TABS.map((t) => {
          const on = t.id === value;
          const off = Boolean(unavailable[t.id]);
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={on}
              disabled={off}
              onClick={() => onChange(t.id)}
              className={`h-9 shrink-0 whitespace-nowrap rounded-pill px-4 text-label font-semibold transition-colors disabled:pointer-events-none disabled:opacity-40 ${
                on ? "bg-primary text-on-primary" : "glass text-on-surface hover:bg-glass-strong"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      {value !== "recommended" && count > 1 && (
        <div className="flex shrink-0 items-center gap-1" role="presentation" aria-label={`${count}개 중 ${page + 1}번째 안`}>
          {Array.from({ length: count }, (_, i) => (
            <span
              key={i}
              className={`block rounded-pill transition-all ${i === page ? "h-2 w-5 bg-primary" : "size-2 bg-border"}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
