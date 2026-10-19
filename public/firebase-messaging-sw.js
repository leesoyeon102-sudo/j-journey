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

// 알림을 누르면 앱을 열거나, 이미 열려 있으면 그 창으로 간다.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ("focus" in c) return c.focus().then((w) => (w && "navigate" in w ? w.navigate(url) : w));
      }
      return clients.openWindow(url);
    }),
  );
});
