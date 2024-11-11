// public/sw.js

import { clientsClaim } from "workbox-core";
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkFirst } from "workbox-strategies";

clientsClaim();
self.skipWaiting();

precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  "/",
  new NetworkFirst({
    cacheName: "start-url",
  }),
);

// 푸시 알림 이벤트 핸들러 추가
self.addEventListener("push", function (event) {
  const data = event.data.json();
  const title = data.title || "새로운 알림";
  const options = {
    body: data.message || "알림 내용",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});
