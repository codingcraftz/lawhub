"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { useUser } from "@/hooks/useUser";

export default function NotificationPermission() {
  const [permissionStatus, setPermissionStatus] = useState("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermissionStatus(Notification.permission);
    }
    checkSubscription();
  }, [user]);

  const checkSubscription = async () => {
    const { data, error } = await supabase
      .from("notifications_subscriptions")
      .select("*")
      .eq("user_id", user?.id)
      .single();

    if (data) setIsSubscribed(true);
    if (error) setIsSubscribed(false);
  };

  const requestPermission = async () => {
    const permission = await Notification.requestPermission();
    setPermissionStatus(permission);
  };

  const subscribeToNotifications = async () => {
    if (permissionStatus !== "granted") {
      alert("알림 권한을 허용해야 합니다.");
      return;
    }

    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      const { error } = await supabase
        .from("notifications_subscriptions")
        .insert([{ user_id: user.id, subscription }]);

      if (error) {
        console.error("Error saving subscription:", error);
        alert("구독 정보를 저장하는 중 오류가 발생했습니다.");
      } else {
        setIsSubscribed(true);
        alert("알림 구독이 활성화되었습니다.");
      }
    }
  };

  const unsubscribeFromNotifications = async () => {
    const { error } = await supabase
      .from("notifications_subscriptions")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting subscription:", error);
      alert("구독을 취소하는 중 오류가 발생했습니다.");
    } else {
      setIsSubscribed(false);
      alert("알림 구독이 비활성화되었습니다.");
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <h1 className="text-2xl font-bold mb-4">알림 설정</h1>

      {/* Step 1: 권한 요청 */}
      <div className="w-full max-w-md flex flex-col items-center space-y-2">
        <h2 className="text-xl font-semibold">Step 1: 알림 권한 요청</h2>
        <button
          onClick={requestPermission}
          className={`w-full p-3 rounded ${
            permissionStatus === "granted"
              ? "bg-green-500 text-white cursor-not-allowed"
              : "bg-blue-500 text-white"
          }`}
          disabled={permissionStatus === "granted"}
        >
          {permissionStatus === "granted"
            ? "권한이 이미 허용되었습니다"
            : "알림 권한 요청하기"}
        </button>
      </div>

      {/* Step 2: 알림 구독 */}
      <div className="w-full max-w-md flex flex-col items-center space-y-2">
        <h2 className="text-xl font-semibold">Step 2: 알림 구독 동의</h2>
        <button
          onClick={
            isSubscribed
              ? unsubscribeFromNotifications
              : subscribeToNotifications
          }
          className={`w-full p-3 rounded ${
            permissionStatus !== "granted"
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : isSubscribed
                ? "bg-red-500 text-white"
                : "bg-blue-500 text-white"
          }`}
          disabled={permissionStatus !== "granted"}
        >
          {permissionStatus !== "granted"
            ? "먼저 Step 1을 완료해주세요"
            : isSubscribed
              ? "알림 수신 취소"
              : "알림 수신 동의"}
        </button>
      </div>
    </div>
  );
}
