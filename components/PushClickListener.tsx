"use client";

import { useEffect } from "react";

/**
 * 앱이 이미 열려 있을 때 알림을 누르면, 서비스 워커가 알림이 가리키는 주소를 메시지로 알려 준다.
 * 그 주소(/?trip=<id>)로 이동해 Planner가 출발 안내를 열고 "도착 푸시로 들어옴"을 기록하게 한다. 화면에는 아무것도 그리지 않는다.
 */
export default function PushClickListener() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onMessage = (e: MessageEvent) => {
      const data = e.data as { type?: string; url?: unknown } | null;
      if (data?.type !== "j-push-click" || typeof data.url !== "string") return;
      // 같은 사이트 안의 주소만 따른다.
      const target = new URL(data.url, window.location.origin);
      if (target.origin !== window.location.origin) return;
      window.location.assign(target.pathname + target.search);
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, []);
  return null;
}
