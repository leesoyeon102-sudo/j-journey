"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Timeline from "@/components/Timeline";
import Toast from "@/components/Toast";
import { groupRoutes, type RouteSummary } from "@/lib/routes";
import { requestPlans } from "@/lib/api";
import { nextOccurrence } from "@/lib/dates";
import { setPendingResult } from "@/lib/pending";
import { addTrip, removeRoute, useTrips } from "@/lib/storage";
import { fmt, fmtDate } from "@/lib/time";

/** 밀었을 때 오른쪽에 드러나는 삭제 버튼의 너비(px) */
const DELETE_W = 80;

export default function HistoryPage() {
  const trips = useTrips();
  const routes = groupRoutes(trips);
  const router = useRouter();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<{ key: string; message: string } | null>(null);
  // 목록을 왼쪽으로 밀면 삭제 버튼이 나온다. swiped: 열려 있는 줄, drag: 끌고 있는 중의 위치
  const [swiped, setSwiped] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ key: string; x: number } | null>(null);
  const gesture = useRef<{ key: string; x: number; y: number; base: number; last: number; mode: "h" | "v" | null } | null>(null);
  const justSwiped = useRef(false);
  // 삭제 같은 동작 뒤에 잠깐 보이는 안내
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  const onSwipeStart = (key: string, e: React.PointerEvent) => {
    gesture.current = { key, x: e.clientX, y: e.clientY, base: swiped === key ? -DELETE_W : 0, last: swiped === key ? -DELETE_W : 0, mode: null };
  };
  const onSwipeMove = (key: string, e: React.PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g || g.key !== key) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (g.mode === null) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      g.mode = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
      if (g.mode === "h") e.currentTarget.setPointerCapture(e.pointerId);
    }
    if (g.mode === "v") return;
    g.last = Math.max(-DELETE_W, Math.min(0, g.base + dx));
    setDrag({ key, x: g.last });
  };
  const onSwipeEnd = (key: string) => {
    const g = gesture.current;
    gesture.current = null;
    if (g?.mode !== "h") return;
    setSwiped(g.last < -DELETE_W / 2 ? key : null);
    setDrag(null);
    // 밀고 난 직후에 따라오는 click은 무시한다.
    justSwiped.current = true;
    setTimeout(() => (justSwiped.current = false), 0);
  };

  /** 같은 도착지·약속 시각으로 다시 계산해 홈의 출발 안내 화면으로 바로 보낸다. */
  async function replan(r: RouteSummary) {
    const { plan } = r.latest;
    const origin = plan.originCoord
      ? { name: plan.origin, area: "", ...plan.originCoord }
      : null;
    if (!origin) {
      setError({ key: r.key, message: "출발지 위치가 저장되지 않은 경로예요. 홈에서 새로 입력해 주세요." });
      return;
    }
    if (!plan.destCoord) {
      setError({ key: r.key, message: "도착지 위치가 저장되지 않은 경로예요. 홈에서 새로 입력해 주세요." });
      return;
    }
    setError(null);
    setBusyKey(r.key);
    try {
      const { date } = nextOccurrence(plan.arriveBy);
      const result = await requestPlans({
        origin,
        destination: { name: plan.destination, area: "", ...plan.destCoord },
        arriveBy: plan.arriveBy,
        buffer: plan.buffer,
        date,
      });
      if (!result.ok) {
        setError({ key: r.key, message: result.message });
        return;
      }
      setPendingResult({ tripId: addTrip(result.plan).id, plans: result.plans });
      router.push("/");
    } catch {
      setError({ key: r.key, message: "경로를 계산하지 못했어요. 잠시 후 다시 시도해 주세요." });
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <main className="fade-in">
      <Header title="경로 내역" sub={routes.length ? `안내받은 경로 ${routes.length}개` : undefined} />

      {routes.length === 0 ? (
        <p className="px-5 py-24 text-center text-body text-muted-foreground">
          아직 안내받은 경로가 없어요.
          <br />
          홈에서 약속 시각을 입력해 보세요.
        </p>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {routes.map((r) => {
            const open = openKey === r.key;
            const { plan } = r.latest;
            return (
              <li key={r.key}>
                <div className="relative overflow-hidden">
                  <div className="absolute inset-y-0 right-0" style={{ width: DELETE_W }}>
                    <Button
                      variant="danger"
                      tabIndex={swiped === r.key ? 0 : -1}
                      aria-label={`${r.origin}에서 ${r.destination}까지 경로 삭제`}
                      onClick={() => {
                        removeRoute(r.key);
                        setSwiped(null);
                        setOpenKey(null);
                        setToast("경로가 삭제되었습니다.");
                      }}
                      className="h-full w-full rounded-none"
                    >
                      삭제
                    </Button>
                  </div>
                  <div
                    onPointerDown={(e) => onSwipeStart(r.key, e)}
                    onPointerMove={(e) => onSwipeMove(r.key, e)}
                    onPointerUp={() => onSwipeEnd(r.key)}
                    onPointerCancel={() => onSwipeEnd(r.key)}
                    onClickCapture={(e) => {
                      if (justSwiped.current) e.stopPropagation();
                    }}
                    className="relative touch-pan-y bg-surface select-none"
                    style={{
                      transform: `translateX(${drag?.key === r.key ? drag.x : swiped === r.key ? -DELETE_W : 0}px)`,
                      transition: drag?.key === r.key ? "none" : "transform 0.2s ease-out",
                    }}
                  >
                <button
                  onClick={() => {
                    // 삭제 버튼이 열려 있으면 먼저 닫는다.
                    if (swiped === r.key) return setSwiped(null);
                    setOpenKey(open ? null : r.key);
                  }}
                  aria-expanded={open}
                  className="w-full px-5 py-5 text-left active:bg-muted"
                >
                  {r.usageCount >= 2 && (
                    // 2회 이상 이용한 경로만 "자주 이용한 경로"로 표시한다.
                    <p className="mb-1 text-caption-lg font-medium text-brand">자주 이용한 경로 · {r.usageCount}회</p>
                  )}
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-body-lg font-medium">
                      {r.origin} → {r.destination}
                    </p>
                    <span className="flex shrink-0 gap-1">
                      {r.lines.map((l, i) => (
                        <span
                          key={i}
                          title={l.name}
                          className="size-3 rounded-pill"
                          style={{ backgroundColor: l.color }}
                        />
                      ))}
                    </span>
                  </div>
                  <p className="mt-2 text-caption text-muted-foreground">
                    {r.transfers === 0 ? "환승 없음" : `환승 ${r.transfers}번`} · 검색일 {fmtDate(r.lastUsedAt)}
                  </p>
                </button>
                  </div>
                </div>

                {open && (
                  <div className="fade-in bg-muted-subtle px-5 pb-5 pt-4">
                    <p className="mb-4 text-caption text-muted-foreground">
                      마지막 안내 · {fmt(plan.leaveAt)} 출발 · {fmt(plan.arriveBy)} 약속
                    </p>
                    <Timeline plan={plan} />

                    <Button
                      onClick={() => replan(r)}
                      disabled={busyKey !== null}
                      className="mt-5 h-11 w-full text-label-lg"
                    >
                      {busyKey === r.key ? "계산 중…" : "이 경로로 다시 안내받기"}
                    </Button>
                    {error?.key === r.key && (
                      <p role="alert" className="mt-3 text-body text-on-danger">
                        {error.message}
                      </p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {toast && <Toast message={toast} />}
    </main>
  );
}
