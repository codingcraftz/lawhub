"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // router를 next/router에서 가져옵니다
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { supabase } from "@/utils/supabase";
import { Box, Button, Card, Flex, Text } from "@radix-ui/themes";

const schema = yup.object().shape({
  password: yup
    .string()
    .min(8, "비밀번호는 최소 8자 이상이어야 합니다.")
    .required("새 비밀번호를 입력해주세요."),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password"), null], "비밀번호가 일치하지 않습니다.")
    .required("비밀번호 확인을 입력해주세요."),
});

const ResetPasswordPage = () => {
  const router = useRouter();
  const [isSessionSet, setIsSessionSet] = useState(false);
  const [message, setMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    if (router.isReady) {
      // router가 준비되었을 때 실행하도록 합니다.
      const access_token = router.query.access_token;
      const refresh_token = router.query.refresh_token;

      if (access_token && refresh_token) {
        supabase.auth
          .setSession({ access_token, refresh_token })
          .then(({ session, error }) => {
            if (session) {
              setIsSessionSet(true); // 세션이 성공적으로 설정된 경우
              setMessage("");
            } else if (error) {
              setMessage("세션 설정 중 오류가 발생했습니다.");
              console.error("Session error:", error);
            }
          });
      } else {
        setMessage("유효하지 않은 접근입니다.");
      }
    }
  }, [router.isReady]); // router.isReady를 의존성에 추가하여 라우터가 준비되었을 때 실행합니다.

  const onSubmit = async (data) => {
    if (!isSessionSet) {
      setMessage("세션이 설정되지 않았습니다. 새로고침 후 다시 시도해 주세요.");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });
      if (error) throw error;

      setMessage("비밀번호가 성공적으로 변경되었습니다.");
      setTimeout(() => router.push("/login"), 2000);
    } catch (error) {
      setMessage("비밀번호 변경 중 오류가 발생했습니다.");
      console.error("Password reset error:", error);
    }
  };

  return (
    <Box
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <Card style={{ width: "400px", padding: "2rem" }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex direction="column" gap="3">
            <Text size="5" weight="bold">
              비밀번호 재설정
            </Text>
            <input
              type="password"
              placeholder="새 비밀번호"
              {...register("password")}
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid var(--gray-6)",
                borderRadius: "var(--radius-2)",
              }}
            />
            <Text color="red" size="1">
              {errors.password?.message || " "}
            </Text>
            <input
              type="password"
              placeholder="새 비밀번호 확인"
              {...register("confirmPassword")}
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid var(--gray-6)",
                borderRadius: "var(--radius-2)",
              }}
            />
            <Text color="red" size="1">
              {errors.confirmPassword?.message || " "}
            </Text>
            <Button type="submit">비밀번호 재설정</Button>
            {message && (
              <Text color="blue" style={{ marginTop: "1rem" }}>
                {message}
              </Text>
            )}
          </Flex>
        </form>
      </Card>
    </Box>
  );
};

export default ResetPasswordPage;
