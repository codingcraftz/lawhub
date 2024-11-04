"use client";

import React from "react";
import { Box, Text, Button } from "@radix-ui/themes";
import { useRouter } from "next/navigation";

const PasswordResetSuccess = () => {
  const router = useRouter();

  return (
    <Box
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        flexDirection: "column",
        padding: "1rem",
      }}
    >
      <Text size="5" weight="bold" color="green">
        비밀번호가 성공적으로 재설정되었습니다.
      </Text>
      <Text size="3" style={{ marginTop: "1rem" }}>
        임시 비밀번호로 로그인하시고, 로그인 후 비밀번호를 변경하세요.
      </Text>
      <Button
        style={{ marginTop: "2rem", padding: "0.75rem 1.5rem" }}
        onClick={() => router.push("/login")}
      >
        로그인 페이지로 이동
      </Button>
    </Box>
  );
};

export default PasswordResetSuccess;
