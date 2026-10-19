// 앱이 닫혀 있어도 푸시 알림을 받아 주는 서비스 워커.
// 아래 설정값은 lib/firebase.ts와 같은 공개 값이다.
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyClUSouugqIWr_XG1feTFII4UTpXOYrBF8",
  projectId: "j-journey-30e96",
  messagingSenderId: "678345529434",
  appId: "1:678345529434:web:cf3caaa9417c842ed06063",
});

const messaging = firebase.messaging();

// 제목·내용(notification)이 담긴 푸시는 FCM이 알림을 직접 띄운다.
// 데이터만 담긴 푸시는 여기서 알림으로 바꿔 띄운다.
messaging.onBackgroundMessage((payload) => {
  if (payload.notification) return;
  const { title, body, url } = payload.data || {};
  self.registration.showNotification(title || "J의 외출", {
    body: body || "",
    icon: "/icons/icon-192.png",
    data: { url: url || "/" },
  });
});

// 알림을 누르면 앱을 열거나, 이미 열려 있으면 그 창을 앞으로 가져와 알림이 가리키는 주소를 알려 준다.
// 창이 열려 있을 때는 주소를 바꾸지 않고 메시지로 알리고(components/PushClickListener.tsx가 받아 이동한다),
// 닫혀 있으면 그 주소로 새로 연다. (?trip=<id>를 읽어 "도착 푸시로 들어옴"을 기록한다)
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (list) => {
      const open = list.find((c) => "focus" in c);
      if (!open) return clients.openWindow(url);
      const focused = await open.focus().catch(() => null);
      const target = focused || open;
      target.postMessage({ type: "j-push-click", url });
      return target;
    }),
  );
});
