import { enablePush } from "./firebase";

// 이 기기의 푸시 주소(토큰)는 알림을 허용할 때 한 번 받아 브라우저에 기억해 둔다.
const TOKEN_KEY = "j-outing:push-token";

const readToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

const post = (url: string, method: "POST" | "DELETE", body: unknown) =>
  fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);

/** 알림 허용 창을 띄우고, 허용하면 푸시 주소를 서버와 이 브라우저에 저장한다. */
export async function askPush(): Promise<boolean> {
  const r = await enablePush();
  if (!r.ok) return false;
  const res = await post("/api/push/subscribe", "POST", { token: r.token });
  if (!res?.ok) return false;
  try {
    localStorage.setItem(TOKEN_KEY, r.token);
  } catch {
    // 저장이 막혀도 이번 한 번은 예약할 수 있다.
  }
  return true;
}

/**
 * 소요 시간(분) 뒤 "도착하셨나요?" 알림을 예약한다. 출발했어요를 누를 때 부른다.
 * 아직 허용 여부를 고르지 않았다면 이때 허용 창을 띄운다. (반드시 버튼 클릭 안에서 불러야 창이 뜬다)
 * 거절했거나 지원하지 않는 브라우저면 아무것도 하지 않는다.
 */
export async function scheduleArrivalReminder(tripId: string, delayMin: number) {
  if (typeof Notification === "undefined" || Notification.permission === "denied") return;
  // 허용을 처음 받거나, 허용은 했는데 이 브라우저에 푸시 주소가 없으면 받아서 저장한다.
  if (!readToken() && !(await askPush())) return;
  const token = readToken();
  if (!token) return;
  await post("/api/push/reminder", "POST", { token, tripId, delayMin });
}

/** 예약된 알림을 취소한다. (도착했거나 출발을 취소했을 때) */
export async function cancelArrivalReminder(tripId: string) {
  if (!readToken()) return;
  await post("/api/push/reminder", "DELETE", { tripId });
}
