import { NextRequest, NextResponse } from "next/server";
import { cancelArrivalReminder, scheduleArrivalReminder, validTripId } from "@/lib/server/arrivalReminder";
import { validToken } from "@/lib/server/pushStore";

/** 앱이 열려 있지 않아도 푸시를 받으려면 서버가 접속할 수 있는 이 서비스의 주소가 필요하다. */
const baseUrl = (req: NextRequest) =>
  process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : req.nextUrl.origin;

/** POST /api/push/reminder { token, tripId, delayMin } → 소요 시간(분) 뒤 도착 확인 알림 예약 */
export async function POST(req: NextRequest) {
  const b = (await req.json().catch(() => null)) as { token?: unknown; tripId?: unknown; delayMin?: unknown } | null;
  const delayMin = Number(b?.delayMin);
  if (!validToken(b?.token) || !validTripId(b?.tripId) || !(delayMin >= 1 && delayMin <= 360)) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  try {
    await scheduleArrivalReminder({ token: b.token, tripId: b.tripId, delaySec: delayMin * 60, baseUrl: baseUrl(req) });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "schedule_failed" }, { status: 500 });
  }
}

/** DELETE /api/push/reminder { tripId } → 예약 취소 */
export async function DELETE(req: NextRequest) {
  const b = (await req.json().catch(() => null)) as { tripId?: unknown } | null;
  if (!validTripId(b?.tripId)) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  try {
    await cancelArrivalReminder(b.tripId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "cancel_failed" }, { status: 500 });
  }
}
