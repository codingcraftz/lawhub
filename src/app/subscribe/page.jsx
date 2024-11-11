"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase"; // Supabase 클라이언트 설정을 가져옵니다.
import { useUser } from "@/hooks/useUser";

export default function NotificationPermission() {
  const [permissionStatus, setPermissionStatus] = useState("default");
  const { user } = useUser();

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

      // Supabase 클라이언트를 통해 구독 정보 직접 삽입
      const { error } = await supabase
        .from("notifications_subscriptions")
        .insert([{ user_id: user.id, subscription }]);

      if (error) {
        console.error("Error saving subscription:", error);
        alert("구독 정보를 저장하는 중 오류가 발생했습니다.");
      } else {
        alert("구독 정보가 성공적으로 저장되었습니다.");
      }
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
