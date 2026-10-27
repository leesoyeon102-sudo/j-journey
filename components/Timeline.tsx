import { BusFrontIcon, CircleAlertIcon, TrainFrontIcon } from "lucide-react";
import KakaoMapLink from "@/components/KakaoMapLink";
import { meters } from "@/lib/geo";
import { fmt } from "@/lib/time";
import type { BusLeg, Leg, Plan, RideLeg, WalkLeg } from "@/lib/types";

/** 이만큼(m)보다 가까우면 걷는다고 보기 어려워 카카오맵 버튼을 붙이지 않는다. */
const MIN_WALK_LINK_M = 50;

/** 버스 정류장 이름: 정류소 번호를 알면 괄호로 붙인다. 예) 서대문우체국(02345) 정류장 */
const busStop = (name: string, ars?: string) => `${name}${ars ? `(${ars})` : ""} 정류장`;

interface Step {
  time: number;
  title: string;
  detail?: string;
  note?: string;
  color?: string;
  /** 탑승 줄이면 점 안에 수단 아이콘(지하철·버스)을 넣어 구분한다. */
  mode?: "ride" | "bus";
  strong?: boolean;
  /** 배차 간격·예상 시각처럼 "정확하지 않을 수 있는" 안내면 note 앞에 느낌표 아이콘을 붙인다. */
  alert?: boolean;
  /** 걷는 구간이면 카카오맵 도보 길찾기를 이 줄에 붙인다. */
  walk?: { from: { name: string; lat: number; lng: number }; to: { name: string; lat: number; lng: number } };
}

function toSteps(plan: Plan): Step[] {
  const steps: Step[] = [];
  const { legs } = plan;
  /** 걸어서 닿는 곳의 이름: 다음 수단이 버스면 정류장, 지하철이면 역 */
  const placeAfter = (name: string, nextHop: (typeof legs)[number] | undefined) =>
    nextHop?.type === "bus" ? busStop(name, nextHop.fromArs) : nextHop?.type === "ride" ? `${name}역` : name;
  /** 걷는 구간의 카카오맵 길찾기 정보. 좌표가 없거나 거의 제자리면 붙이지 않는다. */
  const walkLink = (w: WalkLeg, before?: Leg, after?: Leg): Step["walk"] => {
    // 지하철끼리 갈아타는 이동은 역 안에서 걷는 거라 카카오맵 도보 길찾기를 붙이지 않는다. (밖에서 걷는 구간만)
    if (w.kind === "transfer" && before?.type === "ride" && after?.type === "ride") return undefined;
    if (!w.fromCoord || !w.toCoord) return undefined;
    // 버스가 낀 구간은 정류장이 길 건너편이거나 다른 곳일 수 있어 거리와 상관없이 붙인다.
    const withBus = before?.type === "bus" || after?.type === "bus";
    if (!withBus && meters(w.fromCoord, w.toCoord) < MIN_WALK_LINK_M) return undefined;
    const label = (name: string, hop: Leg | undefined, side: "from" | "to") =>
      hop?.type === "bus"
        ? busStop(name, side === "to" ? hop.toArs : hop.fromArs)
        : hop?.type === "ride"
          ? `${name}역`
          : name;
    return {
      from: { name: label(w.from, before, "to"), ...w.fromCoord },
      to: { name: label(w.to, after, "from"), ...w.toCoord },
    };
  };

  legs.forEach((leg, i) => {
    if (leg.type === "walk" && (leg.kind === "home" || leg.kind === "direct")) {
      steps.push({
        time: leg.start,
        title: `${leg.from}에서 출발`,
        detail:
          leg.kind === "direct"
            ? `${leg.to}까지 걸어서 ${leg.end - leg.start}분`
            : `${placeAfter(leg.to, legs[i + 1])}까지 도보 ${leg.end - leg.start}분`,
        strong: true,
        walk: walkLink(leg, undefined, leg.kind === "direct" ? undefined : legs[i + 1]),
      });
    } else if (leg.type === "ride") {
      const r: RideLeg = leg;
      steps.push({
        time: r.start,
        title: `${r.from}역 승차`,
        detail: `${r.lineName} · ${r.direction}`,
        note: `${r.stations.length - 1}개 역 · ${r.end - r.start}분 이동 · 승강장 대기 ${r.waitMin}분${r.scheduled ? "" : " · 예상 시각"}`,
        color: r.color,
        mode: "ride",
        alert: !r.scheduled,
      });
      const next = legs[i + 1];
      if (next?.type === "walk" && next.kind === "transfer") {
        const after = legs[i + 2];
        steps.push({
          time: r.end,
          title: after?.type === "bus" ? `${r.to}역 하차` : `${r.to}역 환승`,
          detail:
            after?.type === "bus"
              ? `${busStop(after.from, after.fromArs)}까지 도보 ${next.end - next.start}분`
              : `${next.end - next.start}분 이동`,
          walk: walkLink(next, r, after),
        });
      } else if (next?.type === "walk" && next.kind === "dest") {
        steps.push({
          time: r.end,
          title: `${r.to}역 하차`,
          detail: `약속 장소까지 도보 ${next.end - next.start}분`,
          walk: walkLink(next, r, undefined),
        });
      }
    } else if (leg.type === "bus") {
      const b: BusLeg = leg;
      steps.push({
        time: b.arriveStop,
        title: `${busStop(b.from, b.fromArs)} 도착`,
        detail: `${b.routeName}번 버스를 기다려요`,
      });
      steps.push({
        time: b.start,
        title: `${b.routeName}번 버스 탑승`,
        detail: `${b.kind} · ${b.stopCount}개 정류장 · ${b.end - b.start}분 이동`,
        note: b.realtime
          ? "현재 도착 정보를 바탕으로 예상한 시각"
          : `배차 간격 ${b.headway}분 · 평균 대기 시간으로 계산한 예상 시각 (최대 ${b.headway}분 더 기다릴 수 있어요)`,
        color: b.color,
        mode: "bus",
        alert: true,
      });
      const next = legs[i + 1];
      const after = legs[i + 2];
      const sameStop = after?.type === "bus" && b.to === after.from && b.toArs === after.fromArs;
      if (next?.type === "walk" && next.kind === "transfer") {
        steps.push({
          time: b.end,
          title: `${busStop(b.to, b.toArs)} 하차`,
          detail: sameStop
            ? "같은 정류장에서 갈아타요"
            : after?.type === "ride"
              ? `${after.from}역까지 도보 ${next.end - next.start}분`
              : after?.type === "bus"
                ? `${busStop(after.from, after.fromArs)}까지 도보 ${next.end - next.start}분`
                : `도보 ${next.end - next.start}분`,
          // 같은 정류장에서 갈아타면 걷지 않으니 카카오맵 버튼도 붙이지 않는다.
          walk: sameStop ? undefined : walkLink(next, b, after),
        });
      } else if (next?.type === "walk" && next.kind === "dest") {
        steps.push({
          time: b.end,
          title: `${busStop(b.to, b.toArs)} 하차`,
          detail: `약속 장소까지 도보 ${next.end - next.start}분`,
          walk: walkLink(next, b, undefined),
        });
      }
    }
  });
  steps.push({
    time: plan.arriveAt,
    title: "약속 장소 도착",
    detail: `${fmt(plan.arriveBy)} 약속 · ${plan.arriveBy >= plan.arriveAt ? `${plan.arriveBy - plan.arriveAt}분 여유` : `${plan.arriveAt - plan.arriveBy}분 늦음`}`,
    strong: true,
  });
  return steps;
}

