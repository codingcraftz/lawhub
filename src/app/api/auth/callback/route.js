import { supabase } from "@/utils/supabase";
import { NextResponse } from "next/server";

export async function GET(req) {
  const session = supabase.auth.getSession();
  console.log(session);
  return NextResponse.redirect(
    new URL(
      `/${process.env.NEXT_PUBLIC_BASE_URL}/merge-complete?oldUserId=${oldUserId}`,
      req.url,
    ),
  );
}
