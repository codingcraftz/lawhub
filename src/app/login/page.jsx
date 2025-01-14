"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Box } from "@radix-ui/themes";
import Image from "next/image";
import { supabase } from '@/utils/supabase'

const LoginPage = () => {
	const router = useRouter();

	const handleKakaoLogin = async () => {
		try {
			const { error } = await supabase.auth.signInWithOAuth({
				provider: "kakao",
				options: {
					scopes:
						"profile_nickname profile_image account_email name gender birthday birthyear phone_number",
					redirectTo: `${window.location.origin}/oauth/callback`, // 리디렉션 URL 설정
				},
			});

			if (error) {
				console.error("Kakao login failed:", error.message);
				alert("카카오 로그인에 실패했습니다. 다시 시도해주세요.");
			}
		} catch (err) {
			console.error("Unexpected error during Kakao login:", err);
			alert("로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
		}
	};

	return (
		<Box className="flex flex-col justify-center items-center min-h-screen bg-gray-2 text-gray-12">
			<Box className="bg-gray-3 p-6 rounded-lg shadow-lg text-center max-w-lg">
				<h1 className="text-4xl font-bold text-blue-11 mb-6">LawHub</h1>
				<p className="text-lg font-medium mb-4">
					기존 이메일계정과 카카오계정이 연결되었습니다.
				</p>
				<p className="text-gray-11 mb-8">
					아래 버튼을 눌러 다시 로그인하세요.
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
						className="mr-2"
					/>
					<p className="font-semibold text-lg">카카오 로그인</p>

				</button>
			</Box>
			<Box className="mt-6 text-gray-11 text-sm text-center">
				<p>문의사항이 있다면 관리자에게 연락해주세요.</p>
			</Box>
		</Box>
	);
};

export default LoginPage;

