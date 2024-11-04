// src/app/error.js

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Box, Text, Button, Card } from "@radix-ui/themes";

const ErrorPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorType = searchParams.get("error") || "unknown";

  // 오류 메시지 매핑
  const errorMessages = {
    otp: "OTP 인증에 실패했습니다. 관리자에게 문의 주세요.",
    update: "비밀번호 업데이트 중 오류가 발생했습니다.",
    missing: "요청에 필요한 정보가 누락되었습니다.",
    unknown: "알 수 없는 오류가 발생했습니다. 다시 시도해 주세요.",
  };

  return (
    <Box
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        padding: "1rem",
      }}
    >
      <Card style={{ padding: "2rem", maxWidth: "400px", textAlign: "center" }}>
        <Text as="p" size="5" weight="bold" style={{ color: "var(--red-9)" }}>
          오류 발생
        </Text>
        <Text as="p" size="3" style={{ margin: "1rem 0" }}>
          {errorMessages[errorType]}
        </Text>
        <Button onClick={() => router.push("/")}>홈으로 이동</Button>
      </Card>
    </Box>
  );
};

export default ErrorPage;
