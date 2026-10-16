import { Receiver } from "@upstash/qstash";
import { NextRequest, NextResponse } from "next/server";
import { deliverArrivalReminder, validTripId } from "@/lib/server/arrivalReminder";

/** QStash가 예약 시각에 부른다. QStash가 서명한 요청만 받는다. */
export async function POST(req: NextRequest) {
  const current = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const next = process.env.QSTASH_NEXT_SIGNING_KEY;
  if (!current || !next) return NextResponse.json({ error: "not_configured" }, { status: 500 });

  const body = await req.text();
  const signature = req.headers.get("upstash-signature") ?? "";
  const ok = await new Receiver({ currentSigningKey: current, nextSigningKey: next })
    .verify({ signature, body })
    .catch(() => false);
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let tripId: unknown;
  try {
    tripId = (JSON.parse(body) as { tripId?: unknown }).tripId;
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (!validTripId(tripId)) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  try {
    return NextResponse.json({ ok: true, result: await deliverArrivalReminder(tripId) });
  } catch {
    // 일시적인 오류면 QStash가 다시 부른다.
    return NextResponse.json({ error: "send_failed" }, { status: 500 });
  }
}
