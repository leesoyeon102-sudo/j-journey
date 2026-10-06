// 키 없이 쓸 수 있는 공개 API: Nominatim(주소·장소 검색), Valhalla(도보 경로).
// 공개 서버라 호출량이 많으면 제한될 수 있다. 서비스 운영 시에는 카카오·네이버 등 키 기반 API로 교체한다.
const UA = "j-outing/0.1 (walking-time planner demo)";

export const NOMINATIM = "https://nominatim.openstreetmap.org";
export const VALHALLA = "https://valhalla1.openstreetmap.de";

export async function osmFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: { "User-Agent": UA, "Accept-Language": "ko", ...(init?.headers ?? {}) },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`upstream ${res.status}`);
  return res.json();
}

/** 수도권 범위(서울·경기·인천) 안의 좌표인지 */
export function inKorea(lat: number, lng: number) {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat > 33 && lat < 39 && lng > 124 && lng < 132;
}

const cache = new Map<string, { at: number; value: unknown }>();
export async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.value as T;
  const value = await load();
  cache.set(key, { at: Date.now(), value });
  if (cache.size > 500) cache.delete(cache.keys().next().value!);
  return value;
}

/** "경복궁, 삼청로, 창성동, ..., 03142, 대한민국" → 읽기 좋은 주소 */
export function shortAddress(display: string) {
  return display
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s && s !== "대한민국" && !/^\d{5}$/.test(s))
    .slice(0, 4)
    .join(" ");
}
