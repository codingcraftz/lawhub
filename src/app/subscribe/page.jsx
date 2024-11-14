"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { useUser } from "@/hooks/useUser";

export default function NotificationSettings() {
  const [permissionStatus, setPermissionStatus] = useState("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { user } = useUser();

  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // iOS 설치 유도 확인
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    if (isIOS && !localStorage.getItem("iosInstalled")) {
      setShowInstallPrompt(true);
    }
  }, []);

  useEffect(() => {
    // 브라우저 알림 권한 상태 설정
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermissionStatus(Notification.permission);
    }
    checkSubscription();
  }, [user]);

  // DB에서 현재 사용자 구독 상태 확인
  const checkSubscription = async () => {
    const { data, error } = await supabase
      .from("notifications_subscriptions")
      .select("*")
      .eq("user_id", user?.id)
      .single();

    setIsSubscribed(!!data && !error);
  };

  // Step 1: 브라우저 알림 권한 요청
  const requestPermission = async () => {
    const permission = await Notification.requestPermission();
    setPermissionStatus(permission);
  };

  // Step 2: 알림 구독 등록 (DB 저장)
  const subscribeToNotifications = async () => {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      const { error } = await supabase
        .from("notifications_subscriptions")
        .insert([{ user_id: user.id, subscription }]);

      if (!error) {
        setIsSubscribed(true);
        alert("알림 구독이 활성화되었습니다.");
      } else {
        alert("구독 정보를 저장하는 중 오류가 발생했습니다.");
      }
    }
  };

  // Step 2: 알림 구독 취소 (DB 삭제)
  const unsubscribeFromNotifications = async () => {
    const { error } = await supabase
      .from("notifications_subscriptions")
      .delete()
      .eq("user_id", user.id);

    if (!error) {
      setIsSubscribed(false);
      alert("알림 구독이 비활성화되었습니다.");
    } else {
      alert("구독을 취소하는 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6 p-6 bg-gray-100 rounded-lg shadow-lg max-w-md mx-auto mt-8">
      {showInstallPrompt && (
        <AppInstallPrompt onDismiss={() => setShowInstallPrompt(false)} />
      )}
      <h1 className="text-2xl font-bold text-gray-800 mb-4">알림 설정</h1>

      {/* Step 1: 브라우저 알림 권한 요청 */}
      <div className="w-full bg-white p-4 rounded-lg shadow-md">
        <p className="text-lg font-semibold text-gray-700 mb-2">
          Step 1: 브라우저 알림 권한 설정
        </p>
        <button
          onClick={requestPermission}
          disabled={permissionStatus === "granted"}
          className={`w-full py-2 rounded-md font-semibold transition-colors ${
            permissionStatus === "granted"
              ? "bg-green-500 text-white cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600 text-white"
          }`}
        >
          {permissionStatus === "granted" ? "완료됨" : "권한 요청하기"}
        </button>
      </div>

      {/* Step 2: 알림 구독 설정 */}
      <div className="w-full bg-white p-4 rounded-lg shadow-md">
        <p className="text-lg font-semibold text-gray-700 mb-2">
          Step 2: 알림 구독
        </p>
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
        )
      </div>
    </div>
  );
}
