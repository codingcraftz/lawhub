"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";
import { toast } from "sonner";
import { supabase } from "@/utils/supabase";

// 사용자 컨텍스트 생성
const UserContext = createContext();

// 사용자 컨텍스트 제공자 컴포넌트
export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { data: session, status } = useSession();

  // 초기 로드 및 인증 상태 감지
  useEffect(() => {
    // NextAuth 세션이 로딩 중이면 기다림
    if (status === "loading") {
      return;
    }

    const fetchUser = async () => {
      try {
        if (session) {
          // NextAuth에서 사용자가 로그인한 경우
          // 기본 사용자 정보 설정
          const nextAuthUser = session.user;

          // Supabase에서 사용자 역할 정보 가져오기 (이메일로만 조회)
          if (nextAuthUser?.email) {
            try {
              // ID 형식 불일치 문제로 이메일만 사용
              console.log("이메일로 사용자 정보 조회 중:", nextAuthUser.email);

              const { data, error } = await supabase
                .from("users")
                .select("*")
                .eq("email", nextAuthUser.email)
                .single();

              if (error) {
                console.error("사용자 역할 조회 오류:", error);
                // Supabase 정보를 가져오지 못한 경우, NextAuth 사용자 정보만 사용
                setUser({
                  ...nextAuthUser,
                  role: null,
                });
              } else if (data) {
                // Supabase에서 가져온 데이터와 NextAuth 데이터 합치기
                console.log("사용자 역할 로드됨:", data.role);
                console.log("Supabase 사용자 ID:", data.id);

                // NextAuth 사용자 정보와 Supabase 정보 합치기
                setUser({
                  ...nextAuthUser,
                  ...data,
                  // NextAuth ID와 Supabase ID가 다를 수 있으므로
                  // Supabase ID는 별도 필드로 저장
                  supabaseId: data.id,
                });
              } else {
                console.log("일치하는 사용자를 찾을 수 없음");
                // 일치하는 사용자가 없으면 NextAuth 정보만 사용
                setUser({
                  ...nextAuthUser,
                  role: null,
                });
              }
            } catch (roleError) {
              console.error("역할 정보 처리 오류:", roleError);
              setUser({
                ...nextAuthUser,
                role: null,
              });
            }
          } else {
            console.log("세션에 이메일 정보가 없음");
            setUser(nextAuthUser);
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("사용자 정보 처리 오류:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [session, status]);

  // 역할 확인 함수
  const isAdmin = () => {
    return user?.role === "admin";
  };

  const isStaff = () => {
    return user?.role === "staff";
  };

  const isClient = () => {
    return user?.role === "client";
  };

  // 로그아웃 함수
  const signOut = async () => {
    try {
      await nextAuthSignOut({ callbackUrl: "/" });
    } catch (error) {
      console.error("로그아웃 오류:", error);
    }
  };

  // 사용자 정보 업데이트 함수 - API 사용
  const updateUserProfile = async (updatedData) => {
    if (!user) {
      toast.error("로그인이 필요합니다");
      throw new Error("로그인이 필요합니다");
    }

    try {
      const response = await fetch("/api/user/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "프로필 업데이트에 실패했습니다");
      }

      const data = await response.json();

      // 프로필 업데이트 성공 시 사용자 상태 업데이트
      setUser((prev) => ({ ...prev, ...data }));

      toast.success("프로필이 업데이트되었습니다");
      return data;
    } catch (error) {
      console.error("프로필 업데이트 오류:", error);
      toast.error(error.message || "프로필 업데이트에 실패했습니다");
      throw error;
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        signOut,
        isAdmin,
        isStaff,
        isClient,
        updateUserProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

// 사용자 컨텍스트 사용 훅
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser는 UserProvider 내부에서만 사용할 수 있습니다");
  }
  return context;
}
