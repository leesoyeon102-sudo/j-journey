// 카카오 로컬 API (장소·주소 검색, 좌표 → 주소). REST API 키는 서버에서만 쓴다.
// 문서: https://developers.kakao.com/docs/ko/local/dev-guide
const BASE = "https://dapi.kakao.com/v2/local";

export interface KakaoPlace {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export const hasKakaoKey = () => Boolean(process.env.KAKAO_REST_KEY);

async function kakao<T>(path: string, params: Record<string, string | number | undefined>): Promise<T> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined) qs.set(k, String(v));
  const res = await fetch(`${BASE}${path}?${qs}`, {
    headers: { Authorization: `KakaoAK ${process.env.KAKAO_REST_KEY}` },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`kakao ${res.status}`);
  return res.json() as Promise<T>;
}

interface KeywordDoc {
  place_name: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
}

interface AddressDoc {
  address_name: string;
  x: string;
  y: string;
  road_address?: { address_name: string; building_name: string } | null;
}

/**
 * 키워드(상호·건물·역 이름) 검색. `near`가 있으면 가까운 순으로 보고,
 * "근처·주변"이 들어간 검색어는 그 주변 반경 안에서 찾는다.
 */
export async function searchKeyword(
  query: string,
  near?: { lat: number; lng: number },
): Promise<KakaoPlace[]> {
  const nearby = /근처|주변/.test(query);
  const q = query.replace(/(내\s*)?(집|현재\s*위치)?\s*(근처|주변)/g, " ").replace(/\s+/g, " ").trim() || query;
  const data = await kakao<{ documents: KeywordDoc[] }>("/search/keyword.json", {
    query: q,
    size: 10,
    ...(near
      ? {
          x: near.lng,
          y: near.lat,
          ...(nearby ? { radius: 5000, sort: "distance" } : {}),
        }
      : {}),
  });
  return data.documents.map((d) => ({
    name: d.place_name,
    address: d.road_address_name || d.address_name,
    lat: Number(d.y),
    lng: Number(d.x),
  }));
}

/** 주소(도로명·지번) 검색 */
export async function searchAddress(query: string): Promise<KakaoPlace[]> {
  const data = await kakao<{ documents: AddressDoc[] }>("/search/address.json", {
    query,
    size: 5,
  });
  return data.documents.map((d) => ({
    name: d.road_address?.building_name || d.road_address?.address_name || d.address_name,
    address: d.road_address?.address_name || d.address_name,
    lat: Number(d.y),
    lng: Number(d.x),
  }));
}

/** 좌표 → 주소 */
export async function reverse(lat: number, lng: number): Promise<string | null> {
  const data = await kakao<{
    documents: {
      road_address?: { address_name: string; building_name: string } | null;
      address?: { address_name: string } | null;
    }[];
  }>("/geo/coord2address.json", { x: lng, y: lat });
  const d = data.documents[0];
  if (!d) return null;
  const road = d.road_address;
  if (road) return road.building_name ? `${road.address_name} (${road.building_name})` : road.address_name;
  return d.address?.address_name ?? null;
}
