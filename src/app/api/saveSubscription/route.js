// src/app/api/saveSubscription/route.js

import { supabase } from "@/utils/supabase";
import { NextResponse } from "next/server";

export async function POST(request) {
  const { subscription, user_id } = await request.json();

  // 구독 정보를 간단히 Supabase에 저장
  const { error } = await supabase
    .from("notifications_subscriptions")
    .insert([{ user_id, subscription }]);

  if (error) {
    console.error("Error saving subscription:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { message: "Subscription saved successfully" },
    { status: 200 },
  );
}
