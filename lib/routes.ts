import type { Trip } from "./types";
import { STATIONS } from "./stations";

export interface RouteSummary {
  key: string;
  origin: string;
  destination: string;
  lines: { id: string; name: string; color: string }[];
  transfers: number;
  /** 도착 기록을 남긴 횟수 (이 노선 조합만) */
  usageCount: number;
  /**
   * 같은 출발지·도착지로 도착 기록을 남긴 횟수. 재안내로 추천 노선이 바뀌어 다른 줄로 나뉘어도
   * "자주 이용한 경로" 표시가 사라지지 않도록, 이 값으로 판단한다.
   */
  pairUsageCount: number;
  lastUsedAt: number;
  trips: Trip[];
  latest: Trip;
}

const arrived = (t: Trip) => t.status !== "planned";

/** 경로 내역: 출발·도착·노선이 같은 안내를 묶는다. */
export function groupRoutes(trips: Trip[]): RouteSummary[] {
  const map = new Map<string, Trip[]>();
  // 지운 경로(hidden)는 내역에서 빼고, 로드맵(buildRoadmap)에는 그대로 센다.
  for (const t of trips) {
    if (t.hidden) continue;
    map.set(t.routeKey, [...(map.get(t.routeKey) ?? []), t]);
  }

  const pairKey = (t: Trip) => `${t.plan.origin}>${t.plan.destination}`;
  const pairUsage = new Map<string, number>();
  for (const t of trips) {
    if (t.hidden || !arrived(t)) continue;
    pairUsage.set(pairKey(t), (pairUsage.get(pairKey(t)) ?? 0) + 1);
  }

  return [...map.entries()]
    .map(([key, list]) => {
      const sorted = [...list].sort((a, b) => b.createdAt - a.createdAt);
      const latest = sorted[0];
      const rides = latest.plan.legs.flatMap((l) =>
        l.type === "ride"
          ? [{ id: l.line, name: l.lineName, color: l.color }]
          : l.type === "bus"
            ? [{ id: `bus${l.routeName}`, name: `${l.routeName}번 버스`, color: l.color }]
            : [],
      );
      const used = sorted.filter(arrived);
      return {
        key,
        origin: latest.plan.origin,
        destination: latest.plan.destination,
        lines: rides,
        transfers: latest.plan.transfers,
        usageCount: used.length,
        pairUsageCount: pairUsage.get(pairKey(latest)) ?? 0,
        lastUsedAt: used[0]?.arrivedAt ?? latest.createdAt,
        trips: sorted,
        latest,
      };
    })
    .sort((a, b) => b.lastUsedAt - a.lastUsedAt);
}

export type MapPoint = { lat: number; lng: number };

/** 로드맵에 그리는 한 구간. 지하철을 탄 구간(ride)은 실선, 걷기·버스 등 나머지는 점선으로 그린다. */
export interface RoadSegment {
  points: MapPoint[];
  ride: boolean;
}

export interface Roadmap {
  /** 이용할 때마다 출발지에서 도착지까지 이어 그린 구간들. 겹치면 겹친 대로 위에 그린다. */
  segments: RoadSegment[];
  /** 지하철로 방문한 역 */
  stations: Set<string>;
  tripCount: number;
  routeCount: number;
  km: number;
}

function km(a: MapPoint, b: MapPoint) {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const h =
    Math.sin(rad(b.lat - a.lat) / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * 안내 하나를 출발지 → 도착지까지 이어진 구간들로 바꾼다.
 * 지하철은 역 좌표를 따라 그리고, 걷기·버스 구간은 좌표가 있는 앞뒤 지점을 직선으로 잇는다.
 */
function tripSegments(t: Trip): RoadSegment[] {
  const segs: RoadSegment[] = [];
  let cursor: MapPoint | undefined = t.plan.originCoord;
  const link = (to: MapPoint) => {
    if (cursor && km(cursor, to) > 0.01) segs.push({ points: [cursor, to], ride: false });
    cursor = to;
  };

  for (const leg of t.plan.legs) {
    if (leg.type === "ride") {
      // 카카오 경로의 역 중 우리 노선도에 없는 역은 지도에 그릴 수 없어 뺀다.
      const pts = leg.stations.filter((n) => STATIONS[n]).map((n) => STATIONS[n]);
      if (pts.length === 0) continue;
      link(pts[0]);
      if (pts.length > 1) segs.push({ points: pts, ride: true });
      cursor = pts[pts.length - 1];
    } else if (leg.type === "walk" && leg.toCoord) {
      link(leg.toCoord);
    }
  }
  if (t.plan.destCoord) link(t.plan.destCoord);
  return segs;
}

export function buildRoadmap(trips: Trip[]): Roadmap {
  const segments: RoadSegment[] = [];
  const stations = new Set<string>();
  const routes = new Set<string>();
  let dist = 0;
  let tripCount = 0;

  for (const t of trips.filter(arrived)) {
    tripCount++;
    routes.add(t.routeKey);
    for (const leg of t.plan.legs) {
      if (leg.type === "ride") leg.stations.filter((n) => STATIONS[n]).forEach((n) => stations.add(n));
    }
    for (const seg of tripSegments(t)) {
      segments.push(seg);
      seg.points.forEach((p, i) => {
        if (i > 0) dist += km(seg.points[i - 1], p);
      });
    }
  }
  return { segments, stations, tripCount, routeCount: routes.size, km: dist };
}