export default function Timeline({ plan }: { plan: Plan }) {
  const steps = toSteps(plan);
  return (
    <ol className="relative">
      {steps.map((s, i) => (
        <li
          key={i}
          // 줄이 위에서부터 --motion-stagger 간격으로 차례로 나타난다.
          className="fade-in relative flex gap-3 pb-6 last:pb-0"
          style={{ animationDelay: `calc(var(--motion-stagger) * ${i})` }}
        >
          <div className="w-14 shrink-0">
            {s.color ? (
              // 탑승 시각: 노선 색 글자 + 같은 색 10% 배경의 태그
              <time
                className="inline-block rounded-chip px-2 py-1 text-body font-medium tabular-nums"
                style={{ color: s.color, backgroundColor: `${s.color}1A` }}
              >
                {fmt(s.time)}
              </time>
            ) : (
              <time className="inline-block py-1 text-body tabular-nums text-muted-foreground">
                {fmt(s.time)}
              </time>
            )}
          </div>
          <div className="relative flex w-5 shrink-0 flex-col items-center">
            {s.mode ? (
              // 탑승 줄: 노선 색 테두리는 그대로 두고, 안에 지하철·버스 아이콘을 넣어 수단을 구분한다.
              <span
                className="z-10 mt-1 flex size-5 shrink-0 items-center justify-center rounded-pill border-[1.5px] bg-surface"
                style={{ borderColor: s.color, color: s.color }}
              >
                {s.mode === "ride" ? (
                  <TrainFrontIcon className="size-3" strokeWidth={2} aria-label="지하철" />
                ) : (
                  <BusFrontIcon className="size-3" strokeWidth={2} aria-label="버스" />
                )}
              </span>
            ) : (
              <span
                className={`z-10 mt-2 size-3 shrink-0 rounded-pill border-2 ${
                  s.strong ? "border-primary bg-primary" : "border-muted-foreground bg-surface"
                }`}
                style={s.color ? { borderColor: s.color } : undefined}
              />
            )}
            {i < steps.length - 1 && (
              <span
                className={`absolute ${steps[i].mode ? "top-6 h-[calc(100%+0.25rem)]" : "top-4 h-[calc(100%+0.75rem)]"} ${
                  steps[i].color ? "w-px" : "w-0 border-l border-dashed border-inactive" // 대중교통이 아닌 구간은 점선
                }`}
                style={steps[i].color ? { backgroundColor: steps[i].color } : undefined}
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            {/* G마켓 산스에는 세미볼드가 없어 Medium에 얇은 외곽선을 더해 표현한다. (TabBar와 같은 방식) */}
            <p className="text-body-md font-medium [-webkit-text-stroke:0.3px]">{s.title}</p>
            {s.walk ? (
              // 걷는 구간: 설명 바로 옆에 작은 카카오맵 버튼을 붙인다.
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                {s.detail && <p className="text-caption-lg text-muted-foreground">{s.detail}</p>}
                <KakaoMapLink from={s.walk.from} to={s.walk.to} />
              </div>
            ) : (
              s.detail && <p className="mt-1 text-caption-lg text-muted-foreground">{s.detail}</p>
            )}
            {s.note && (
              <p className={`mt-1 text-caption text-muted-foreground ${s.alert ? "flex items-start gap-1" : ""}`}>
                {s.alert && <CircleAlertIcon className="mt-0 size-3.5 shrink-0" strokeWidth={1.5} aria-hidden />}
                {s.alert ? <span>{s.note}</span> : s.note}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
