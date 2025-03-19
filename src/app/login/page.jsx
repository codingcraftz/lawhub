"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // 이미 로그인한 사용자는 홈으로 리다이렉트
    if (status === "authenticated" && session) {
      setIsRedirecting(true);
      router.push("/");
    }
  }, [session, status, router]);

  const handleKakaoLogin = async () => {
    try {
      await signIn("kakao", { callbackUrl: "/" });
    } catch (error) {
      console.error("카카오 로그인 오류:", error);
      toast.error("로그인 중 오류가 발생했습니다", {
        description: "잠시 후 다시 시도해주세요.",
      });
    }
  };

  if (isRedirecting) {
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
    <>
      <div className="container mx-auto py-20">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">로그인</CardTitle>
            <CardDescription>소셜 계정으로 간편하게 로그인하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleKakaoLogin}
              className="w-full py-6 bg-[#FEE500] hover:bg-[#FEE500]/90 text-black"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="mr-2"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M9 0.5C4.30371 0.5 0.5 3.32841 0.5 6.8C0.5 8.92548 1.93371 10.7834 4.11514 11.7279C3.91371 12.3868 3.42084 14.3334 3.36108 14.6312C3.28326 15.0239 3.57205 15.0114 3.74461 14.9007C3.87787 14.8126 6.06602 13.3474 6.93783 12.7559C7.59212 12.8455 8.28576 12.9 9 12.9C13.6963 12.9 17.5 10.0716 17.5 6.6C17.5 3.12841 13.6963 0.5 9 0.5Z"
                  fill="black"
                />
              </svg>
              카카오 계정으로 로그인
            </Button>
          </CardContent>
          <CardFooter className="flex justify-center text-sm text-gray-500">
            <p>
              회원이 아니신가요?{" "}
              <Link href="/register" className="text-primary hover:underline">
                회원가입
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
