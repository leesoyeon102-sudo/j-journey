import { NextRequest, NextResponse } from "next/server";
import { cached, NOMINATIM, osmFetch, shortAddress } from "@/lib/server/osm";

interface NominatimItem {
  name?: string;
  display_name: string;
  lat: string;
  lon: string;
}

/** GET /api/geocode?q=장소·주소 → 수도권 안의 후보 목록 */
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2 || q.length > 100) {
    return NextResponse.json({ results: [] });
  }
  try {
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
    const results = items.map((it) => ({
      name: it.name || shortAddress(it.display_name).split(" ")[0],
      address: shortAddress(it.display_name),
      lat: Number(it.lat),
      lng: Number(it.lon),
    }));
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [], error: "search_failed" }, { status: 502 });
  }
}
