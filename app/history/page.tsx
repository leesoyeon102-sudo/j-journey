"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import * as amplitude from "@amplitude/analytics-browser";
import { useRouter } from "next/navigation";
import AlertPanel from "@/components/AlertPanel";
import Header from "@/components/Header";
import Timeline from "@/components/Timeline";
import Toast from "@/components/Toast";
import { groupRoutes, type RouteSummary } from "@/lib/routes";
import { draft, lockOrigin } from "@/lib/draft";
import { cancelArrivalReminder } from "@/lib/pushReminder";
import { removeRoute, removeTrip, saveLastDestination, saveLastOrigin, useTrips } from "@/lib/storage";
import { fmt, fmtDate } from "@/lib/time";

/** 밀었을 때 오른쪽에 드러나는 삭제 버튼의 너비(px) */
const DELETE_W = 80;

export default function HistoryPage() {
  const trips = useTrips();
  const routes = groupRoutes(trips);
  // 출발해서 이동 중인 계획. 다른 계획을 다시 검색하면 이 계획은 사라진다.
  const moving = trips.find((t) => t.departedAt && t.status === "planned");
  const [confirmRoute, setConfirmRoute] = useState<RouteSummary | null>(null);
  const router = useRouter();
  const [openKey, setOpenKey] = useState<string | null>(null);
  // 피드백을 묻는 조건: 경로 내역에 한 번 들어와 봤다. 단, 경로 상세를 펼쳐 둔 동안에는 묻지 않는다.
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

  /**
   * 출발지·도착지·약속 시각을 홈 입력 화면에 채워서 홈으로 보낸다. 검색은 하지 않는다.
   * 약속 시각이 이미 지났는지는 따지지 않는다. (지났으면 홈에서 검색할 때 안내가 나온다)
   */
  function reuse(r: RouteSummary) {
    const { plan } = r.latest;
    if (!plan.originCoord) {
      setError({ key: r.key, message: "출발지 위치가 저장되지 않은 경로예요. 홈에서 새로 입력해 주세요." });
      return;
    }
    if (!plan.destCoord) {
      setError({ key: r.key, message: "도착지 위치가 저장되지 않은 경로예요. 홈에서 새로 입력해 주세요." });
      return;
    }
    setError(null);
    saveLastOrigin({ name: plan.origin, area: "", ...plan.originCoord });
    // 불러온 출발지를 홈의 현재 위치 자동 입력이 덮어쓰지 않게 한다. 다만 그때 출발지가 "현재 위치"였다면
    // 그 시각의 낡은 좌표 대신 지금 위치로 다시 입력되도록 잠그지 않는다. (위치를 못 읽으면 불러온 값이 그대로 남는다)
    if (plan.origin !== "현재 위치") lockOrigin();
    saveLastDestination({ name: plan.destination, area: "", ...plan.destCoord });
    Object.assign(draft, { time: fmt(plan.arriveBy), tomorrow: false });
    // 안내 내역을 다시 쓰기 시작했을 때 한 번만 센다.
    amplitude.track("Route Reused");
    router.push("/");
  }

  return (
    <main className="fade-in">
      <Header title="안내 내역" sub={routes.length ? `안내받은 경로 ${routes.length}개` : undefined} />

      {routes.length === 0 ? (
        <p className="px-5 py-24 text-center text-body text-muted-foreground">
          아직 안내받은 경로가 없어요.
          <br />
          홈에서 약속 시각을 입력해 보세요.
        </p>
      ) : (
        <ul className="space-y-3 px-5 pb-8">
          {routes.map((r) => {
            const open = openKey === r.key;
            const { plan } = r.latest;
            return (
              <li key={r.key} className="glass-strong overflow-hidden rounded-nav">
                <div className="relative overflow-hidden">
                  {/* 유리처럼 비치는 카드라, 밀기 전에는 삭제 버튼이 비쳐 보이지 않게 숨겨 둔다. */}
                  <div
                    className="absolute inset-y-0 right-0 transition-opacity"
                    style={{ width: DELETE_W, opacity: drag?.key === r.key || swiped === r.key ? 1 : 0 }}
                  >
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
                    className="relative touch-pan-y select-none"
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
                  {r.pairUsageCount >= 2 && (
                    // 2회 이상 이용한 경로만 "자주 이용한 경로"로 표시한다.
                    <p className="mb-1 text-caption-lg font-medium text-brand">자주 이용한 경로 · {r.pairUsageCount}회</p>
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
                  <div className="fade-in px-5 pb-5">
                    {/* 디바이더: 글자와 같은 너비(카드 좌우 안쪽 여백 20px에 맞춤) */}
                    <div className="mb-4 border-t border-divider" />
                    <p className="mb-4 text-caption text-muted-foreground">
                      마지막 안내 · {fmt(plan.arriveBy)} 약속
                    </p>
                    <Timeline plan={plan} />

                    <Button
                      onClick={() => (moving ? setConfirmRoute(r) : reuse(r))}
                      className="mt-5 h-11 w-full text-label"
                    >
                      이 계획 다시 검색하기
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
      {confirmRoute && (
        <AlertPanel
          title="이 계획을 다시 검색할까요?"
          description="앞에서 출발한 계획은 사라져요."
          onClose={() => setConfirmRoute(null)}
        >
          <Button variant="secondary" size="lg" onClick={() => setConfirmRoute(null)}>
            취소
          </Button>
          <Button
            size="lg"
            autoFocus
            onClick={() => {
              const r = confirmRoute;
              setConfirmRoute(null);
              if (moving) {
                removeTrip(moving.id);
                void cancelArrivalReminder(moving.id);
              }
              reuse(r);
            }}
          >
            다시 검색하기
          </Button>
        </AlertPanel>
      )}
      {toast && <Toast message={toast} />}
    </main>
  );
}
