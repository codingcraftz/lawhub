// src/app/(auth)/login/page.jsx

"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase";
import { Box, Flex, Text, Button, Card } from "@radix-ui/themes";
import { useUser } from "@/hooks/useUser";
import * as Dialog from "@radix-ui/react-dialog"; // Radix UI Dialog import
import { Cross2Icon } from "@radix-ui/react-icons"; // Close icon

const schema = yup.object().shape({
  email: yup
    .string()
    .email("유효한 이메일을 입력해주세요")
    .required("이메일은 필수입니다"),
  password: yup.string().required("비밀번호는 필수입니다"),
});

const LoginPage = () => {
  const router = useRouter();
  const { fetchUser } = useUser();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onChange",
  });

  const [modalMessage, setModalMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

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

      router.push("/boards");
    } catch (error) {
      console.error("Login error:", error);
      setModalMessage(
        "로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.",
      );
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
      }}
    >
      <Card style={{ width: "400px", padding: "2rem" }}>
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
            <Button type="submit" disabled={!isValid}>
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

      {/* Radix UI Dialog Component for Error Messages */}
      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />
          <Dialog.Content
            className="fixed top-1/2 left-1/2 bg-white dark:bg-gray-800 rounded-lg p-6 transform -translate-x-1/2 -translate-y-1/2 max-w-md w-full"
            style={{ zIndex: 1000 }}
          >
            <Dialog.Title className="text-lg font-bold mb-4">오류</Dialog.Title>
            <Dialog.Description>{modalMessage}</Dialog.Description>
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                size="1"
                style={{ position: "absolute", top: 8, right: 8 }}
              >
                <Cross2Icon />
              </Button>
            </Dialog.Close>
            <Flex justify="end" mt="4">
              <Button onClick={onCloseModal}>확인</Button>
            </Flex>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </Box>
  );
};

export default LoginPage;
