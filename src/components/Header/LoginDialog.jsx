"use client";

import React, { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import Image from "next/image";
import { supabase } from "@/utils/supabase";
import { useRouter } from "next/navigation";
import { Box } from "@radix-ui/themes";

const LoginDialog = () => {
  const [activeTab, setActiveTab] = useState("email"); // 'email' 또는 'kakao'
  const router = useRouter();

  const fetchKakaoProfile = async (kakaoAccessToken) => {
    const res = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: {
        Authorization: `Bearer ${kakaoAccessToken}`,
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      },
    });
    if (!res.ok) {
      throw new Error("Failed to fetch Kakao profile");
    }
    return res.json();
  };

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          const userId = session.user.id;

          // 1. Check if the user already exists in the `users` table
          const { data: existingUser, error: fetchError } = await supabase
            .from("users")
            .select("*")
            .eq("id", userId)
            .single();

          if (fetchError) {
            console.error("Error fetching user:", fetchError.message);
            return;
          }

          // 2. If the user already exists, skip Kakao profile fetch
          if (existingUser) {
            console.log("User already exists. Skipping Kakao profile fetch.");
            if (!existingUser.is_kakao_user) {
              console.log("Updating user to mark as Kakao user.");
              const { error: updateError } = await supabase
                .from("users")
                .update({ is_kakao_user: true })
                .eq("id", userId);

              if (updateError) {
                console.error("Error updating user:", updateError.message);
              } else {
                console.log("User updated successfully.");
              }
            }
            return;
          }

          // 3. If the user doesn't exist, fetch Kakao profile and insert data
          const kakaoAccessToken = session.provider_token; // 실제 필드명 확인 필요
          if (!kakaoAccessToken) {
            console.error("No Kakao access token found.");
            return;
          }

          let kakaoProfile;
          try {
            kakaoProfile = await fetchKakaoProfile(kakaoAccessToken);
          } catch (err) {
            console.error("Failed to fetch Kakao profile:", err);
            return;
          }

          const email =
            kakaoProfile?.kakao_account?.email || session.user?.email || null;
          const nickname =
            kakaoProfile?.kakao_account?.profile?.nickname || null;
          const profileImage =
            kakaoProfile?.kakao_account?.profile?.profile_image_url || null;
          const gender = kakaoProfile?.kakao_account?.gender || null;
          const birthyear = kakaoProfile?.kakao_account?.birthyear || null;
          const birthday = kakaoProfile?.kakao_account?.birthday || null;
          const kakao_id = kakaoProfile?.id || null;
          const phone_number =
            kakaoProfile?.kakao_account?.phone_number || null;
          const name = kakaoProfile?.kakao_account?.name || null;

          const { error: upsertErr } = await supabase.from("users").insert({
            id: userId,
            kakao_id,
            phone_number,
            name,
            email,
            nickname,
            profile_image: profileImage,
            gender,
            birth_date: birthday
              ? `${birthyear}-${birthday.slice(0, 2)}-${birthday.slice(2, 4)}`
              : null,
            is_kakao_user: true,
            role: "client",
          });

          if (upsertErr) {
            console.error("Error inserting Kakao user:", upsertErr);
          } else {
            console.log("Kakao user inserted successfully.");
          }
        }
      },
    );

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  const handleEmailLogin = async (email, password) => {
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        console.error("Email login failed:", error.message);
        alert("이메일 로그인에 실패했습니다.");
        return;
      }
      console.log("Email login successful. Redirecting to link Kakao...");
      router.push("/merge-kakao"); // 병합 페이지로 이동
    } catch (err) {
      console.error("Unexpected error during email login:", err);
    }
  };

  const handleKakaoLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: {
          scopes:
            "profile_nickname profile_image account_email name gender birthday birthyear phone_number",
        },
      });

      if (error) {
        console.error("Kakao login failed:", error.message);
        alert("카카오 로그인에 실패했습니다.");
      }
    } catch (err) {
      console.error("Unexpected error during Kakao login:", err);
    }
  };

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="inline-flex h-[35px] items-center justify-center rounded bg-mauve-6 px-[15px] font-medium leading-none hover:bg-mauve-8 focus:outline-none">
          로그인
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-75 data-[state=open]:animate-overlayShow" />
        <Dialog.Content className="fixed bg-gray-3 left-1/2 top-1/2 max-h-[85vh] w-96 max-w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-md p-[25px] shadow focus:outline-none data-[state=open]:animate-contentShow">
          <Dialog.Title className="m-0 text-4xl font-bold text-blackA-12 text-center py-6">
            LawHub
          </Dialog.Title>
          <div className="flex justify-around py-2">
            <button
              className={`px-4 py-2 hover:scale-105 hover:text-gray-10 ${
                activeTab === "email" ? "font-bold" : "text-gray-8"
              }`}
              onClick={() => setActiveTab("email")}
            >
              이메일 로그인
            </button>
            <button
              className={`px-4 py-2 hover:scale-105 hover:text-gray-10 ${
                activeTab === "kakao" ? "font-bold" : "text-gray-8"
              }`}
              onClick={() => setActiveTab("kakao")}
            >
              카카오 로그인
            </button>
          </div>

          {activeTab === "email" ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const email = e.target.email.value;
                const password = e.target.password.value;
                handleEmailLogin(email, password);
              }}
            >
              <input
                name="email"
                type="email"
                placeholder="이메일"
                className="w-full border border-gray-8 p-2 rounded mb-4"
              />
              <input
                name="password"
                type="password"
                placeholder="비밀번호"
                className="w-full border border-gray-8 p-2 rounded mb-4"
              />
              <p className="text-sm text-red-500 mb-2">
                ⚠️ 이메일 로그인 기능은 곧 종료됩니다.
              </p>
              <p className="text-sm text-gray-11 mb-4">
                기존 이메일 계정은 로그인 후 반드시 카카오 계정과 동기화해
                주시기 바랍니다.
              </p>
              <button
                type="submit"
                className="w-full bg-blue-9 text-white py-2 rounded"
              >
                이메일 로그인
              </button>
            </form>
          ) : (
            <Box className="flex flex-col gap-5">
              <p className="text-center font-semibold py-2 text-lg flex-1">
                <span className="text-blue-11">로그인</span>이 필요한 서비입니다
              </p>
              <button
                onClick={handleKakaoLogin}
                className="flex justify-center items-center py-4 rounded-lg shadow hover:opacity-80 transition w-full"
                style={{
                  background: "#FEE500",
                  color: "rgba(0,0,0,0.8)",
                }}
              >
                <Image
                  src="/images/kakao_login_logo.png"
                  alt="kakao_login"
                  width={30}
                  height={30}
                />
                <p className="font-semibold">카카오 로그인</p>
              </button>
            </Box>
          )}

          <Dialog.Close asChild>
            <button
              className="absolute border border-gray-11 hover:bg-gray-8 right-2.5 top-2.5 inline-flex size-[25px] items-center justify-center rounded-full text-violet11 hover:bg-violet4 focus:shadow focus:outline-none"
              aria-label="Close"
            >
              <Cross2Icon width={30} height={30} />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default LoginDialog;
