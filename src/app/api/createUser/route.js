// src/app/api/createUser/route.js

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabaseAdmin";

export async function POST(request) {
  try {
    const { email, name, phone_number, birth_date, gender, role, is_active } =
      await request.json();

    // 임시 비밀번호 생성
    const tempPassword = Math.random().toString(36).slice(-8);

    // Supabase 인증에 사용자 추가
    const { data: authData, error: signUpError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
      });

    if (signUpError) throw signUpError;

    // 사용자 테이블에 정보 추가
    const { error: userError } = await supabaseAdmin.from("users").insert({
      id: authData.user.id,
      email,
      name,
      phone_number,
      birth_date,
      gender,
      role,
      is_active,
    });

    if (userError) throw userError;

    return NextResponse.json(
      { message: "User created successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
