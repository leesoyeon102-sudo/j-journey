import { NextRequest, NextResponse } from "next/server";
import { removeToken, saveToken, validToken } from "@/lib/server/pushStore";

/** POST /api/push/subscribe { token } → 이 기기를 알림 대상으로 저장 */
export async function POST(req: NextRequest) {
  const b = (await req.json().catch(() => null)) as { token?: unknown } | null;
  if (!validToken(b?.token)) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  try {
    await saveToken(b.token);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "store_failed" }, { status: 500 });
  }
}

/** DELETE /api/push/subscribe { token } → 알림 대상에서 뺀다 */
export async function DELETE(req: NextRequest) {
  const b = (await req.json().catch(() => null)) as { token?: unknown } | null;
  if (!validToken(b?.token)) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  try {
    await removeToken(b.token);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "store_failed" }, { status: 500 });
  }
}
