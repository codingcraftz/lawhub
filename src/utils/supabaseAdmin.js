// src/utils/supabaseAdmin.js

import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // 서비스 역할 키
);

export { supabaseAdmin };
