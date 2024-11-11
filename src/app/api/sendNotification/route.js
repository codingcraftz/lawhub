// src/app/api/sendNotification/route.js

import { supabase } from "@/utils/supabase";
import { NextResponse } from "next/server";
import webpush from "web-push";

webpush.setVapidDetails(
  "mailto:example@yourdomain.org",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

export async function POST(request) {
  try {
    const { user_id, title, message } = await request.json();

    // Supabase에서 사용자의 구독 정보 가져오기
    const { data: subscriptions, error } = await supabase
      .from("notifications_subscriptions")
      .select("subscription")
      .eq("user_id", user_id);

    if (error) throw error;

    const payload = JSON.stringify({ title, message });

    // 모든 구독 정보에 대해 푸시 알림 전송
    await Promise.all(
      subscriptions.map(async ({ subscription }) => {
        await webpush.sendNotification(subscription, payload);
      }),
    );

    return NextResponse.json(
      { message: "Notification sent successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error sending notification:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
