import type { Trip } from "./types";
import { distanceKm } from "./stations";

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

export interface Roadmap {
  /** 이용할 때마다 한 줄씩, 탄 열차 구간의 역 순서. 겹치면 겹친 대로 위에 그린다. */
  paths: string[][];
  stations: Set<string>;
  tripCount: number;
  routeCount: number;
  km: number;
}

export function buildRoadmap(trips: Trip[]): Roadmap {
  const paths: string[][] = [];
  const stations = new Set<string>();
  const routes = new Set<string>();
  let km = 0;
  let tripCount = 0;

  for (const t of trips.filter(arrived)) {
    tripCount++;
    routes.add(t.routeKey);
    for (const leg of t.plan.legs) {
      if (leg.type !== "ride") continue;
      paths.push(leg.stations);
      leg.stations.forEach((s, i) => {
        stations.add(s);
        if (i > 0) km += distanceKm(leg.stations[i - 1], s);
      });
    }
  }
  return { paths, stations, tripCount, routeCount: routes.size, km };
}

