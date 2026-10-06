import { STATIONS } from "./stations";

export interface Place {
  name: string;
  area: string;
  lat: number;
  lng: number;
}

const WALK_KM_PER_MIN = 0.075; // 시속 4.5km
const DETOUR = 1.3; // 직선거리 대비 실제 도보 거리

function haversine(p: { lat: number; lng: number }, s: { lat: number; lng: number }) {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(s.lat - p.lat);
  const dLng = rad(s.lng - p.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(p.lat)) * Math.cos(rad(s.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function km(p: Place, station: string) {
  return haversine(p, STATIONS[station]);
}

/** 두 장소를 걸어서 가는 데 걸리는 시간(분)과 거리(km) */
export function walkBetween(a: Place, b: Place) {
  const d = haversine(a, b) * DETOUR;
  return { km: d, min: Math.max(1, Math.ceil(d / WALK_KM_PER_MIN)) };
}

export interface NearStation {
  station: string;
  walkMin: number;
}

/** 장소에서 가까운 역 후보와 도보 시간(분)을 자동 계산한다. */
export function nearestStations(place: Place, count = 4): NearStation[] {
  return Object.keys(STATIONS)
    .map((station) => ({ station, d: km(place, station) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, count)
    .map(({ station, d }) => ({
      station,
      walkMin: Math.max(2, Math.ceil((d * DETOUR) / WALK_KM_PER_MIN)),
    }));
}

