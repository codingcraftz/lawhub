import NextAuth from "next-auth";
import KakaoProvider from "next-auth/providers/kakao";
import { supabaseAdmin } from "@/utils/supabaseAdmin";

// 사용자 정보 조회 및 저장 함수
async function getOrCreateUser(profile, account) {
  console.log("🔍 NextAuth: 사용자 정보 조회 시작", profile.email);
  console.log("🔍 NextAuth: 프로필 정보", JSON.stringify(profile, null, 2));
  console.log("🔍 NextAuth: 계정 정보", JSON.stringify(account, null, 2));

  try {
    // 이메일로 사용자 조회
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("email", profile.email)
      .single();

    // 사용자가 존재하면 반환
    if (user) {
      console.log("✅ NextAuth: 기존 사용자 발견", user.id);
      return user;
    }

    // 사용자가 없으면 신규 등록
    if (error && error.code === "PGRST116") {
      console.log("🆕 NextAuth: 신규 사용자 등록 시작");

      // 프로필 정보에서 필요한 데이터 추출
      const name = profile.name || profile.kakao_account?.profile?.nickname || null;
      const nickname = profile.kakao_account?.profile?.nickname || name;
      const profileImage = profile.kakao_account?.profile?.profile_image_url || null;
      const gender = profile.kakao_account?.gender || null;
      const birthyear = profile.kakao_account?.birthyear || null;
      const birthday = profile.kakao_account?.birthday || null;
      const kakao_id = profile.id || null;
      const phone_number = profile.kakao_account?.phone_number || null;

      // 새 사용자 데이터 생성
      const newUser = {
        email: profile.email,
        kakao_id,
        phone_number,
        name,
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

      // 데이터베이스에 저장
      const { data: insertedUser, error: insertError } = await supabaseAdmin
        .from("users")
        .insert(newUser)
        .select()
        .single();

      if (insertError) {
        console.error("🔴 NextAuth: 사용자 등록 실패", insertError);
        throw insertError;
      }

      console.log("✅ NextAuth: 신규 사용자 등록 완료", insertedUser.id);
      return insertedUser;
    }

    // 다른 오류 발생
    if (error) {
      console.error("🔴 NextAuth: 사용자 조회 중 오류 발생", error);
      throw error;
    }
  } catch (err) {
    console.error("🔴 NextAuth: 사용자 등록/조회 중 예외 발생", err);
    throw err;
  }
}

// NextAuth 설정
export const authOptions = {
  providers: [
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID,
      clientSecret: process.env.KAKAO_CLIENT_SECRET || "none",
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("👉 NextAuth: signIn 콜백 실행", {
        email: profile?.email,
        kakao_id: profile?.id,
      });

      if (!profile?.email) {
        console.error("🔴 NextAuth: 이메일 정보가 없습니다. 로그인 실패");
        return false;
      }

      try {
        // 사용자 정보 조회 또는 생성 - 이 단계에서 DB에 사용자가 저장됨
        await getOrCreateUser(profile, account);
        return true; // 로그인 허용
      } catch (error) {
        console.error("🔴 NextAuth: 사용자 생성/조회 중 오류:", error);
        return false; // 로그인 실패
      }
    },
    async jwt({ token, account, profile }) {
      // 최초 로그인 시에만 profile이 있음
      if (account && profile) {
        console.log("🔄 NextAuth: JWT 콜백 - 최초 로그인");

        // 토큰에 이메일만 저장 (나머지는 UserContext에서 처리)
        token.email = profile.email;
        console.log("✅ NextAuth: JWT에 이메일 저장:", token.email);
      }
      return token;
    },
    async session({ session, token }) {
      // 세션에 이메일만 전달 (나머지는 UserContext에서 처리)
      if (token.email) {
        session.user.email = token.email;
      }

      console.log("🔄 NextAuth: 세션 콜백 완료. 이메일:", session.user.email);
      return session;
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30일
  },
  secret: process.env.NEXTAUTH_SECRET || "lawhubnextauthsecret",
  debug: true, // 디버깅 모드 활성화
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
