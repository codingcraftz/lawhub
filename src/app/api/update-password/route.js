// src/app/api/update-password/route.js

import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(req) {
  const { email, newPassword } = await req.json();

  if (!email || !newPassword) {
    return new Response(
      JSON.stringify({ error: "Email and new password are required" }),
      { status: 400 },
    );
  }

  // Supabase Admin API를 사용하여 비밀번호 업데이트
  const { data, error } = await supabaseAdmin.auth.admin.updateUserByEmail(
    email,
    { password: newPassword },
  );

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
    });
  }

  return new Response(
    JSON.stringify({ message: "Password updated successfully" }),
    { status: 200 },
  );
}
