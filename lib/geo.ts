/** 두 좌표 사이 직선거리(m) */
export function meters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** 직선거리 기준 도보 시간(분): 우회 계수 1.3, 시속 4.5km */
export function walkMin(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  return Math.max(1, Math.ceil((meters(a, b) * 1.3) / 75));
}
