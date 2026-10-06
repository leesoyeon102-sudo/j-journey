import data from "./data/metro.json";
import type { Line, Neighbor, Station } from "./types";

/**
 * 수도권(서울·경기·인천) 지하철 데이터.
 * 출처: KoreaMetroGraph (MIT) 기반, `scripts/build-metro.py`로 생성. 2018년경 기준이라
 * 이후 개통한 노선·역은 빠져 있다.
 */
const META: Record<string, { name: string; color: string; headway: number }> = {
  "1": { name: "1호선", color: "#0052A4", headway: 5 },
  "2": { name: "2호선", color: "#00A84D", headway: 4 },
  "3": { name: "3호선", color: "#EF7C1C", headway: 5 },
  "4": { name: "4호선", color: "#00A5DE", headway: 5 },
  "5": { name: "5호선", color: "#996CAC", headway: 5 },
  "6": { name: "6호선", color: "#CD7C2F", headway: 7 },
  "7": { name: "7호선", color: "#747F00", headway: 5 },
  "8": { name: "8호선", color: "#E6186C", headway: 8 },
  "9": { name: "9호선", color: "#BDB092", headway: 6 },
  A: { name: "공항철도", color: "#0090D2", headway: 9 },
  K: { name: "경의중앙선", color: "#77C4A3", headway: 10 },
  G: { name: "경춘선", color: "#0C8E72", headway: 15 },
  B: { name: "분당선", color: "#F5A200", headway: 8 },
  S: { name: "신분당선", color: "#D4003B", headway: 6 },
  SU: { name: "수인선", color: "#F5A200", headway: 10 },
  KK: { name: "경강선", color: "#003DA5", headway: 12 },
  I: { name: "인천1호선", color: "#7CA8D5", headway: 7 },
  I2: { name: "인천2호선", color: "#ED8B00", headway: 7 },
  U: { name: "의정부경전철", color: "#FDA600", headway: 6 },
  E: { name: "에버라인", color: "#56AD2D", headway: 7 },
  UI: { name: "우이신설선", color: "#B0CE18", headway: 6 },
  W: { name: "서해선", color: "#81A914", headway: 12 },
};

export const STATIONS: Record<string, Station> = Object.fromEntries(
  Object.entries(data.stations as unknown as Record<string, [number, number]>).map(([name, [lat, lng]]) => [
    name,
    { name, lat, lng },
  ]),
);

export const STATION_NAMES = Object.keys(STATIONS);

function buildLine(id: string, edges: [string, string, number][], index: number): Line {
  const adj = new Map<string, Neighbor[]>();
  const link = (a: string, b: string, min: number) => {
    adj.set(a, [...(adj.get(a) ?? []), { to: b, min }]);
  };
  for (const [a, b, min] of edges) {
    link(a, b, min);
    link(b, a, min);
  }
  // 연결된 구간마다 기준역에서의 누적 시간 (시간표 위상 계산용)
  const dist = new Map<string, number>();
  for (const start of adj.keys()) {
    if (dist.has(start)) continue;
    dist.set(start, 0);
    const queue = [start];
    while (queue.length) {
      const u = queue.shift()!;
      for (const { to, min } of adj.get(u)!) {
        if (!dist.has(to)) {
          dist.set(to, dist.get(u)! + min);
          queue.push(to);
        }
      }
    }
  }
  const meta = META[id];
  return {
    id,
    ...meta,
    phase: index % 5,
    stations: [...adj.keys()],
    adj,
    dist,
    edges,
  };
}

export const LINES: Line[] = Object.entries(data.lines as unknown as Record<string, [string, string, number][]>)
  .filter(([id]) => id in META)
  .map(([id, edges], i) => buildLine(id, edges, i));

const lineMap = new Map<string, Line[]>();
for (const l of LINES) {
  for (const s of l.stations) lineMap.set(s, [...(lineMap.get(s) ?? []), l]);
}

export function linesOf(station: string): Line[] {
  return lineMap.get(station) ?? [];
}

/** 두 역 사이 직선거리(km) */
export function distanceKm(a: string, b: string) {
  const p = STATIONS[a];
  const q = STATIONS[b];
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(q.lat - p.lat);
  const dLng = rad(q.lng - p.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(p.lat)) * Math.cos(rad(q.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
