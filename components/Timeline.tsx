import { fmt } from "@/lib/time";
import type { Plan, RideLeg } from "@/lib/types";

interface Step {
  time: number;
  title: string;
  detail?: string;
  note?: string;
  color?: string;
  strong?: boolean;
}

function toSteps(plan: Plan): Step[] {
  const steps: Step[] = [];
  const { legs } = plan;
  legs.forEach((leg, i) => {
    if (leg.type === "walk" && (leg.kind === "home" || leg.kind === "direct")) {
      steps.push({
        time: leg.start,
        title: `${leg.from}에서 출발`,
        detail:
          leg.kind === "direct"
            ? `${leg.to}까지 걸어서 ${leg.end - leg.start}분`
            : `${leg.to}역까지 도보 ${leg.end - leg.start}분`,
        strong: true,
      });
    } else if (leg.type === "ride") {
      const r: RideLeg = leg;
      steps.push({
        time: r.start,
        title: `${r.from}역 승차`,
        detail: `${r.lineName} · ${r.direction}`,
        note: `${r.stations.length - 1}개 역 · ${r.end - r.start}분 이동 · 승강장 대기 ${r.waitMin}분${r.scheduled ? "" : " · 예상 시각"}`,
        color: r.color,
      });
      const next = legs[i + 1];
      if (next?.type === "walk" && next.kind === "transfer") {
        steps.push({
          time: r.end,
          title: `${r.to}역 환승`,
          detail: `${next.end - next.start}분 이동`,
        });
      } else if (next?.type === "walk" && next.kind === "dest") {
        steps.push({
          time: r.end,
          title: `${r.to}역 하차`,
          detail: `약속 장소까지 도보 ${next.end - next.start}분`,
        });
      }
    }
  });
  steps.push({
    time: plan.arriveAt,
    title: "약속 장소 도착",
    detail: `${fmt(plan.arriveBy)} 약속 · ${plan.arriveBy - plan.arriveAt}분 여유`,
    strong: true,
  });
  return steps;
}

export default function Timeline({ plan }: { plan: Plan }) {
  const steps = toSteps(plan);
  return (
    <ol className="relative">
      {steps.map((s, i) => (
        <li key={i} className="relative flex gap-4 pb-6 last:pb-0">
          <time className="w-11 shrink-0 pt-px text-[13px] tabular-nums text-sub">
            {fmt(s.time)}
          </time>
          <div className="relative flex flex-col items-center">
            <span
              className="z-10 mt-1.5 size-2.5 shrink-0 rounded-full border-2 bg-white"
              style={{
                borderColor: s.color ?? (s.strong ? "var(--color-accent)" : "#cfcfcf"),
                backgroundColor: s.strong ? "var(--color-accent)" : "#fff",
              }}
            />
            {i < steps.length - 1 && (
              <span
                className="absolute top-4 h-[calc(100%+0.75rem)] w-px"
                style={{ backgroundColor: steps[i].color ?? "var(--color-line)" }}
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-[15px] ${s.strong ? "font-semibold" : "font-medium"}`}>
              {s.title}
            </p>
            {s.detail && <p className="mt-0.5 text-[13px] text-ink/70">{s.detail}</p>}
            {s.note && <p className="mt-0.5 text-xs text-sub">{s.note}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
