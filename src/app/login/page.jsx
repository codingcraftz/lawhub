"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/Icons";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();
  const { user, loading: userLoading } = useUser();

  useEffect(() => {
    // 이미 로그인한 상태면 홈으로 리다이렉트
    if (user && !userLoading) {
      console.log("✅ 이미 로그인된 상태, 홈으로 리다이렉트");
      setIsRedirecting(true);
      router.push("/");
    }
  }, [user, userLoading, router]);

  const handleKakaoLogin = async () => {
    try {
      setLoading(true);
      console.log("🔄 카카오 로그인 시도...");

      console.log("환경변수 확인:", {
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
        origin: window.location.origin,
      });

      // NextAuth 카카오 로그인 - 명시적으로 redirect: true 설정
      const result = await signIn("kakao", {
        callbackUrl: "/",
        redirect: true,
      });

      console.log("카카오 로그인 결과:", result);
      // 참고: redirect: true로 설정했으므로 이 코드는 실행되지 않습니다.
      // 리디렉션이 일어날 것이기 때문입니다.
    } catch (error) {
      console.error("🔴 카카오 로그인 예외:", error);
      toast.error("로그인 중 오류가 발생했습니다", {
        description: "잠시 후 다시 시도해주세요.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (userLoading || isRedirecting) {
    return (
      <>
        <div className="container mx-auto py-20 text-center">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>리다이렉트 중...</CardTitle>
              <CardDescription>이미 로그인되어 있습니다. 홈으로 이동합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center my-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <div className="container mx-auto py-20">
      <Card className="max-w-md mx-auto">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">LawHub 로그인</CardTitle>
          <CardDescription>로그인하여 LawHub의 모든 기능을 이용해보세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <Button
              variant="outline"
              className="bg-[#FEE500] hover:bg-[#FEE500]/90 text-black"
              disabled={loading}
              onClick={handleKakaoLogin}
            >
              {loading ? (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg
                  className="mr-2 h-5 w-5"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 3C7.0295 3 3 6.26944 3 10.3035C3 12.5168 4.26333 14.4792 6.25 15.6881V19.5L10.077 17.1723C10.7003 17.2809 11.3438 17.3371 12 17.3371C16.9705 17.3371 21 14.0676 21 10.0336C21 6.26944 16.9705 3 12 3Z"
                    fill="black"
                  ></path>
                </svg>
              )}
              카카오 계정으로 로그인
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
