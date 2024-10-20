// src/app/api/deleteUser/route.js

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabaseAdmin";

export async function POST(request) {
  try {
    const { id } = await request.json();

    // 사용자 삭제
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (error) throw error;

    // users 테이블에서 사용자 삭제
    const { error: userError } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", id);

    if (userError) throw userError;

    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
