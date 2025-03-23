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
      const name = profile.name || null;
      const nickname = profile.name || null;
      const profileImage = profile.image || null;
      const kakao_id = profile.id || null;

      // 카카오 계정에서 추가 정보 가져오기
      const kakaoAccount = profile._json?.kakao_account || {};
      const gender = kakaoAccount.gender || null;
      const phone_number = kakaoAccount.phone_number || null;

      // 생년월일 정보 처리
      let birth_date = null;
      if (kakaoAccount.birthyear && kakaoAccount.birthday) {
        try {
          birth_date = `${kakaoAccount.birthyear}-${kakaoAccount.birthday.slice(
            0,
            2
          )}-${kakaoAccount.birthday.slice(2, 4)}`;
        } catch (e) {
          console.error("🔴 NextAuth: 생년월일 처리 오류", e);
        }
      }

      // 새 사용자 데이터 생성
      const newUser = {
        email: profile.email,
        kakao_id,
        name,
        nickname,
        profile_image: profileImage,
        phone_number,
        gender,
        birth_date,
        is_kakao_user: true,
        role: "client",
        created_at: new Date().toISOString(),
      };

      console.log("📝 NextAuth: 저장할 사용자 데이터", newUser);

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
      clientId: process.env.KAKAO_CLIENT_ID || process.env.KAKAO_API_KEY,
      clientSecret: process.env.KAKAO_CLIENT_SECRET || process.env.REST_API_KEY || "none",
      profile(profile) {
        console.log("📝 KakaoProvider: 프로필 정보 받음", profile.id);
        console.log("📝 KakaoProvider: 원본 프로필 데이터", JSON.stringify(profile, null, 2));

        if (!profile.kakao_account?.email) {
          console.error("🔴 KakaoProvider: 이메일 정보 없음!");
        }

        // 카카오 프로필 데이터를 가공하여 반환
        return {
          id: profile.id,
          name: profile.kakao_account?.profile.nickname,
          email: profile.kakao_account?.email,
          image: profile.kakao_account?.profile.profile_image_url,
          _json: profile, // 원본 프로필 정보도 함께 저장
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("👉 NextAuth: signIn 콜백 실행", {
        user: user,
        email: profile?.kakao_account?.email,
        kakao_id: profile?.id,
      });

      if (!profile?.kakao_account?.email) {
        console.error("🔴 NextAuth: 이메일 정보가 없습니다. 로그인 실패");
        return false;
      }

      try {
        // 사용자 정보 조회 또는 생성 - 이 단계에서 DB에 사용자가 저장됨
        const userData = await getOrCreateUser(
          {
            id: profile.id,
            name: profile.kakao_account?.profile.nickname,
            email: profile.kakao_account?.email,
            image: profile.kakao_account?.profile.profile_image_url,
          },
          account
        );

        return true; // 로그인 허용
      } catch (error) {
        console.error("🔴 NextAuth: 사용자 생성/조회 중 오류:", error);
        // 에러가 발생해도 로그인은 허용 (디버깅 목적)
        return true;
      }
    },
    async jwt({ token, account, profile, user }) {
      console.log("🔄 NextAuth: JWT 콜백", {
        hasToken: !!token,
        hasProfile: !!profile,
        hasAccount: !!account,
        hasUser: !!user,
      });

      // 최초 로그인 시에만 profile이 있음
      if (account && profile) {
        console.log("🔄 NextAuth: JWT 콜백 - 최초 로그인");
        console.log("📝 NextAuth: 프로필 정보", JSON.stringify(profile, null, 2));

        // 토큰에 이메일만 저장 (나머지는 UserContext에서 처리)
        token.email = profile.kakao_account?.email;
        token.sub = profile.id; // 카카오 ID를 sub에 저장
        token.provider = "kakao";
        token.kakao_id = profile.id;

        console.log("✅ NextAuth: JWT 토큰 생성됨:", JSON.stringify(token, null, 2));
      }

      return token;
    },
    async session({ session, token }) {
      // 세션에 이메일과 카카오 ID 전달
      if (token.email) {
        session.user = session.user || {};
        session.user.email = token.email;
        session.user.provider = "kakao";
        session.user.id = token.kakao_id || token.sub;
      }

      console.log("🔄 NextAuth: 세션 콜백 완료. 세션:", JSON.stringify(session, null, 2));
      return session;
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login", // 에러 페이지를 login 페이지로 변경
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30일
  },
  secret: process.env.NEXTAUTH_SECRET || "lawhubnextauthsecret",
  debug: true, // 디버깅 모드 항상 활성화
};

// NextAuth 핸들러 생성 - App Router 방식
const handler = NextAuth(authOptions);

// GET과 POST 핸들러 내보내기
export { handler as GET, handler as POST };
