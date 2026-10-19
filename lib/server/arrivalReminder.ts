import { Client } from "@upstash/qstash";
import { Redis } from "@upstash/redis";
import { sendPush } from "./fcm";
import { removeToken } from "./pushStore";

// "출발했어요"를 누른 뒤 소요 시간이 지나면 "도착하셨나요?" 알림을 보낸다.
// 정해진 시각에 한 번 실행되는 예약은 QStash가 맡고, 예약이 아직 유효한지는 Redis에 적어 둔다.

const redis = () => Redis.fromEnv();
const key = (tripId: string) => `push:reminder:${tripId}`;
/** 안내 하나가 끝나기에 충분한 시간(초). 이 뒤에는 기록이 저절로 지워진다. */
const KEEP_SEC = 8 * 3600;

interface Reminder {
  token: string;
  messageId: string;
}

export const validTripId = (t: unknown): t is string => typeof t === "string" && /^[\w-]{8,64}$/.test(t);

/** 소요 시간이 지난 뒤 도착 확인 알림을 예약한다. 같은 안내에 이미 예약이 있으면 새 예약으로 바꾼다. */
export async function scheduleArrivalReminder(opts: { token: string; tripId: string; delaySec: number; baseUrl: string }) {
  await cancelArrivalReminder(opts.tripId);
  const qstash = new Client({ token: process.env.QSTASH_TOKEN ?? "" });
  const { messageId } = await qstash.publishJSON({
    url: `${opts.baseUrl}/api/push/send`,
    body: { tripId: opts.tripId },
    delay: Math.max(1, Math.round(opts.delaySec)),
  });
  const value: Reminder = { token: opts.token, messageId };
  await redis().set(key(opts.tripId), value, { ex: KEEP_SEC });
}

/** 예약을 취소한다. (도착을 눌렀거나 출발을 취소했을 때) */
export async function cancelArrivalReminder(tripId: string) {
  const r = await redis().get<Reminder>(key(tripId));
  if (!r) return;
  await redis().del(key(tripId));
  await new Client({ token: process.env.QSTASH_TOKEN ?? "" }).messages.cancel(r.messageId).catch(() => {});
}

/** 예약 시각이 되면 QStash가 부른다. 아직 유효한 예약이면 알림을 보낸다. */
export async function deliverArrivalReminder(tripId: string): Promise<"sent" | "skipped"> {
  const r = await redis().get<Reminder>(key(tripId));
  if (!r) return "skipped"; // 이미 취소됐거나 보냈다.
  const result = await sendPush({
    token: r.token,
    title: "약속 장소에 잘 도착하셨나요?",
    body: "'도착했어요'만 누르면 오늘 외출 기록이 완성돼요.",
    url: "/",
  });
  await redis().del(key(tripId));
  if (result === "gone") {
    await removeToken(r.token);
    return "skipped";
  }
  return "sent";
}
