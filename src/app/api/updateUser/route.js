// src/app/api/updateUser/route.js

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabaseAdmin";

export async function POST(request) {
  try {
    const { id, name, phone_number, birth_date, gender, role, is_active } =
      await request.json();

    // users 테이블 업데이트
    const { error: userError } = await supabaseAdmin
      .from("users")
      .update({ name, phone_number, birth_date, gender, role, is_active })
      .eq("id", id);

    if (userError) throw userError;

    return NextResponse.json(
      { message: "User updated successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
