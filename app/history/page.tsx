"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Timeline from "@/components/Timeline";
import { groupRoutes, type RouteSummary } from "@/lib/routes";
import { requestPlans } from "@/lib/api";
import { nextOccurrence } from "@/lib/dates";
import { setPendingResult } from "@/lib/pending";
import { addTrip, removeRoute, useTrips } from "@/lib/storage";
import { fmt, fmtDate } from "@/lib/time";

export default function HistoryPage() {
  const trips = useTrips();
  const routes = groupRoutes(trips);
  const router = useRouter();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<{ key: string; message: string } | null>(null);

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
        <p className="px-5 py-24 text-center text-sm leading-relaxed text-sub">
          아직 안내받은 경로가 없어요.
          <br />
          홈에서 약속 시각을 입력해 보세요.
        </p>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {routes.map((r) => {
            const open = openKey === r.key;
            const { plan } = r.latest;
            return (
              <li key={r.key}>
                <button
                  onClick={() => setOpenKey(open ? null : r.key)}
                  aria-expanded={open}
                  className="w-full px-5 py-5 text-left active:bg-soft"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[16px] font-medium">
                      {r.destination}
                    </p>
                    <span className="flex shrink-0 gap-1">
                      {r.lines.map((l, i) => (
                        <span
                          key={i}
                          title={l.name}
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: l.color }}
                        />
                      ))}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-ink/80">
                    {r.usageCount > 0
                      ? `이 경로를 ${r.usageCount}번 이용했어요`
                      : "아직 이용 기록이 없어요"}
                  </p>
                  <p className="mt-0.5 text-xs text-sub">
                    {r.lines.length ? r.lines.map((l) => l.name).join(" → ") : "도보"} ·{" "}
                    {r.transfers === 0 ? "환승 없음" : `환승 ${r.transfers}번`} · 마지막{" "}
                    {fmtDate(r.lastUsedAt)}
                  </p>
                </button>

                {open && (
                  <div className="fade-in bg-soft/60 px-5 pb-5 pt-4">
                    <p className="mb-4 text-xs text-sub">
                      마지막 안내 · {fmt(plan.leaveAt)} 출발 · {fmt(plan.arriveBy)} 약속
                    </p>
                    <Timeline plan={plan} />

                    <ul className="mt-5 space-y-1 text-xs text-sub">
                      {r.trips.slice(0, 5).map((t) => (
                        <li key={t.id}>
                          {fmtDate(t.createdAt)} ·{" "}
                          {t.status === "ontime"
                            ? "제시간 도착"
                            : t.status === "late"
                              ? "늦게 도착"
                              : "도착 기록 없음"}
                        </li>
                      ))}
                    </ul>

                    <div className="mt-5 flex gap-2">
                      <button
                        onClick={() => replan(r)}
                        disabled={busyKey !== null}
                        className="flex h-11 flex-1 items-center justify-center rounded-xl bg-ink text-sm font-medium text-white disabled:opacity-60"
                      >
                        {busyKey === r.key ? "계산 중…" : "이 경로로 다시 안내받기"}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("이 경로의 기록을 모두 삭제할까요?")) {
                            removeRoute(r.key);
                            setOpenKey(null);
                          }
                        }}
                        className="h-11 px-4 text-sm text-sub"
                      >
                        삭제
                      </button>
                    </div>
                    {error?.key === r.key && (
                      <p role="alert" className="mt-3 text-sm text-red-500">
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
    </main>
  );
}
