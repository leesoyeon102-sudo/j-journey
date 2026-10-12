import { STATIONS } from "./stations";
import type { Plan } from "./types";

type LatLng = { lat: number; lng: number };

const station = (name: string): LatLng | undefined => {
  const s = STATIONS[name];
  return s ? { lat: s.lat, lng: s.lng } : undefined;
};

/**
 * 우리 노선도로 계산한 안(카카오 경로를 쓰지 못했을 때)의 도보 구간에, 역·출발지·도착지 좌표를 채운다.
 * 버스 정류장처럼 좌표를 모르는 지점이 낀 구간은 비워 두고, 그런 구간에는 카카오맵 버튼이 붙지 않는다.
 */
export function attachWalkCoords(plan: Plan, origin: LatLng, destination: LatLng) {
  for (const leg of plan.legs) {
    if (leg.type !== "walk" || leg.fromCoord || leg.toCoord) continue;
    const from = leg.kind === "home" || leg.kind === "direct" ? origin : station(leg.from);
    const to = leg.kind === "dest" || leg.kind === "direct" ? destination : station(leg.to);
    if (from && to) {
      leg.fromCoord = { lat: from.lat, lng: from.lng };
      leg.toCoord = { lat: to.lat, lng: to.lng };
    }
  }
}
