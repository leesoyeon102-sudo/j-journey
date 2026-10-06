import { NextRequest, NextResponse } from "next/server";
import { hasKakaoKey, searchAddress, searchKeyword, type KakaoPlace } from "@/lib/server/kakao";
import { cached, NOMINATIM, osmFetch, shortAddress } from "@/lib/server/osm";

interface NominatimItem {
  name?: string;
  display_name: string;
  lat: string;
  lon: string;
}

// 지하철 데이터가 다루는 수도권 범위
const inService = (p: KakaoPlace) => p.lat > 36.9 && p.lat < 38.3 && p.lng > 126.3 && p.lng < 127.8;

async function viaKakao(q: string, near?: { lat: number; lng: number }) {
  // 숫자가 들어 있으면 주소일 가능성이 커서 주소 검색 결과를 먼저 보여 준다.
  const looksLikeAddress = /\d/.test(q);
  const [keyword, address] = await Promise.all([
    searchKeyword(q, near).catch(() => []),
    looksLikeAddress ? searchAddress(q).catch(() => []) : Promise.resolve([]),
  ]);
  const seen = new Set<string>();
  return [...(looksLikeAddress ? [...address, ...keyword] : keyword)]
    .filter(inService)
    .filter((p) => {
      const key = `${p.name}|${p.address}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 10);
}

async function viaNominatim(q: string): Promise<KakaoPlace[]> {
  const params = new URLSearchParams({
    q,
    format: "jsonv2",
    "accept-language": "ko",
    countrycodes: "kr",
    limit: "7",
    viewbox: "126.4,38.2,127.7,36.9",
    bounded: "1",
  });
  const items = await cached(`g:${q}`, 10 * 60_000, () =>
    osmFetch(`${NOMINATIM}/search?${params}`) as Promise<NominatimItem[]>,
  );
  return items.map((it) => ({
    name: it.name || shortAddress(it.display_name).split(" ")[0],
    address: shortAddress(it.display_name),
    lat: Number(it.lat),
    lng: Number(it.lon),
  }));
}

/**
 * GET /api/geocode?q=장소·주소[&lat=&lng=] → 후보 목록
 * 카카오 키가 있으면 카카오 로컬 API, 없거나 실패하면 OpenStreetMap Nominatim을 쓴다.
 * lat/lng는 가까운 곳을 먼저 보여 주기 위한 기준 좌표(선택).
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = (sp.get("q") ?? "").trim();
  if (q.length < 2 || q.length > 100) {
    return NextResponse.json({ results: [] });
  }
  const lat = Number(sp.get("lat"));
  const lng = Number(sp.get("lng"));
  const near = sp.has("lat") && Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : undefined;

  if (hasKakaoKey()) {
    try {
      const results = await viaKakao(q, near);
      return NextResponse.json({ results, source: "kakao" });
    } catch {
      // 카카오 호출 실패 시 아래 대체 검색으로 넘어간다.
    }
  }
  try {
    return NextResponse.json({ results: await viaNominatim(q), source: "osm" });
  } catch {
    return NextResponse.json({ results: [], error: "search_failed" }, { status: 502 });
  }
}
