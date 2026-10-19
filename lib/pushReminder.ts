import * as amplitude from "@amplitude/analytics-browser";
import { enablePush } from "./firebase";

// 이 기기의 푸시 주소(토큰)는 알림을 허용할 때 한 번 받아 브라우저에 기억해 둔다.
const TOKEN_KEY = "j-outing:push-token";

// 사용자가 설정에서 알림을 직접 껐는지. 켜 둔 동안에는 출발했어요를 눌러도 알림을 예약하지 않는다.
const OFF_KEY = "j-outing:push-off";

const isOff = () => {
  try {
    return localStorage.getItem(OFF_KEY) === "1";
  } catch {
    return false;
  }
};

const setOff = (off: boolean) => {
  try {
    if (off) localStorage.setItem(OFF_KEY, "1");
    else localStorage.removeItem(OFF_KEY);
  } catch {
    // 저장이 막힌 환경에서는 이번 방문에서만 적용된다.
  }
};

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
 * 알림 허용 결과를 기록한다. 허용 창이 떴다면 그 결과이고, 이미 허용·거부 상태라 창이 안 떴다면 현재 상태다.
 * 허용 창을 닫기만 해서 아직 고르지 않은 상태(default)는 결과가 아니라 기록하지 않는다.
 */
function trackPermission(prompted: boolean, trigger: "departure" | "settings") {
  if (typeof Notification === "undefined") return;
  const p = Notification.permission;
  if (p === "default") return;
  amplitude.track("Notification Permission Result", { result: p === "granted" ? "granted" : "denied", prompted, trigger });
}

/**
 * 출발했어요를 눌렀을 때 알림 허용 안내 얼럿을 띄워야 하는지. 아직 허용 여부를 고르지 않은 최초 한 번만 true다.
 * 이미 허용·거부했거나 설정에서 껐다면 얼럿 없이 넘어간다.
 */
export function shouldAskPush(): boolean {
  if (typeof Notification === "undefined" || !("serviceWorker" in navigator)) return false;
  return Notification.permission === "default" && !isOff();
}

/**
 * 소요 시간(분) 뒤 "도착하셨나요?" 알림을 예약한다. 출발했어요를 누를 때 부른다.
 * 아직 허용 여부를 고르지 않았다면 이때 허용 창을 띄운다. (반드시 버튼 클릭 안에서 불러야 창이 뜬다)
 * 거절했거나 지원하지 않는 브라우저면 아무것도 하지 않는다.
 */
export async function scheduleArrivalReminder(tripId: string, delayMin: number) {
  if (typeof Notification === "undefined") return;
  const prompted = Notification.permission === "default";
  if (Notification.permission === "denied" || isOff()) {
    trackPermission(false, "departure");
    return;
  }
  // 허용을 처음 받거나, 허용은 했는데 이 브라우저에 푸시 주소가 없으면 받아서 저장한다.
  const registered = readToken() ? true : await askPush();
  trackPermission(prompted, "departure");
  if (!registered) return;
  const token = readToken();
  if (!token) return;
  await post("/api/push/reminder", "POST", { token, tripId, delayMin });
}

/** 예약된 알림을 취소한다. (도착했거나 출발을 취소했을 때) */
export async function cancelArrivalReminder(tripId: string) {
  if (!readToken()) return;
  await post("/api/push/reminder", "DELETE", { tripId });
}

/** 설정 화면의 알림 토글 상태. denied는 브라우저·기기 설정에서만 다시 켤 수 있다. */
export type PushState = "on" | "off" | "denied" | "unsupported";

export function readPushState(): PushState {
  if (typeof Notification === "undefined" || !("serviceWorker" in navigator)) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  return Notification.permission === "granted" && readToken() && !isOff() ? "on" : "off";
}

/** 알림을 켠다. 아직 허용하지 않았다면 허용 창이 뜬다. (버튼 클릭 안에서 불러야 한다) */
export async function turnOnPush(): Promise<PushState> {
  setOff(false);
  const prompted = typeof Notification !== "undefined" && Notification.permission === "default";
  await askPush();
  trackPermission(prompted, "settings");
  return readPushState();
}

/** 알림을 끈다. 이 기기를 알림 대상에서 빼고 저장된 푸시 주소를 지운다. (브라우저의 허용 상태는 그대로다) */
export async function turnOffPush(): Promise<PushState> {
  setOff(true);
  const token = readToken();
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // 지울 수 없어도 꺼짐 표시(OFF_KEY)가 있어 예약하지 않는다.
  }
  if (token) await post("/api/push/subscribe", "DELETE", { token });
  return readPushState();
}

// 도착 푸시를 눌러 연 안내의 id. 도착을 누를 때까지(화면을 옮기거나 새로고침해도) 남겨 두어 도착 기록의 source를 가린다.
const PUSH_OPENED_KEY = "j-outing:push-opened";

export function markPushOpened(tripId: string) {
  try {
    localStorage.setItem(PUSH_OPENED_KEY, tripId);
  } catch {
    // 저장이 막힌 환경에서는 Planner가 메모리에 둔 값으로만 가린다.
  }
}

export function wasPushOpened(tripId: string): boolean {
  try {
    return localStorage.getItem(PUSH_OPENED_KEY) === tripId;
  } catch {
    return false;
  }
}

export function clearPushOpened(tripId: string) {
  try {
    if (localStorage.getItem(PUSH_OPENED_KEY) === tripId) localStorage.removeItem(PUSH_OPENED_KEY);
  } catch {
    // 지울 수 없어도 다음 안내 id와 달라 영향이 없다.
  }
}
