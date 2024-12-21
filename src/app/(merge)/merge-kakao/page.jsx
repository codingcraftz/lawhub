"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";

export default function MergeKakaoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [oldUserId, setOldUserId] = useState(null);

  // 클라이언트 측에서 현재 로그인한(이메일 로그인) 사용자 정보를 가져옴
  useEffect(() => {
    const fetchSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (session && session.user) {
        // 이메일 로그인 user id
        setOldUserId(session.user.id);
      } else {
        // 만약 로그인 세션이 없다면, 메인 혹은 로그인 페이지로 이동
        router.push("/");
      }
    };

    fetchSession();
  }, [router]);

  const handleKakaoMerge = async () => {
    if (!oldUserId) {
      alert("기존 이메일 로그인 상태가 아닙니다.");
      return;
    }
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: {
          scopes:
            "profile_nickname profile_image account_email name gender birthday birthyear phone_number",
          redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/merge-complete?oldUserId=${oldUserId}`,
        },
      });
      if (error) {
        console.error("Kakao login failed:", error.message);
        alert("카카오 로그인에 실패했습니다.");
      }
    } catch (err) {
      console.error("Unexpected error during Kakao login:", err);
      alert("카카오 로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-2 flex-1">
      <h1 className="text-2xl font-bold mb-6">카카오 계정 병합</h1>
      <p className="text-center mb-6 text-gray-12">
        이메일 로그인이 완료되었습니다.
      </p>
      <p className="text-center mb-6 text-gray-12">
        계정 병합을 위하여 아래 버튼을 클릭하여 카카오 로그인을 진행해주세요.
      </p>
      <button
        onClick={handleKakaoMerge}
        className="py-2 px-4 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-400 disabled:opacity-70"
        disabled={loading}
      >
        {loading ? "카카오 로그인 중..." : "카카오 로그인 진행"}
      </button>
    </div>
  );
}
