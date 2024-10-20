import { createClient } from "@supabase/supabase-js";

// 클라이언트 전용 키
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL or Anon Key is missing. Please ensure that environment variables are set.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
