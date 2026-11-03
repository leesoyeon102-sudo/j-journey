import { Client } from "@upstash/qstash";
import { Redis } from "@upstash/redis";
import { sendPush } from "./fcm";
import { removeToken } from "./pushStore";

// "외출 예약하기"를 누르면 출발 1시간 전과 출발 시각에 알림을 한 번씩 보낸다.
// 정해진 시각에 실행되는 예약은 QStash가 맡고, 예약이 아직 유효한지는 Redis에 적어 둔다. (arrivalReminder와 같은 방식)

export type DepartureKind = "before" | "depart";

const redis = () => Redis.fromEnv();
const key = (tripId: string) => `push:departure:${tripId}`;
/** 예약은 최대 사흘 앞까지. 이 뒤에는 기록이 저절로 지워진다. */
const KEEP_SEC = 3 * 24 * 3600;
const BEFORE_MIN = 60;

interface Reservation {
  token: string;
  /** "HH:MM" 안내에 적을 출발 시각 */
  leaveTime: string;
  messageIds: string[];
}

export const validLeaveTime = (t: unknown): t is string => typeof t === "string" && /^\d{2}:\d{2}$/.test(t);

const qstash = () => new Client({ token: process.env.QSTASH_TOKEN ?? "" });

/** 출발 1시간 전과 출발 시각 알림을 예약한다. 이미 지난 시각의 알림은 건너뛴다. 같은 안내에 예약이 있으면 새 예약으로 바꾼다. */
export async function scheduleDepartureReminders(opts: {
  token: string;
  tripId: string;
  leaveAtMs: number;
  leaveTime: string;
  baseUrl: string;
}) {
  await cancelDepartureReminders(opts.tripId);
  const now = Date.now();
  const messageIds: string[] = [];
  const plan: [DepartureKind, number][] = [
    ["before", opts.leaveAtMs - BEFORE_MIN * 60_000],
    ["depart", opts.leaveAtMs],
  ];
  for (const [kind, at] of plan) {
    const delay = Math.round((at - now) / 1000);
    if (delay < 1) continue;
    const { messageId } = await qstash().publishJSON({
      url: `${opts.baseUrl}/api/push/send`,
      body: { tripId: opts.tripId, kind },
      delay,
    });
    messageIds.push(messageId);
  }
  const value: Reservation = { token: opts.token, leaveTime: opts.leaveTime, messageIds };
  await redis().set(key(opts.tripId), value, { ex: KEEP_SEC });
}

/** 예약을 취소한다. (예약을 취소했거나, 예약 시각 전에 직접 출발했을 때) */
export async function cancelDepartureReminders(tripId: string) {
  const r = await redis().get<Reservation>(key(tripId));
  if (!r) return;
  await redis().del(key(tripId));
  await Promise.all(r.messageIds.map((id) => qstash().messages.cancel(id).catch(() => {})));
}

/** 예약 시각이 되면 QStash가 부른다. 아직 유효한 예약이면 알림을 보낸다. 알림을 누르면 예약했던 경로의 출발 안내 화면이 열린다. */
export async function deliverDepartureReminder(tripId: string, kind: DepartureKind): Promise<"sent" | "skipped"> {
  const r = await redis().get<Reservation>(key(tripId));
  if (!r) return "skipped"; // 이미 취소됐거나 직접 출발했다.
  const message =
    kind === "before"
      ? {
          title: `오늘 외출 출발 시각은 ${r.leaveTime}입니다 🚶`,
          body: "눌러서 경로를 미리 확인해 보세요.",
        }
      : {
          title: "지금 출발하세요! 🏃",
          body: "눌러서 출발 안내를 확인해 주세요.",
        };
  const result = await sendPush({ ...message, token: r.token, url: `/?trip=${tripId}&push=${kind}` });
  if (kind === "depart") await redis().del(key(tripId));
  if (result === "gone") {
    await removeToken(r.token);
    return "skipped";
  }
  return "sent";
}
