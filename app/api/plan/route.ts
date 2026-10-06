import { NextRequest, NextResponse } from "next/server";
import { computePlans } from "@/lib/server/plan";
import { inKorea } from "@/lib/server/osm";

const validPlace = (p: unknown) => {
  const q = p as { name?: unknown; area?: unknown; lat?: unknown; lng?: unknown };
  return (
    typeof q === "object" &&
    q !== null &&
    typeof q.name === "string" &&
    q.name.length <= 100 &&
    typeof q.lat === "number" &&
    typeof q.lng === "number" &&
    inKorea(q.lat, q.lng)
  );
};

/**
 * POST /api/plan
 * { origin, destination, arriveBy(분), buffer(분), date("YYYY-MM-DD") } → PlanResult
 */
export async function POST(req: NextRequest) {
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (
    !validPlace(b.origin) ||
    !validPlace(b.destination) ||
    !Number.isInteger(b.arriveBy) ||
    (b.arriveBy as number) < 0 ||
    (b.arriveBy as number) >= 1440 ||
    !Number.isInteger(b.buffer) ||
    (b.buffer as number) < 0 ||
    (b.buffer as number) > 60 ||
    typeof b.date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(b.date)
  ) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  try {
    const o = b.origin as { name: string; area?: string; lat: number; lng: number };
    const d = b.destination as typeof o;
    const result = await computePlans(
      { name: o.name, area: String(o.area ?? ""), lat: o.lat, lng: o.lng },
      { name: d.name, area: String(d.area ?? ""), lat: d.lat, lng: d.lng },
      b.arriveBy as number,
      b.buffer as number,
      b.date,
    );
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "plan_failed" }, { status: 500 });
  }
}
