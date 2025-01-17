"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";

const OAuthCallback = () => {
	const router = useRouter();

	useEffect(() => {
		const handleOAuthCallback = async () => {
			try {
				// Supabase에서 OAuth 세션을 처리
				const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);

				if (error) {
					console.error("Error during OAuth callback:", error);
					alert("로그인 처리 중 문제가 발생했습니다.");
					router.replace("/"); // 에러 발생 시 홈으로 리디렉션
				} else {
					console.log("OAuth callback successful:", data);
					router.replace("/"); // 로그인 성공 후 리디렉션
				}
			} catch (err) {
				console.error("Unexpected error during OAuth callback:", err);
				alert("알 수 없는 오류가 발생했습니다.");
				router.replace("/");
			}
		};

		handleOAuthCallback();
	}, [router]);

	return (
		<div className="flex items-center justify-center min-h-screen">
			<p>로그인 처리 중입니다...</p>
		</div>
	);
};

export default OAuthCallback;

