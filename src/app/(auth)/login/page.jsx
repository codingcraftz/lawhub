// pages/login.js

"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase";
import { useUser } from "@/hooks/useUser";
import { Box, Flex, Text, Button, Card } from "@radix-ui/themes";
import Modal from "@/components/Modal";

const schema = yup.object().shape({
  email: yup
    .string()
    .email("유효한 이메일을 입력해주세요")
    .required("이메일은 필수입니다"),
  password: yup.string().required("비밀번호는 필수입니다"),
});

const LoginPage = () => {
  const router = useRouter();
  const { fetchUser } = useUser(); // fetchUser를 사용하여 사용자 정보 갱신
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, touchedFields },
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onBlur",
  });

  const [modalMessage, setModalMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEmailNotConfirmed, setIsEmailNotConfirmed] = useState(false);

  const onCloseModal = () => {
    setIsModalOpen(false);
    reset(); // 폼 초기화
  };

  const onSubmit = async (data) => {
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) throw error;

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (profileError) throw profileError;

      if (!profileData.is_active) {
        await supabase.auth.signOut();
        throw new Error(
          "계정이 아직 활성화되지 않았습니다. 관리자의 승인을 기다려주세요.",
        );
      }

      await fetchUser(); // 사용자 정보 갱신하여 Context에 저장
      router.push("/");
    } catch (error) {
      if (error.message.includes("이메일 확인")) {
        setIsEmailNotConfirmed(true);
      } else {
        setIsEmailNotConfirmed(false);
      }
      setModalMessage(error.message);
      setIsModalOpen(true);
    }
  };

  const resendEmailVerification = async () => {
    try {
      const { error } = await supabase.auth.api.resendEmailConfirmation(
        data.email,
      );
      if (error) throw error;
      alert("인증 이메일이 재전송되었습니다. 메일을 확인해주세요.");
    } catch (error) {
      alert("인증 이메일 재전송 중 문제가 발생했습니다.");
    }
  };

  return (
    <Box
      style={{
        display: "flex",
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Card style={{ width: "400px", margin: "auto", padding: "2rem" }}>
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
                {touchedFields[field] && errors[field] && (
                  <Text color="red" size="1" style={{ minHeight: "20px" }}>
                    {errors[field].message}
                  </Text>
                )}
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

      {/* 모달 컴포넌트 */}
      <Modal isOpen={isModalOpen} onClose={onCloseModal} title="알림">
        <Text>{modalMessage}</Text>
        {isEmailNotConfirmed && (
          <Button onClick={resendEmailVerification}>이메일 인증 재전송</Button>
        )}
      </Modal>
    </Box>
  );
};

export default LoginPage;
