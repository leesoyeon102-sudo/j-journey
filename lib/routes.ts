import type { RideLeg, Trip } from "./types";
import { distanceKm } from "./stations";

export interface RouteSummary {
  key: string;
  origin: string;
  destination: string;
  lines: { id: string; name: string; color: string }[];
  transfers: number;
  /** 도착 기록을 남긴 횟수 */
  usageCount: number;
  lastUsedAt: number;
  trips: Trip[];
  latest: Trip;
}

const arrived = (t: Trip) => t.status !== "planned";

/** 경로 내역: 출발·도착·노선이 같은 안내를 묶는다. */
export function groupRoutes(trips: Trip[]): RouteSummary[] {
  const map = new Map<string, Trip[]>();
  for (const t of trips) map.set(t.routeKey, [...(map.get(t.routeKey) ?? []), t]);

  return [...map.entries()]
    .map(([key, list]) => {
      const sorted = [...list].sort((a, b) => b.createdAt - a.createdAt);
      const latest = sorted[0];
      const rides = latest.plan.legs.filter((l): l is RideLeg => l.type === "ride");
      const used = sorted.filter(arrived);
      return {
        key,
        origin: latest.plan.origin,
        destination: latest.plan.destination,
        lines: rides.map((r) => ({ id: r.line, name: r.lineName, color: r.color })),
        transfers: latest.plan.transfers,
        usageCount: used.length,
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

