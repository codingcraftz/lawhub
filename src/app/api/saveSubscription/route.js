// src/app/api/saveSubscription/route.js

import { supabase } from "@/utils/supabase";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { subscription, user_id } = await request.json();

    // 기존 구독 정보 삭제
    await supabase
      .from("notifications_subscriptions")
      .delete()
      .eq("user_id", user_id);

    // 새 구독 정보 저장
    const { error } = await supabase
      .from("notifications_subscriptions")
      .insert([{ user_id, subscription }]);

    if (error) throw error;

    return NextResponse.json(
      { message: "Subscription saved successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error saving subscription:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
