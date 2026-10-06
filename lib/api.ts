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

export async function searchAddress(q: string): Promise<GeoResult[]> {
  const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
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
