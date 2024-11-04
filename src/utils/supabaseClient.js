// src/utils/supabaseClient.js

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase URL 또는 Anon Key가 없습니다. 환경 변수가 올바르게 설정되었는지 확인하세요.",
  );
}

// 클라이언트 사이드에서 사용하기 위한 Supabase 클라이언트 생성
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
