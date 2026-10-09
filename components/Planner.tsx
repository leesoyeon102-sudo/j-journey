"use client";

import { Button } from "@/components/ui/button";
import AlertPanel from "@/components/AlertPanel";
import { useEffect, useRef, useState } from "react";
import * as amplitude from "@amplitude/analytics-browser";
import Header from "./Header";
import LocationPicker from "./LocationPicker";
import TimeSheet from "./TimeSheet";
import Timeline from "./Timeline";
import { requestPlans } from "@/lib/api";
import { dateString } from "@/lib/dates";
import { useFeedbackBlock } from "@/lib/feedbackGate";
import { requestLeave, setLeaveGuard } from "@/lib/leaveGuard";
import { clearPendingResult, peekPendingResult } from "@/lib/pending";
import type { Place } from "@/lib/places";
import {
  addTrip,
  recordArrival,
  saveHome,
  saveLastDestination,
  saveLastOrigin,
  useHome,
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
  const home = useHome();
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
  // 마우스로 끌어서 넘길 때의 시작 좌표. 터치는 브라우저 스크롤 스냅이 알아서 처리한다.
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const justDragged = useRef(false);
  // 도착·늦음 버튼을 누른 뒤 띄우는 얼럿. 확인을 누르면 홈으로 돌아간다.
  const [arrivedAlert, setArrivedAlert] = useState(false);
  // 도착 이벤트를 이미 보낸 안내. 버튼을 빠르게 두 번 눌러도 한 번만 보낸다.
  const arrivalTracked = useRef<string | null>(null);
  const [editing, setEditing] = useState(false);
  // 장소 고르는 화면. 집 주소가 없으면 앱을 시작할 때 먼저 받는다. (등록 전에는 닫을 수 없음)
  const [picker, setPicker] = useState<"origin" | "destination" | "home" | null>(null);
  // 출발지·도착지 선택 화면에서 집 주소를 고치러 들어왔다면, 끝난 뒤 그 화면으로 돌려보낸다.
  // (처음 집 주소를 등록할 때는 비어 있어서 홈으로 간다.)
  const [returnTo, setReturnTo] = useState<"origin" | "destination" | null>(null);
  const needHome = home === null;
  const showHomePicker = needHome || picker === "home";
  const leaveHomePicker = () => {
    setPicker(returnTo);
    setReturnTo(null);
  };

  /** 출발지·도착지 선택 화면에서 "현재 위치" 버튼 위에 놓는 집 칩 */
  const homeChip = (from: "origin" | "destination", apply: (place: Place) => void) =>
    home
      ? {
          address: home.area,
          onPick: () => apply(home),
          onEdit: () => {
            setReturnTo(from);
            setPicker("home");
          },
        }
      : undefined;

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
  // 출발 안내가 떠 있는 동안에는 피드백 얼럿을 띄우지 않는다.
  useFeedbackBlock(Boolean(current));

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
    const onDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
      const el = slider.current;
      if (!el || e.pointerType !== "mouse" || e.button !== 0) return;
      drag.current = { x: e.clientX, left: el.scrollLeft, moved: false };
    };
    const onDragMove = (e: React.PointerEvent<HTMLDivElement>) => {
      const el = slider.current;
      const d = drag.current;
      if (!el || !d) return;
      const dx = e.clientX - d.x;
      if (!d.moved && Math.abs(dx) < 6) return;
      if (!d.moved) {
        d.moved = true;
        el.setPointerCapture(e.pointerId);
        el.style.scrollSnapType = "none"; // 끄는 동안은 스냅이 위치를 되돌리지 않게
        el.style.userSelect = "none";
      }
      el.scrollLeft = d.left - dx;
    };
    const onDragEnd = (e: React.PointerEvent<HTMLDivElement>) => {
      const el = slider.current;
      const d = drag.current;
      drag.current = null;
      if (!el || !d?.moved) return;
      el.style.scrollSnapType = "";
      el.style.userSelect = "";
      justDragged.current = true; // 곧 이어지는 click을 한 번 무시한다
      setTimeout(() => (justDragged.current = false), 0);
      const dx = e.clientX - d.x;
      const from = Math.round(d.left / el.clientWidth);
      const to = Math.abs(dx) > 50 ? from + (dx < 0 ? 1 : -1) : from;
      goTo(Math.max(0, Math.min(shown.length - 1, to)));
    };
    const arrive = (plan: Plan, onTime: boolean) => {
      // 같은 안내에는 한 번만 보낸다. (이미 기록했거나, 빠르게 두 번 눌러도)
      if (current.status === "planned" && arrivalTracked.current !== current.id) {
        arrivalTracked.current = current.id;
        amplitude.track("Arrival Recorded", { on_time: onTime });
      }
      recordArrival(current.id, onTime, plan === current.plan ? undefined : plan);
      setArrivedAlert(true);
    };
    const closeArrivedAlert = () => {
      setArrivedAlert(false);
      // 홈(입력 화면)으로 돌아간다.
      setEditing(true);
      setActiveId(null);
      setPlans([]);
    };

    return (
      <main className="fade-in">
        <nav className="flex items-center gap-1 px-2 pt-10">
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            aria-label="뒤로가기 (입력 화면으로)"
            onClick={() =>
              requestLeave(() => {
                setEditing(true);
                setActiveId(null);
                setPlans([]);
              })
            }
          >
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 5-7 7 7 7" />
            </svg>
          </Button>
          <h1 className="text-subheading font-medium">출발 안내</h1>
        </nav>
        <div className="h-4" />

        {multi && (
          <div className="flex items-center justify-between px-5 pb-3">
            <p className="text-body font-medium">
              {page === 0 ? "추천 경로" : `${page + 1}안`}
              {page > 0 && (
                <span className="ml-2 text-caption font-normal text-muted-foreground">
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
                    className={`block rounded-pill transition-all ${
                      i === page ? "h-2 w-5 bg-primary" : "size-2 bg-border"
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
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
          onClickCapture={(e) => {
            // 끌고 난 직후에는 버튼이 눌리지 않게 막는다.
            if (justDragged.current) e.stopPropagation();
          }}
          className="flex snap-x snap-mandatory items-start overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {shown.map((plan, i) => (
            <article key={i} className="w-full shrink-0 snap-center">
              <PlanView plan={plan} />
              {/* 출처 문구 아래 30px에 붙여 둔다. 안마다 높이가 달라도 간격이 유지된다. */}
              <section className="px-5 pb-6 pt-8">
                {!done && (
                  <div className="space-y-2">
                    <Button size="lg" onClick={() => arrive(plan, true)} className="w-full">
                      제시간에 도착했어요
                    </Button>
                    <Button variant="ghost" size="lg" onClick={() => arrive(plan, false)} className="w-full text-muted-foreground">
                      늦었어요
                    </Button>
                  </div>
                )}
              </section>
            </article>
          ))}
        </div>

        {arrivedAlert && (
          <AlertPanel
            title="로드맵 기록 완료"
            description="확인을 누르면 홈으로 돌아가요."
            onClose={closeArrivedAlert}
          >
            <Button size="lg" autoFocus onClick={closeArrivedAlert}>
              확인
            </Button>
          </AlertPanel>
        )}
      </main>
    );
  }

  return (
    <main className="fade-in">
      <Header title="J의 외출" sub="어디로, 몇 시까지 갈지만 알려주세요." />

      {showHomePicker && (
        <LocationPicker
          title="집 주소 등록"
          description={
            needHome ? (
              <>
                집 주소를 먼저 등록해 주세요.
                <br />
                출발지·도착지를 고를 때 &lsquo;집&rsquo;으로 바로 선택할 수 있어요.
              </>
            ) : (
              "새 집 주소를 현재 위치나 주소로 찾아 보세요."
            )
          }
          autoLocate={needHome}
          locateLabel="현재 위치로 등록"
          confirmQuestion="여기가 집이 맞나요?"
          confirmLabel="네, 집으로 등록할게요"
          onSelect={(p) => {
            // 처음 등록할 때만 센다. (집 주소 변경은 해당하지 않는다)
            if (needHome) amplitude.track("Home Address Registered", { method: p.source ?? "search" });
            saveHome({ name: "집", area: p.address || p.name, lat: p.lat, lng: p.lng });
            leaveHomePicker();
          }}
          onClose={needHome ? undefined : leaveHomePicker}
        />
      )}

      {picker === "origin" && (
        <LocationPicker
          title="출발지 선택"
          description="출발할 곳을 현재 위치나 주소로 찾아 보세요."
          near={form.destination ?? undefined}
          homeChip={homeChip("origin", (place) => {
            set("origin", place);
            saveLastOrigin(place);
            setPicker(null);
          })}
          locateLabel="현재 위치로 선택"
          confirmQuestion="여기를 출발지로 선택할까요?"
          confirmLabel="네, 여기서 출발할게요"
          onSelect={(p) => {
            const place = { name: p.name, area: p.address, lat: p.lat, lng: p.lng };
            set("origin", place);
            saveLastOrigin(place);
            setPicker(null);
          }}
          onClose={() => setPicker(null)}
        />
      )}

      {picker === "destination" && (
        <LocationPicker
          title="도착지 선택"
          near={form.origin ?? undefined}
          homeChip={homeChip("destination", (place) => {
            set("destination", place);
            saveLastDestination(place);
            setPicker(null);
          })}
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
          className="flex min-h-16 w-full flex-col justify-center rounded-input bg-muted px-4 py-3 text-left"
        >
          <span className="text-caption text-muted-foreground">출발지</span>
          <span className="text-body-lg font-medium">{form.origin?.name || "장소 선택"}</span>
          {form.origin?.area && (
            <span className="mt-1 truncate text-caption text-muted-foreground">{form.origin.area}</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setPicker("destination")}
          className="flex min-h-16 w-full flex-col justify-center rounded-input bg-muted px-4 py-3 text-left"
        >
          <span className="text-caption text-muted-foreground">도착지</span>
          <span className="text-body-lg font-medium">{form.destination?.name || "장소 선택"}</span>
          {form.destination?.area && (
            <span className="mt-1 truncate text-caption text-muted-foreground">{form.destination.area}</span>
          )}
        </button>

        <TimeSheet label="약속 시각" value={form.time} onChange={(v) => set("time", v)} />

        <div className="flex h-12 items-center justify-between px-1">
          <span id="tomorrow-label" className="text-body text-on-surface">
            내일 약속이에요
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={form.tomorrow}
            aria-labelledby="tomorrow-label"
            onClick={() => set("tomorrow", !form.tomorrow)}
            className={`relative h-8 w-14 rounded-pill transition-colors ${
              form.tomorrow ? "bg-primary" : "bg-border"
            }`}
          >
            <span
              className={`absolute left-1 top-1 size-6 rounded-pill bg-surface transition-transform ${
                form.tomorrow ? "translate-x-6" : ""
              }`}
            />
          </button>
        </div>

        {error && (
          <p role="alert" className="text-body text-on-danger">
            {error}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          disabled={loading}
          // 버튼을 누를 때마다 한 번. 계산 중에는 버튼이 비활성이라 중복으로 눌리지 않는다.
          onClick={() => amplitude.track("Route Search Clicked")}
          className="mt-3 w-full text-body-lg"
        >
          {loading ? "실제 시간표 확인 중…" : "나갈 시각 알아보기"}
        </Button>
      </form>
    </main>
  );
}

const DAY = { weekday: "평일", saturday: "토요일", sunday: "일요일" } as const;

function PlanView({ plan }: { plan: Plan }) {
  const walkOnly = !plan.legs.some((l) => l.type === "ride" || l.type === "bus");
  return (
    <>
      <section className="px-5 pb-8">
        <p className="text-body text-muted-foreground">
          {fmt(plan.arriveBy)} 약속 · 총 {plan.arriveAt - plan.leaveAt}분 걸려요
        </p>
        <p className="mt-1 text-time font-medium">
          <span className="text-brand">{fmt(plan.leaveAt)}</span>
          <span className="ml-2 text-subheading font-medium text-on-surface">에 출발하세요</span>
        </p>
        <p className="mt-3 text-body text-muted-foreground">
          {walkOnly
            ? "걸어서 이동"
            : plan.transfers === 0
              ? "환승 없이"
              : `환승 ${plan.transfers}번`}{" "}
          · 약속 {plan.arriveBy - plan.arriveAt}분 전 도착
        </p>
        {walkOnly && <p className="mt-1 text-caption text-muted-foreground">지하철 없이 걸어서 가는 방법이에요</p>}
      </section>

      <div className="mx-5 border-t border-border" />

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
  const hasRide = plan.legs.some((l) => l.type === "ride");
  const hasBus = plan.legs.some((l) => l.type === "bus");
  if (hasRide) {
    const day = DAY[plan.dayType ?? "weekday"];
    notes.push(`${day} 열차 시간표 기준 · 출처 서울교통공사`);
    if (plan.scheduleEstimated) notes.push("시간표가 없는 노선은 배차 간격으로 예상한 시각이에요");
  }
  if (plan.walkEstimated) notes.push("일부 도보 시간은 직선거리로 추정했어요");
  return (
    <>
      {notes.length > 0 && (
        <div className="mt-6 space-y-1 text-caption text-muted-foreground">
          {notes.map((n) => (
            <p key={n}>{n}</p>
          ))}
        </div>
      )}
      {hasBus && (
        <p className="mt-4 rounded-card bg-muted px-3 py-3 text-caption text-muted-foreground">
          {plan.busEstimated
            ? "버스 도착 정보가 없거나 약속이 2시간 이상 남은 경우, 배차 간격을 기준으로 안내해요. 약속 1~2시간 전에 다시 확인하면 좀 더 명확하게 알려드려요."
            : "버스 시각은 지금 버스 도착 정보를 바탕으로 예상하여 실제와 몇 분 차이가 있을 수 있어요."}
        </p>
      )}
    </>
  );
}
