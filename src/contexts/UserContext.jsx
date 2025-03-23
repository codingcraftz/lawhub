"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { supabase } from "@/utils/supabase";

// 사용자 컨텍스트 생성
const UserContext = createContext();

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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 초기 로드 및 인증 상태 감지
  useEffect(() => {
    console.log("🔄 UserProvider useEffect 실행");

    // Supabase에서 세션 가져오기
    const fetchSession = async () => {
      try {
        console.log("🔍 Supabase 세션 확인 중...");
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("🔴 세션 가져오기 오류:", error);
          setUser(null);
          setLoading(false);
          return;
        }

        console.log("🔑 세션 데이터:", data);

        if (data.session?.user) {
          console.log("✅ 로그인된 사용자 발견:", data.session.user);
          await fetchUserFromDatabase(data.session.user);
        } else {
          console.log("❌ 로그인된 사용자 없음");
          setUser(null);
          setLoading(false);
        }
      } catch (err) {
        console.error("🔴 세션 확인 중 오류:", err);
        setUser(null);
        setLoading(false);
      }
    };

    // users 테이블에서 사용자 정보 가져오기
    const fetchUserFromDatabase = async (authUser) => {
      try {
        console.log("🔍 users 테이블에서 사용자 조회 중:", authUser.id);
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .single();

        if (error) {
          console.error("🔴 사용자 조회 오류:", error);

          // 사용자가 없으면 생성 시도
          if (error.code === "PGRST116") {
            console.log("⚠️ 사용자가 users 테이블에 없음. 새로 생성 시도...");
            await createNewUser(authUser);
          } else {
            // 기본 사용자 정보 설정
            setUser({
              ...authUser,
              role: "client",
            });
            setLoading(false);
          }
        } else if (data) {
          console.log("✅ 사용자 정보 찾음:", data);
          setUser({
            ...authUser,
            ...data,
          });
          setLoading(false);
        } else {
          console.log("⚠️ 사용자 정보 없음, 새로 생성 시도...");
          await createNewUser(authUser);
        }
      } catch (err) {
        console.error("🔴 사용자 조회 중 오류:", err);
        setUser({
          ...authUser,
          role: "client",
        });
        setLoading(false);
      }
    };

    // 새 사용자 생성
    const createNewUser = async (authUser) => {
      try {
        console.log("🔄 새 사용자 생성 시도...");

        // 카카오 프로필 가져오기 시도
        let kakaoProfile = null;
        const session = await supabase.auth.getSession();
        const kakaoAccessToken = session.data.session?.provider_token;

        if (kakaoAccessToken) {
          try {
            console.log("🔍 카카오 프로필 가져오기 시도...");
            kakaoProfile = await fetchKakaoProfile(kakaoAccessToken);
            console.log("✅ 카카오 프로필:", kakaoProfile);
          } catch (err) {
            console.error("🔴 카카오 프로필 가져오기 실패:", err);
          }
        } else {
          console.log("⚠️ 카카오 액세스 토큰 없음");
        }

        // 사용자 정보 구성
        const email = kakaoProfile?.kakao_account?.email || authUser.email || null;
        const nickname = kakaoProfile?.kakao_account?.profile?.nickname || null;
        const profileImage = kakaoProfile?.kakao_account?.profile?.profile_image_url || null;
        const gender = kakaoProfile?.kakao_account?.gender || null;
        const birthyear = kakaoProfile?.kakao_account?.birthyear || null;
        const birthday = kakaoProfile?.kakao_account?.birthday || null;
        const kakao_id = kakaoProfile?.id || null;
        const phone_number = kakaoProfile?.kakao_account?.phone_number || null;
        const name = kakaoProfile?.kakao_account?.name || null;

        // 새 사용자 데이터
        const newUser = {
          id: authUser.id,
          kakao_id,
          phone_number,
          name,
          email,
          nickname,
          profile_image: profileImage,
          gender,
          birth_date: birthday
            ? `${birthyear || ""}-${birthday?.slice(0, 2) || ""}-${birthday?.slice(2, 4) || ""}`
            : null,
          is_kakao_user: true,
          role: "client",
          created_at: new Date().toISOString(),
        };

        console.log("📝 추가할 사용자 데이터:", newUser);

        // users 테이블에 추가
        const { data: insertedUser, error } = await supabase
          .from("users")
          .insert(newUser)
          .select()
          .single();

        if (error) {
          console.error("🔴 사용자 추가 오류:", error);
          toast.error("사용자 정보 저장에 실패했습니다");

          // 기본 사용자 정보 설정
          setUser({
            ...authUser,
            role: "client",
          });
        } else {
          console.log("✅ 사용자 추가 성공:", insertedUser);
          toast.success("회원가입이 완료되었습니다");
          setUser({
            ...authUser,
            ...insertedUser,
          });
        }

        setLoading(false);
      } catch (err) {
        console.error("🔴 사용자 생성 중 오류:", err);
        setUser({
          ...authUser,
          role: "client",
        });
        setLoading(false);
      }
    };

    // 초기 세션 확인
    fetchSession();

    // 인증 상태 변경 리스너
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 인증 상태 변경:", event);

      if (event === "SIGNED_IN" && session?.user) {
        console.log("✅ 로그인됨:", session.user);
        await fetchUserFromDatabase(session.user);
      } else if (event === "SIGNED_OUT") {
        console.log("❌ 로그아웃됨");
        setUser(null);
        setLoading(false);
      } else if (event === "TOKEN_REFRESHED") {
        console.log("🔄 토큰 갱신됨");
      }
    });

    // 정리 함수
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [router]);

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
      console.log("🔄 로그아웃 시도...");
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("🔴 로그아웃 오류:", error);
        toast.error("로그아웃 중 오류가 발생했습니다");
        return;
      }

      console.log("✅ 로그아웃 성공");
      setUser(null);
      toast.success("로그아웃되었습니다");
      router.push("/");
    } catch (error) {
      console.error("🔴 로그아웃 중 예외 발생:", error);
      toast.error("로그아웃 중 오류가 발생했습니다");
    }
  };

  // 사용자 정보 업데이트 함수
  const updateUserProfile = async (updatedData) => {
    if (!user) {
      toast.error("로그인이 필요합니다");
      throw new Error("로그인이 필요합니다");
    }

    try {
      console.log("🔄 프로필 업데이트 시도:", updatedData);
      const { data, error } = await supabase
        .from("users")
        .update(updatedData)
        .eq("id", user.id)
        .select()
        .single();

      if (error) {
        console.error("🔴 프로필 업데이트 오류:", error);
        toast.error("프로필 업데이트에 실패했습니다");
        throw error;
      }

      console.log("✅ 프로필 업데이트 성공:", data);
      // 프로필 업데이트 성공 시 사용자 상태 업데이트
      setUser((prev) => ({ ...prev, ...data }));

      toast.success("프로필이 업데이트되었습니다");
      return data;
    } catch (error) {
      console.error("🔴 프로필 업데이트 중 예외 발생:", error);
      toast.error(error.message || "프로필 업데이트에 실패했습니다");
      throw error;
    }
  };

  // 디버깅을 위한 효과
  useEffect(() => {
    console.log("👤 현재 사용자 상태:", user ? "로그인됨" : "로그인되지 않음");
    console.log("⏳ 로딩 상태:", loading ? "로딩 중" : "로딩 완료");
  }, [user, loading]);

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
