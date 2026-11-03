import { NextRequest, NextResponse } from "next/server";
import { validTripId } from "@/lib/server/arrivalReminder";
import { cancelDepartureReminders, scheduleDepartureReminders, validLeaveTime } from "@/lib/server/departureReminder";
import { validToken } from "@/lib/server/pushStore";

/** 앱이 열려 있지 않아도 푸시를 받으려면 서버가 접속할 수 있는 이 서비스의 주소가 필요하다. */
const baseUrl = (req: NextRequest) =>
  process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : req.nextUrl.origin;

const MAX_AHEAD_MS = 3 * 24 * 3600_000;

/** POST /api/push/departure { token, tripId, leaveAtMs, leaveTime } → 출발 1시간 전·출발 시각 알림 예약 */
export async function POST(req: NextRequest) {
  const b = (await req.json().catch(() => null)) as {
    token?: unknown;
    tripId?: unknown;
    leaveAtMs?: unknown;
    leaveTime?: unknown;
  } | null;
  const leaveAtMs = Number(b?.leaveAtMs);
  if (
    !validToken(b?.token) ||
    !validTripId(b?.tripId) ||
    !validLeaveTime(b?.leaveTime) ||
    !(leaveAtMs > Date.now() && leaveAtMs < Date.now() + MAX_AHEAD_MS)
  ) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  try {
    await scheduleDepartureReminders({
      token: b.token,
      tripId: b.tripId,
      leaveAtMs,
      leaveTime: b.leaveTime,
      baseUrl: baseUrl(req),
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "schedule_failed" }, { status: 500 });
  }
}

/** DELETE /api/push/departure { tripId } → 예약 취소 */
export async function DELETE(req: NextRequest) {
  const b = (await req.json().catch(() => null)) as { tripId?: unknown } | null;
  if (!validTripId(b?.tripId)) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  try {
    await cancelDepartureReminders(b.tripId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "cancel_failed" }, { status: 500 });
  }
}
