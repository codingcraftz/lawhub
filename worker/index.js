self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push Received.");
  let data = {
    title: "새로운 알림",
    body: "내용 없음",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
  };

  try {
    data = event.data ? event.data.json() : data;
  } catch (error) {
    console.error("Error parsing push data:", error);
  }

  const { title, body, icon, badge } = data;
  const options = {
    body,
    icon,
    badge,
    tag: "notification-tag", // 동일 태그로 알림 중복 방지
    data: { url: data.url || "/" }, // 알림 클릭 시 사용할 URL
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] notificationclick");
  event.notification.close();

  const urlToOpen = event.notification.data.url;
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && "focus" in client)
          return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(urlToOpen);
    }),
  );
});
