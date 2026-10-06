"use client";

import { useEffect, useRef, useState } from "react";
import Header from "./Header";
import LocationPicker from "./LocationPicker";
import TimeSheet from "./TimeSheet";
import Timeline from "./Timeline";
import { requestPlans } from "@/lib/api";
import { dateString } from "@/lib/dates";
import { requestLeave, setLeaveGuard } from "@/lib/leaveGuard";
import { clearPendingResult, peekPendingResult } from "@/lib/pending";
import type { Place } from "@/lib/places";
import {
  addTrip,
  recordArrival,
  saveLastDestination,
  saveLastOrigin,
  useLastDestination,
  useLastOrigin,
  useTrips,
} from "@/lib/storage";
import type { Plan } from "@/lib/types";
import { fmt, parseTime } from "@/lib/time";

interface Form {
  origin: Place | null;
  destination: Place | null;
  time: string;
  /** 기본은 오늘, 내일 약속이면 토글을 켠다 */
  tomorrow: boolean;
}

/** 약속 시각보다 이만큼 일찍 도착하도록 계산한다. (유저 설정 없음) */
const ARRIVE_EARLY_MIN = 5;

const DEFAULTS: Form = { origin: null, destination: null, time: "14:00", tomorrow: false };

export default function Planner() {
  const trips = useTrips();
  const savedOrigin = useLastOrigin();
  const savedDestination = useLastDestination();

  const [edit, setEdit] = useState<Partial<Form>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // 경로 내역에서 다시 안내받아 넘어온 경우 그 결과를 바로 보여준다.
  const [activeId, setActiveId] = useState<string | null>(() => peekPendingResult()?.tripId ?? null);
  // 계산된 안들(추천 + 대안)과 지금 보고 있는 안
  const [plans, setPlans] = useState<Plan[]>(() => peekPendingResult()?.plans ?? []);
  const [page, setPage] = useState(0);
  const slider = useRef<HTMLDivElement>(null);
  // "제시간에 도착했어요" 기록 후 홈으로 돌아가는 타이머
  const homeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (homeTimer.current) clearTimeout(homeTimer.current);
  }, []);
  const [editing, setEditing] = useState(false);
  // 장소 고르는 화면. 출발지를 한 번도 고른 적이 없으면 처음 열 때 위치 허용을 요청한다.
  const [picker, setPicker] = useState<"origin" | "destination" | null>(null);
  const [firstOriginDismissed, setFirstOriginDismissed] = useState(false);
  const firstOrigin = savedOrigin === null && !firstOriginDismissed && picker === null;
  const showOriginPicker = picker === "origin" || firstOrigin;

  // 입력 초기값: 아무것도 고르지 않았으면 "장소 선택", 고른 기록이 있으면 그대로 유지한다.
  const form: Form = {
    ...DEFAULTS,
    ...(savedOrigin ? { origin: savedOrigin } : {}),
    ...(savedDestination ? { destination: savedDestination } : {}),
    ...edit,
  };
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setEdit((e) => ({ ...e, [k]: v }));

  // 버튼을 눌러 계산한 결과만 보여준다. 다른 탭에 다녀오면 입력 화면부터 시작한다.
  const current = editing || !activeId ? undefined : trips.find((t) => t.id === activeId);

  // 출발 안내 화면이 떠 있는 동안에는 나갈 때 확인 창을 띄운다.
  const showingResult = Boolean(current);
  useEffect(() => {
    clearPendingResult();
    setLeaveGuard(showingResult);
    return () => setLeaveGuard(false);
  }, [showingResult]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const origin = form.origin;
    if (!origin) {
      setPicker("origin");
      return;
    }
    if (!form.destination) {
      setError("도착지를 선택해 주세요.");
      return;
    }
    const now = new Date();
    const arriveBy = parseTime(form.time);
    if (!form.tomorrow && arriveBy <= now.getHours() * 60 + now.getMinutes()) {
      setError("이미 지난 약속 시각이에요. '내일 약속' 토글을 켜 보세요.");
      return;
    }
    const date = dateString(form.tomorrow ? 1 : 0);

    setError(null);
    setLoading(true);
    try {
      const { lat, lng, name, area } = form.destination;
      const result = await requestPlans({
        origin: { name: origin.name, area: origin.area, lat: origin.lat, lng: origin.lng },
        destination: { name, area, lat, lng },
        arriveBy,
        buffer: ARRIVE_EARLY_MIN,
        date,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setPlans(result.plans);
      setPage(0);
      // 추천 안을 우선 저장하고, 다른 안으로 도착 기록을 남기면 그 안으로 바꾼다.
      setActiveId(addTrip(result.plan).id);
      setEditing(false);
    } catch {
      setError("경로를 계산하지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  if (current) {
    const done = current.status !== "planned";
    // 기록을 남긴 뒤에는 따라간 안 하나만 보여준다.
    const shown = done || plans.length === 0 ? [current.plan] : plans;
    const active = shown[Math.min(page, shown.length - 1)];
    const multi = shown.length > 1;

    const onScroll = () => {
      const el = slider.current;
      if (el) setPage(Math.round(el.scrollLeft / el.clientWidth));
    };
    const goTo = (i: number) =>
      slider.current?.scrollTo({ left: i * slider.current.clientWidth, behavior: "smooth" });
    const arrive = (plan: Plan, onTime: boolean) => {
      recordArrival(current.id, onTime, plan === current.plan ? undefined : plan);
      if (!onTime) return;
      // 기록 확인 문구를 잠깐 보여 준 뒤 홈(입력 화면)으로 돌아간다.
      homeTimer.current = setTimeout(() => {
        setEditing(true);
        setActiveId(null);
        setPlans([]);
      }, 2000);
    };

    return (
      <main className="fade-in">
        <nav className="flex items-center gap-1 px-2 pt-10">
          <button
            type="button"
            aria-label="뒤로가기 (입력 화면으로)"
            onClick={() =>
              requestLeave(() => {
                setEditing(true);
                setActiveId(null);
                setPlans([]);
              })
            }
            className="flex size-11 items-center justify-center rounded-full text-ink active:bg-soft"
          >
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 5-7 7 7 7" />
            </svg>
          </button>
          <h1 className="text-[17px] font-semibold tracking-tight">출발 안내</h1>
        </nav>
        <div className="h-4" />

        {multi && (
          <div className="flex items-center justify-between px-5 pb-3">
            <p className="text-sm font-medium">
              {page === 0 ? "추천 경로" : `${page + 1}안`}
              {page > 0 && (
                <span className="ml-2 text-xs font-normal text-sub">
                  추천보다 {plans[0].leaveAt - active.leaveAt}분 일찍 나가야 해요
                </span>
              )}
            </p>
            <div className="flex" role="tablist" aria-label="경로 안 선택">
              {shown.map((_, i) => (
                <button
                  key={i}
                  role="tab"
                  aria-selected={i === page}
                  aria-label={i === 0 ? "추천 경로" : `${i + 1}안`}
                  onClick={() => goTo(i)}
                  className="flex size-6 items-center justify-center"
                >
                  <span
                    className={`block rounded-full transition-all ${
                      i === page ? "h-2 w-5 bg-ink" : "size-2 bg-line"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        <div
          ref={slider}
          onScroll={onScroll}
          className="flex snap-x snap-mandatory items-start overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {shown.map((plan, i) => (
            <article key={i} className="w-full shrink-0 snap-center">
              <PlanView plan={plan} />
              {/* 출처 문구 아래 30px에 붙여 둔다. 안마다 높이가 달라도 간격이 유지된다. */}
              <section className="px-5 pb-6 pt-[30px]">
                {done ? (
                  <div className="rounded-xl bg-soft px-4 py-4 text-center text-sm">
                    {current.status === "ontime"
                      ? "제시간에 도착했어요. 기록했어요 ✓ 잠시 후 홈으로 이동해요"
                      : "늦은 도착으로 기록했어요"}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => arrive(plan, true)}
                      className="h-14 w-full rounded-xl bg-ink text-[16px] font-medium text-white active:opacity-80"
                    >
                      제시간에 도착했어요
                    </button>
                    <button onClick={() => arrive(plan, false)} className="h-11 w-full text-sm text-sub">
                      늦었어요
                    </button>
                  </div>
                )}
              </section>
            </article>
          ))}
        </div>

      </main>
    );
  }

  return (
    <main className="fade-in">
      <Header title="J의 외출" sub="어디로, 몇 시까지 갈지만 알려주세요." />

      {showOriginPicker && (
        <LocationPicker
          title="출발지 선택"
          description="출발할 곳을 현재 위치나 주소로 찾아 보세요."
          autoLocate={firstOrigin}
          near={form.destination ?? undefined}
          locateLabel="현재 위치로 선택"
          confirmQuestion="여기를 출발지로 선택할까요?"
          confirmLabel="네, 여기서 출발할게요"
          onSelect={(p) => {
            const place = { name: p.name, area: p.address, lat: p.lat, lng: p.lng };
            set("origin", place);
            saveLastOrigin(place);
            setPicker(null);
          }}
          onClose={picker === "origin" ? () => setPicker(null) : () => setFirstOriginDismissed(true)}
        />
      )}

      {picker === "destination" && (
        <LocationPicker
          title="도착지 선택"
          near={form.origin ?? undefined}
          description="약속 장소를 현재 위치나 주소로 찾아 보세요."
          locateLabel="현재 위치로 선택"
          confirmQuestion="여기를 도착지로 선택할까요?"
          confirmLabel="네, 여기로 갈게요"
          onSelect={(p) => {
            const place = { name: p.name, area: p.address, lat: p.lat, lng: p.lng };
            set("destination", place);
            saveLastDestination(place);
            setPicker(null);
          }}
          onClose={() => setPicker(null)}
        />
      )}

      <form onSubmit={submit} className="space-y-3 px-5 pb-8">
        <button
          type="button"
          onClick={() => setPicker("origin")}
          className="flex min-h-16 w-full flex-col justify-center rounded-xl bg-soft px-4 py-2.5 text-left"
        >
          <span className="text-[11px] text-sub">출발지</span>
          <span className="text-[16px] font-medium">{form.origin?.name || "장소 선택"}</span>
          {form.origin?.area && (
            <span className="mt-0.5 truncate text-xs text-sub">{form.origin.area}</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setPicker("destination")}
          className="flex min-h-16 w-full flex-col justify-center rounded-xl bg-soft px-4 py-2.5 text-left"
        >
          <span className="text-[11px] text-sub">도착지</span>
          <span className="text-[16px] font-medium">{form.destination?.name || "장소 선택"}</span>
          {form.destination?.area && (
            <span className="mt-0.5 truncate text-xs text-sub">{form.destination.area}</span>
          )}
        </button>

        <TimeSheet label="약속 시각" value={form.time} onChange={(v) => set("time", v)} />

        <div className="flex h-12 items-center justify-between px-1">
          <span id="tomorrow-label" className="text-sm text-ink/80">
            내일 약속이에요
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={form.tomorrow}
            aria-labelledby="tomorrow-label"
            onClick={() => set("tomorrow", !form.tomorrow)}
            className={`relative h-7 w-12 rounded-full transition-colors ${
              form.tomorrow ? "bg-ink" : "bg-line"
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 size-6 rounded-full bg-white shadow transition-transform ${
                form.tomorrow ? "translate-x-5" : ""
              }`}
            />
          </button>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-500">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-3 h-14 w-full rounded-xl bg-ink text-[16px] font-medium text-white active:opacity-80 disabled:opacity-60"
        >
          {loading ? "실제 시간표 확인 중…" : "나갈 시각 알아보기"}
        </button>
      </form>
    </main>
  );
}

const DAY = { weekday: "평일", saturday: "토요일", sunday: "일요일" } as const;

function PlanView({ plan }: { plan: Plan }) {
  const walkOnly = plan.originStation === "";
  return (
    <>
      <section className="px-5 pb-8">
        <p className="text-sm text-sub">
          {fmt(plan.arriveBy)} 약속 · 총 {plan.arriveAt - plan.leaveAt}분 걸려요
        </p>
        <p className="mt-1 text-[44px] font-semibold leading-none tracking-tight">
          <span className="text-accent">{fmt(plan.leaveAt)}</span>
          <span className="ml-2 text-lg font-medium text-ink">에 출발하세요</span>
        </p>
        <p className="mt-3 text-sm text-ink/70">
          {walkOnly
            ? "걸어서 이동"
            : plan.transfers === 0
              ? "환승 없이"
              : `환승 ${plan.transfers}번`}{" "}
          · 약속 {plan.arriveBy - plan.arriveAt}분 전 도착
        </p>
        {walkOnly && <p className="mt-1 text-xs text-sub">지하철 없이 걸어서 가는 방법이에요</p>}
      </section>

      <div className="mx-5 border-t border-line" />

      <section className="px-5 pt-7">
        <Timeline plan={plan} />
        <SourceNote plan={plan} />
      </section>
    </>
  );
}

/** 경로 아래에 작게 적는 출처·기준 안내 */
function SourceNote({ plan }: { plan: Plan }) {
  const notes: string[] = [];
  if (plan.originStation !== "") {
    const day = DAY[plan.dayType ?? "weekday"];
    notes.push(`${day} 열차 시간표 기준 · 출처 서울교통공사`);
    if (plan.scheduleEstimated) notes.push("시간표가 없는 노선은 배차 간격으로 예상한 시각이에요");
  }
  if (plan.walkEstimated) notes.push("일부 도보 시간은 직선거리로 추정했어요");
  if (notes.length === 0) return null;
  return (
    <div className="mt-6 space-y-0.5 text-[11px] leading-relaxed text-sub">
      {notes.map((n) => (
        <p key={n}>{n}</p>
      ))}
    </div>
  );
}
