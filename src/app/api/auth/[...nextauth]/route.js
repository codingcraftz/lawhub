import NextAuth from "next-auth";
import KakaoProvider from "next-auth/providers/kakao";
import { supabaseAdmin } from "@/utils/supabaseAdmin";

const authOptions = {
  providers: [
    KakaoProvider({
      clientId: process.env.KAKAO_API_KEY,
      clientSecret: process.env.KAKAO_REST_API_KEY,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // account는 OAuth 로그인 시에만 제공됩니다
      if (account && profile) {
        // kakao 로그인 시
        if (account.provider === "kakao") {
          token.provider = "kakao";
          token.id = profile.id;
          token.kakao_account = profile.kakao_account;
        }
      }
      return token;
    },
    async session({ session, token }) {
      // token에서 사용자 정보를 session에 추가
      session.user.id = token.id;
      session.user.provider = token.provider;

      if (token.provider === "kakao") {
        session.user.kakao_account = token.kakao_account;
      }

      try {
        const { data: existingUser, error: findError } = await supabaseAdmin
          .from("users")
          .select("*")
          .eq("email", session.user.email)
          .single();

        if (findError && findError.code !== "PGRST116") {
          console.error("사용자 조회 오류:", findError);
        }

        if (!existingUser) {
          // 새 사용자 생성 (기존 테이블 구조에 맞게)
          const kakaoAccount = token.kakao_account || {};

          const newUser = {
            name: session.user.name || "",
            email: session.user.email || "",
            role: "client", // 기본 역할은 client
            created_at: new Date().toISOString(),
            nickname: session.user.name || "",
            profile_image: session.user.image || "",
            // 카카오에서 제공하는 정보가 있으면 활용
            gender: kakaoAccount.gender || null,
            birth_date: kakaoAccount.birthday
              ? new Date(kakaoAccount.birthday).toISOString()
              : null,
          };

          const { data: insertedUser, error: insertError } = await supabaseAdmin
            .from("users")
            .insert(newUser)
            .select()
            .single();

          if (insertError) {
            console.error("사용자 생성 오류:", insertError);
          } else {
            // Supabase 사용자 ID 세션에 추가
            session.user.supabaseId = insertedUser.id;
            session.user.role = insertedUser.role;
            session.user.nickname = insertedUser.nickname;
            session.user.profile_image = insertedUser.profile_image;
          }
        } else {
          // 기존 사용자 정보 세션에 추가
          session.user.supabaseId = existingUser.id;
          session.user.role = existingUser.role;
          session.user.nickname = existingUser.nickname;
          session.user.profile_image = existingUser.profile_image;
          session.user.phone_number = existingUser.phone_number;
          session.user.position = existingUser.position;
        }
      } catch (error) {
        console.error("세션 처리 오류:", error);
      }

      return session;
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/error",
  },
  secret: process.env.NEXTAUTH_SECRET || "lawhubnextauthsecret",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
