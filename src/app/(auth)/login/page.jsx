"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase";
import { Box, Flex, Text, Button, Card } from "@radix-ui/themes";
import { useUser } from "@/hooks/useUser";
import * as Dialog from "@radix-ui/react-dialog";
import { loginSchema, passwordResetSchema } from "@/utils/schema";

const LoginPage = () => {
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  const { user } = useUser();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm({
    resolver: yupResolver(loginSchema),
    mode: "onChange",
  });
  const {
    register: resetRegister,
    handleSubmit: handleResetSubmit,
    formState: { errors: resetErrors },
  } = useForm({
    resolver: yupResolver(passwordResetSchema),
  });

  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  const onCloseModal = () => {
    setIsModalOpen(false);
    reset();
  };

  const onSubmit = async (data) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;
      router.push("/");
    } catch (error) {
      console.error("Login error:", error);
      setModalMessage(
        "로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.",
      );
      setIsModalOpen(true);
    }
  };

  const onForgotPassword = async (data) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;

      setModalMessage("비밀번호 복구 이메일이 전송되었습니다.");
      setIsModalOpen(true);
      setIsForgotPasswordOpen(false);
    } catch (error) {
      console.error("Password reset error:", error);
      setModalMessage("비밀번호 복구 요청 중 오류가 발생했습니다.");
      setIsModalOpen(true);
    }
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
      className="sm:px-4 md:px-6 lg:px-8"
    >
      <Card
        style={{
          width: "100%",
          maxWidth: "400px",
          padding: "2rem",
        }}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex direction="column" gap="3">
            <Text size="5" weight="bold">
              로그인
            </Text>
            {["email", "password"].map((field) => (
              <Box key={field}>
                <input
                  type={field === "password" ? "password" : "email"}
                  placeholder={field === "email" ? "이메일" : "비밀번호"}
                  {...register(field)}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    border: "1px solid var(--gray-6)",
                    borderRadius: "var(--radius-2)",
                  }}
                />
                <Text
                  color="red"
                  size="1"
                  style={{ minHeight: "20px", marginTop: "4px" }}
                >
                  {errors[field]?.message || " "}
                </Text>
              </Box>
            ))}
            <Button
              type="submit"
              disabled={!isValid}
              style={{ width: "100%", padding: "0.75rem" }}
            >
              로그인
            </Button>
            <Text size="2" align="center">
              계정이 없으신가요?{" "}
              <Link href="/signup" style={{ color: "var(--accent-9)" }}>
                회원가입
              </Link>
            </Text>
          </Flex>
        </form>
      </Card>

      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Content
          style={{
            maxWidth: "450px",
            padding: "2rem",
            borderRadius: "8px",
            border: "2px solid var(--gray-8)",
            backgroundColor: "var(--gray-1)",
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.15)",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <Dialog.Title
            style={{
              fontSize: "1.25rem",
              fontWeight: "600",
              color: "var(--accent-9)",
              marginBottom: "1rem",
            }}
          >
            오류
          </Dialog.Title>
          <Dialog.Description
            style={{
              fontSize: "1rem",
              color: "var(--gray-9)",
              marginBottom: "1.5rem",
            }}
          >
            {modalMessage}
          </Dialog.Description>
          <Dialog.Close asChild>
            <Button
              variant="soft"
              color="blue"
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "8px",
                fontSize: "1rem",
                fontWeight: "500",
              }}
              onClick={onCloseModal}
            >
              확인
            </Button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Root>

      <Dialog.Root
        open={isForgotPasswordOpen}
        onOpenChange={setIsForgotPasswordOpen}
      >
        <Dialog.Content
          style={{
            maxWidth: "450px",
            padding: "2rem",
            borderRadius: "8px",
            border: "2px solid var(--gray-8)",
            backgroundColor: "var(--gray-1)",
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.15)",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <Dialog.Title
            style={{
              fontSize: "1.25rem",
              fontWeight: "600",
              color: "var(--accent-9)",
              marginBottom: "1rem",
            }}
          >
            비밀번호 찾기
          </Dialog.Title>
          <form
            onSubmit={handleResetSubmit(onForgotPassword)}
            style={{ width: "100%" }}
          >
            <input
              type="email"
              placeholder="이메일을 입력해주세요"
              {...resetRegister("email")}
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid var(--gray-6)",
                borderRadius: "var(--radius-2)",
                marginBottom: "1rem",
              }}
            />
            <Text
              color="red"
              size="1"
              style={{ minHeight: "20px", marginTop: "4px" }}
            >
              {resetErrors.email?.message || " "}
            </Text>
            <Button
              type="submit"
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "8px",
                fontSize: "1rem",
                fontWeight: "500",
              }}
            >
              비밀번호 복구
            </Button>
          </form>
        </Dialog.Content>
      </Dialog.Root>
    </Box>
  );
};

export default LoginPage;
