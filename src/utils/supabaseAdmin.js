import { createClient } from "@supabase/supabase-js";

// 서버 전용 키 - 클라이언트에서 접근 불가
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Supabase URL or Service Role Key is missing. Please ensure that environment variables are set.");
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
