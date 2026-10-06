import type { PlanResult } from "./types";

export interface GeoResult {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

interface Point {
  lat: number;
  lng: number;
}

/** `near`는 가까운 곳을 먼저 보여 주고 "근처" 검색에 쓰는 기준 좌표 */
export async function searchAddress(q: string, near?: Point): Promise<GeoResult[]> {
  const bias = near ? `&lat=${near.lat}&lng=${near.lng}` : "";
  const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}${bias}`);
  if (!res.ok) throw new Error("search_failed");
  return (await res.json()).results as GeoResult[];
}

export async function reverseGeocode(p: Point): Promise<string | null> {
  try {
    const res = await fetch(`/api/reverse?lat=${p.lat}&lng=${p.lng}`);
    if (!res.ok) return null;
    return (await res.json()).address as string | null;
  } catch {
    return null;
  }
}

export interface PlanRequest {
  origin: { name: string; area: string; lat: number; lng: number };
  destination: { name: string; area: string; lat: number; lng: number };
  /** 약속 시각(분) */
  arriveBy: number;
  buffer: number;
  /** 약속 날짜 (YYYY-MM-DD) — 평일·토·일 시간표 선택에 쓴다 */
  date: string;
}

export async function requestPlans(body: PlanRequest): Promise<PlanResult> {
  const res = await fetch("/api/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("plan_failed");
  return (await res.json()) as PlanResult;
}
