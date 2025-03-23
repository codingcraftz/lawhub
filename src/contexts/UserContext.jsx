"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut as nextAuthSignOut, useSession } from "next-auth/react";
import { toast } from "sonner";
import { createClient } from "@supabase/supabase-js";

// Supabase 클라이언트 생성
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// 사용자 컨텍스트 생성
const UserContext = createContext(null);

// Kakao 프로필 가져오기 함수
async function fetchKakaoProfile(accessToken) {
  try {
    const response = await fetch("https://kapi.kakao.com/v2/user/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-type": "application/x-www-form-urlencoded;charset=utf-8",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch Kakao profile");
    }

    return await response.json();
  } catch (error) {
    console.error("🔴 카카오 프로필 불러오기 오류:", error);
    throw error;
  }
}

// 사용자 컨텍스트 제공자 컴포넌트
export function UserProvider({ children }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    console.log("🔄 UserContext - Session 상태 변경:", status);
    console.log("🔄 UserContext - Session 데이터:", session);

    const fetchUserFromSupabase = async (email) => {
      try {
        console.log("🔍 Supabase에서 사용자 정보 조회 시작:", email);

        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("email", email)
          .single();

        if (error) {
          console.error("🔴 Supabase 사용자 조회 오류:", error);
          throw error;
        }

        if (data) {
          console.log("✅ Supabase에서 사용자 정보 조회 성공:", data);
          return data;
        } else {
          console.error("🔴 해당 이메일의 사용자가 없습니다:", email);
          return null;
        }
      } catch (err) {
        console.error("🔴 Supabase 사용자 조회 중 예외 발생:", err);
        setError(err);
        return null;
      }
    };

    const handleSession = async () => {
      try {
        if (status === "loading") {
          console.log("⏳ UserContext - 세션 로딩 중...");
          return;
        }

        if (status === "authenticated" && session?.user) {
          console.log("✅ UserContext - 인증된 세션 발견:", session.user);

          // NextAuth 세션에서 이메일을 가져와 Supabase에서 전체 사용자 정보 조회
          const email = session.user.email;
          if (email) {
            const userData = await fetchUserFromSupabase(email);
            if (userData) {
              setUser(userData);
            } else {
              // Supabase에서 사용자를 찾지 못한 경우 NextAuth 세션 정보 사용
              console.warn("⚠️ Supabase에서 사용자를 찾지 못해 NextAuth 세션 정보 사용");
              setUser(session.user);
            }
          } else {
            console.error("🔴 세션에 이메일 정보가 없습니다");
            setUser(null);
          }
        } else if (status === "unauthenticated") {
          console.log("🚫 UserContext - 인증되지 않은 상태");
          setUser(null);
        }
      } catch (err) {
        console.error("🔴 UserContext - 세션 처리 중 오류 발생:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    handleSession();
  }, [session, status, router]);

  // 사용자 정보 업데이트 함수
  const updateUserProfile = async (userData) => {
    try {
      console.log("🔄 UserContext - 사용자 프로필 업데이트 시도:", userData);

      // Supabase에 직접 업데이트
      const { data, error } = await supabase
        .from("users")
        .update(userData)
        .eq("id", user.id)
        .select()
        .single();

      if (error) {
        console.error("🔴 Supabase 사용자 업데이트 오류:", error);
        throw new Error("프로필 업데이트에 실패했습니다");
      }

      console.log("✅ UserContext - 프로필 업데이트 성공:", data);

      // 로컬 상태 업데이트
      setUser((prev) => ({ ...prev, ...userData }));
      toast.success("프로필이 업데이트되었습니다");

      return data;
    } catch (err) {
      console.error("🔴 UserContext - 프로필 업데이트 중 오류:", err);
      setError(err);
      toast.error(err.message || "프로필 업데이트에 실패했습니다");
      throw err;
    }
  };

  // 역할 확인 함수
  const isAdmin = () => user?.role === "admin";
  const isStaff = () => user?.role === "staff";
  const isClient = () => user?.role === "client";

  // 로그아웃 함수
  const signOut = async () => {
    try {
      console.log("🔄 UserContext - 로그아웃 시도");
      await nextAuthSignOut({ callbackUrl: "/login" });
      console.log("✅ UserContext - 로그아웃 성공");
    } catch (err) {
      console.error("🔴 UserContext - 로그아웃 중 오류:", err);
      setError(err);
    }
  };

  // 디버깅을 위한 효과
  useEffect(() => {
    console.log("👤 현재 사용자 상태:", user ? "로그인됨" : "로그인되지 않음");
    console.log("⏳ 로딩 상태:", loading ? "로딩 중" : "로딩 완료");
    if (user) {
      console.log("👤 사용자 정보:", user);
    }
  }, [user, loading]);

  // Context에 노출할 값
  const value = {
    user,
    loading,
    error,
    signOut,
    isAdmin,
    isStaff,
    isClient,
    updateUserProfile,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// 사용자 컨텍스트 사용 훅
export function useUser() {
  const context = useContext(UserContext);
  if (context === null) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
