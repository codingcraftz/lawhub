"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";

const PasswordAutoLogin = () => {
  const router = useRouter();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get("email");
    const tempPassword = urlParams.get("tempPassword");

    const autoLogin = async () => {
      if (email && tempPassword) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: tempPassword,
        });

        if (error) {
          console.error("Auto-login error:", error);
          router.push("/login");
        } else {
          router.push("/update-password"); // 로그인 성공 시 비밀번호 업데이트 페이지로 이동
        }
      } else {
        router.push("/login"); // 필수 매개변수가 없으면 로그인 페이지로 이동
      }
    };

    autoLogin();
  }, [router]);

  return null; // 로딩 상태 또는 스피너를 표시할 수도 있음
};

export default PasswordAutoLogin;
