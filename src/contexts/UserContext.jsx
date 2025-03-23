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
        console.log("UserContext: 세션 상태 변경됨", status);
        console.log("UserContext: 세션 데이터", session);

        if (session?.user?.email) {
          // 이메일 정보가 있으면 Supabase에서 사용자 조회
          console.log("UserContext: 이메일로 사용자 정보 조회 중:", session.user.email);

          const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("email", session.user.email)
            .single();

          if (error) {
            console.error("UserContext: 사용자 조회 오류:", error);
            // 처음 로그인시 사용자가 없을 수 있으므로, 여기서 생성 시도
            if (error.code === "PGRST116") {
              console.log("UserContext: 사용자를 찾을 수 없음, 새로 생성 시도");

              // 새 사용자 생성
              const newUser = {
                email: session.user.email,
                name: session.user.name || "",
                nickname: session.user.name || "",
                profile_image: session.user.image || "",
                is_kakao_user: true,
                role: "client",
                created_at: new Date().toISOString(),
              };

              const { data: insertedUser, error: insertError } = await supabase
                .from("users")
                .insert(newUser)
                .select()
                .single();

              if (insertError) {
                console.error("UserContext: 사용자 생성 오류:", insertError);
                setUser({
                  ...session.user,
                  role: "client",
                });
              } else {
                console.log("UserContext: 사용자 생성 성공:", insertedUser);
                setUser({
                  ...session.user,
                  ...insertedUser,
                  supabaseId: insertedUser.id,
                });
              }
            } else {
              // 다른 오류의 경우
              setUser({
                ...session.user,
                role: "client",
              });
            }
          } else if (data) {
            // 사용자 정보 찾음
            console.log("UserContext: 사용자 조회 성공:", data);
            setUser({
              ...session.user,
              ...data,
              supabaseId: data.id,
            });
          }
        } else if (session?.user) {
          // 이메일 없이 세션만 있는 경우 (비정상 상태)
          console.log("UserContext: 세션은 있으나 이메일 정보가 없음");
          setUser(session.user);
        } else {
          // 세션이 없는 경우
          console.log("UserContext: 로그인 상태 아님");
          setUser(null);
        }
      } catch (err) {
        console.error("UserContext: 사용자 정보 처리 중 오류:", err);
        if (session?.user) {
          setUser({
            ...session.user,
            role: "client",
          });
        } else {
          setUser(null);
        }
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
      console.log("UserContext: 로그아웃 시도");
      await nextAuthSignOut({ callbackUrl: "/" });
      console.log("UserContext: 로그아웃 성공");
    } catch (error) {
      console.error("UserContext: 로그아웃 오류:", error);
      toast.error("로그아웃 중 오류가 발생했습니다");
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
      console.error("UserContext: 프로필 업데이트 오류:", error);
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
