"use client";

import React, { useState, useEffect } from "react";

export default function NotificationPermission({ user_id }) {
  const [permissionStatus, setPermissionStatus] = useState("default");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const requestPermissionAndSubscribe = async () => {
    const permission = await Notification.requestPermission();
    setPermissionStatus(permission);

    if (permission === "granted" && "serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      // 구독 정보를 저장하는 요청
      await fetch("/api/saveSubscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription, user_id }),
      });
    }
  };

  return (
    <div>
      <h1>알림 권한 요청</h1>
      <p>현재 권한 상태: {permissionStatus}</p>
      <button onClick={requestPermissionAndSubscribe}>
        알림 권한 요청 및 구독
      </button>
    </div>
  );
}
