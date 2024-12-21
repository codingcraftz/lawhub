"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { Spinner } from "@radix-ui/themes";

export default function MergeCompletePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oldUserId = searchParams.get("oldUserId");
  const [message, setMessage] = useState("카카오 계정 병합 처리 중입니다...");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const doMerge = async () => {
      setIsLoading(true);
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;
        if (!session || !session.user) {
          throw new Error("카카오 로그인 세션을 찾을 수 없습니다.");
        }

        const newUserId = session.user.id; // 카카오 OAuth로 로그인된 user id

        if (!oldUserId) {
          setMessage("병합 정보가 없습니다. 메인 페이지로 이동합니다.");
          setTimeout(() => router.push("/"), 3000);
          return;
        }

        // 만약 newUserId === oldUserId 라면, 이미 동일한 계정으로 인정된 것
        if (newUserId === oldUserId) {
          setMessage("이미 처리되었습니다. 메인 페이지로 이동합니다.");
          setTimeout(() => router.push("/"), 3000);
          return;
        }
        const res = await fetch("/api/merge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            oldUserId,
            newUserId,
          }),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Merge API Error");
        }

        setMessage("완료되었습니다! 메인 페이지로 이동합니다.");
        setIsLoading(false);
        setTimeout(() => router.push("/"), 3000);
      } catch (err) {
        console.error("doMerge Error:", err);
        setMessage(`병합 중 오류가 발생했습니다: ${err.message}`);
      }
    };

    doMerge();
  }, [oldUserId, router]);

  return (
    <div className="h-screen flex flex-col items-center justify-center flex-1">
      <h2 className="text-xl mb-4">이메일과 카카오계정 병합을 진행중입니다.</h2>
      <p className="text-lg p-2 text-red-500">
        페이지를 나가지말고 잠시만 기다려주세요.
      </p>
      {isLoading && <Spinner size="3" />}
      <p className="p-1">{message}</p>
    </div>
  );
}
