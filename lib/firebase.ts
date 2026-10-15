import { getApps, initializeApp } from "firebase/app";

// 웹 앱 설정값. 화면에 그대로 나가는 공개 값이라 코드에 둔다. (비밀 키는 서버 환경변수에만 둔다)
// public/firebase-messaging-sw.js에도 같은 값이 들어 있으니 바꾸면 둘 다 고친다.
export const firebaseConfig = {
  apiKey: "AIzaSyClUSouugqIWr_XG1feTFII4UTpXOYrBF8",
  projectId: "j-journey-30e96",
  messagingSenderId: "678345529434",
  appId: "1:678345529434:web:cf3caaa9417c842ed06063",
};

/** 푸시용 키(VAPID 공개 키) */
export const VAPID_KEY =
  "BHKo-2M8FGsewokJwcEfPIOTw1_oPzhEo0c1rKl88G7P8EqCYu6rK2GzU2xBBjOp69X3fLid7VdVRYLi5q7MIDM";

export const SW_URL = "/firebase-messaging-sw.js";

export const firebaseApp = () => getApps()[0] ?? initializeApp(firebaseConfig);

export type PushResult =
  | { ok: true; token: string }
  | { ok: false; reason: "unsupported" | "denied" | "error"; message?: string };

/** 알림 허용 창을 띄우고, 허용하면 이 폰(브라우저)의 푸시 주소(토큰)를 돌려준다. */
export async function enablePush(): Promise<PushResult> {
  const { getMessaging, getToken, isSupported } = await import("firebase/messaging");
  if (!(await isSupported())) return { ok: false, reason: "unsupported" };
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, reason: "denied" };
  try {
    const registration = await navigator.serviceWorker.register(SW_URL);
    await navigator.serviceWorker.ready;
    const token = await getToken(getMessaging(firebaseApp()), {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    return token ? { ok: true, token } : { ok: false, reason: "error", message: "토큰이 비어 있어요" };
  } catch (e) {
    return { ok: false, reason: "error", message: e instanceof Error ? e.message : String(e) };
  }
}

/** 앱이 열려 있는 동안 받은 푸시를 알려 준다. (닫혀 있을 때는 서비스 워커가 알림을 띄운다) */
export async function onForegroundPush(cb: (title: string, body: string) => void) {
  const { getMessaging, onMessage } = await import("firebase/messaging");
  return onMessage(getMessaging(firebaseApp()), (p) => cb(p.notification?.title ?? "", p.notification?.body ?? ""));
}
