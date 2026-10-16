import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

// 서버에서 푸시를 보낼 때 쓰는 Firebase 서비스 계정. 값은 Vercel 환경변수(FIREBASE_SERVICE_ACCOUNT, JSON 통째로)에만 둔다.
function app() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT is not set");
  return getApps()[0] ?? initializeApp({ credential: cert(JSON.parse(raw)) });
}

export interface PushMessage {
  token: string;
  title: string;
  body: string;
  /** 알림을 누르면 열 주소(경로) */
  url?: string;
}

/** 푸시 하나를 보낸다. 토큰이 더 이상 유효하지 않으면 "gone"을 돌려준다. */
export async function sendPush(m: PushMessage): Promise<"sent" | "gone"> {
  try {
    await getMessaging(app()).send({
      token: m.token,
      notification: { title: m.title, body: m.body },
      webpush: {
        notification: { icon: "/icons/icon-192.png" },
        fcmOptions: { link: m.url ?? "/" },
      },
    });
    return "sent";
  } catch (e) {
    const code = (e as { code?: string }).code ?? "";
    if (code === "messaging/registration-token-not-registered" || code === "messaging/invalid-registration-token") {
      return "gone";
    }
    throw e;
  }
}
