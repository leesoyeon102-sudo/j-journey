import { NextRequest, NextResponse } from "next/server";
import { hasKakaoKey, reverse } from "@/lib/server/kakao";
import { cached, inKorea, NOMINATIM, osmFetch, shortAddress } from "@/lib/server/osm";

/** GET /api/reverse?lat=&lng= → 좌표의 주소 (카카오 우선, 실패 시 Nominatim) */
export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get("lat"));
  const lng = Number(req.nextUrl.searchParams.get("lng"));
  if (!inKorea(lat, lng)) {
    return NextResponse.json({ address: null }, { status: 400 });
  }
  if (hasKakaoKey()) {
    try {
      const address = await reverse(lat, lng);
      if (address) return NextResponse.json({ address });
    } catch {
      // 대체 검색으로
    }
  }
  try {
    const params = new URLSearchParams({
      lat: lat.toFixed(5),
      lon: lng.toFixed(5),
      format: "jsonv2",
      "accept-language": "ko",
      zoom: "18",
    });
    const data = await cached(`r:${lat.toFixed(4)},${lng.toFixed(4)}`, 10 * 60_000, () =>
      osmFetch(`${NOMINATIM}/reverse?${params}`) as Promise<{ display_name?: string }>,
    );
    return NextResponse.json({
      address: data.display_name ? shortAddress(data.display_name) : null,
    });
  } catch {
    return NextResponse.json({ address: null });
  }
}
