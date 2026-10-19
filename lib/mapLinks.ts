import type { Plan } from "./types";

type Route = Pick<Plan, "origin" | "destination" | "originCoord" | "destCoord">;

/** 카카오맵 대중교통 길찾기 주소. 좌표가 없으면 이름으로 검색한다. */
export function kakaoMapUrl({ origin, destination, originCoord: o, destCoord: d }: Route): string {
  if (o && d) {
    return `https://map.kakao.com/link/by/traffic/${encodeURIComponent(origin)},${o.lat},${o.lng}/${encodeURIComponent(destination)},${d.lat},${d.lng}`;
  }
  return `https://map.kakao.com/?sName=${encodeURIComponent(origin)}&eName=${encodeURIComponent(destination)}`;
}

/** 네이버지도 대중교통 길찾기 주소. 좌표가 없으면 이름으로 검색한다. */
export function naverMapUrl({ origin, destination, originCoord: o, destCoord: d }: Route): string {
  if (o && d) {
    return `https://map.naver.com/p/directions/${o.lng},${o.lat},${encodeURIComponent(origin)}/${d.lng},${d.lat},${encodeURIComponent(destination)}/-/transit`;
  }
  return `https://map.naver.com/p/search/${encodeURIComponent(`${origin} → ${destination}`)}`;
}
