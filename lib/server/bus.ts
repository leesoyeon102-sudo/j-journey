import { readFile } from "node:fs/promises";
import path from "node:path";
import { meters } from "../geo";

// 서울·경기 버스 데이터 (scripts/bus/build.py 가 만든 lib/data/bus.json).
export interface BusStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  /** 서울 정류소 번호(실시간 도착 조회용). 서울 밖이면 빈 문자열 */
  ars: string;
}

export interface BusRoute {
  id: string;
  name: string;
  /** 간선·지선·마을·광역 등 */
  kind: string;
  region: "S" | "G";
  /** [평일 첨두, 평일 비첨두, 토 첨두, 토 비첨두, 일 첨두, 일 비첨두] 배차 간격(분), 0이면 모름 */
  headway: number[];
  first: string;
  last: string;
  stops: number[];
  /** 첫 정류장에서 각 정류장까지 걸리는 누적 시간(초) */
  secs: number[];
  /** 정류장 순번(실시간 도착 조회용) */
  orders: number[];
}

export interface BusData {
  stops: BusStop[];
  routes: BusRoute[];
  /** 정류장 → 그 정류장을 지나는 (노선, 노선 안 순서) */
  byStop: Map<number, { r: number; i: number }[]>;
  grid: Map<string, number[]>;
}

const CELL = 0.005; // 약 500m
const cellKey = (lat: number, lng: number) => `${Math.floor(lat / CELL)}:${Math.floor(lng / CELL)}`;

let loading: Promise<BusData | null> | null = null;

/** 버스 데이터를 처음 쓸 때 한 번만 읽는다. 파일이 없으면 null (버스 없이 지하철만 안내). */
export function loadBus(): Promise<BusData | null> {
  loading ??= (async () => {
    try {
      const raw = JSON.parse(await readFile(path.join(process.cwd(), "lib", "data", "bus.json"), "utf8")) as {
        stops: [string, string, number, number, string][];
        routes: {
          id: string;
          n: string;
          k: string;
          r: "S" | "G";
          h: number[];
          f: string;
          l: string;
          s: number[];
          m: number[];
          o?: number[];
        }[];
      };
      const stops: BusStop[] = raw.stops.map(([id, name, lat, lng, ars]) => ({
        id,
        name,
        lat: lat / 1e5,
        lng: lng / 1e5,
        ars,
      }));
      const routes: BusRoute[] = raw.routes.map((r) => ({
        id: r.id,
        name: r.n,
        kind: r.k,
        region: r.r,
        headway: r.h,
        first: r.f,
        last: r.l,
        stops: r.s,
        secs: r.m,
        orders: r.o ?? r.s.map((_, i) => i + 1),
      }));
      const byStop = new Map<number, { r: number; i: number }[]>();
      routes.forEach((route, r) =>
        route.stops.forEach((s, i) => {
          const list = byStop.get(s);
          if (list) list.push({ r, i });
          else byStop.set(s, [{ r, i }]);
        }),
      );
      const grid = new Map<string, number[]>();
      stops.forEach((s, i) => {
        const k = cellKey(s.lat, s.lng);
        const list = grid.get(k);
        if (list) list.push(i);
        else grid.set(k, [i]);
      });
      return { stops, routes, byStop, grid };
    } catch {
      return null;
    }
  })();
  return loading;
}

/** 좌표 주변 반경(m) 안의 정류장을 가까운 순으로 */
export function nearbyStops(
  data: BusData,
  p: { lat: number; lng: number },
  radius: number,
  limit: number,
): { stop: number; dist: number }[] {
  const span = Math.ceil(radius / 500) + 1;
  const cx = Math.floor(p.lat / CELL);
  const cy = Math.floor(p.lng / CELL);
  const out: { stop: number; dist: number }[] = [];
  for (let dx = -span; dx <= span; dx++) {
    for (let dy = -span; dy <= span; dy++) {
      for (const i of data.grid.get(`${cx + dx}:${cy + dy}`) ?? []) {
        const dist = meters(p, data.stops[i]);
        if (dist <= radius) out.push({ stop: i, dist });
      }
    }
  }
  return out.sort((a, b) => a.dist - b.dist).slice(0, limit);
}

export type DayType = "weekday" | "saturday" | "sunday";

const DEFAULT_HEADWAY: Record<string, number> = { 마을: 12, 지선: 10, 간선: 8, 광역: 20, 직행좌석: 20, 광역급행: 25, 일반: 15, 경기: 15, 인천: 15, 공항: 20, 순환: 15, 시외: 30, 공용: 20 };

/** 요일·시각에 맞는 배차 간격(분). 첨두는 평일 7~9시·17~20시 */
export function headwayAt(route: BusRoute, day: DayType, minute: number) {
  const peak = day === "weekday" ? (minute >= 420 && minute < 570) || (minute >= 1020 && minute < 1200) : true;
  const base = day === "weekday" ? 0 : day === "saturday" ? 2 : 4;
  const h = route.headway[base + (peak ? 0 : 1)] || route.headway[base] || route.headway[0] || route.headway[1];
  return h > 0 ? h : (DEFAULT_HEADWAY[route.kind] ?? 15);
}

/** 노선 종류별 표시 색 */
export function busColor(kind: string) {
  switch (kind) {
    case "간선":
      return "#3D5BAB";
    case "지선":
      return "#4CAF50";
    case "마을":
      return "#8BC34A";
    case "광역":
    case "직행좌석":
    case "광역급행":
    case "시외":
      return "#E53935";
    case "순환":
      return "#F2B705";
    case "공항":
      return "#7E57C2";
    default:
      return "#2E7D5B";
  }
}
