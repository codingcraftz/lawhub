// src/app/(auth)/signup/page.jsx

"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase";
import { Box, Flex, Text, Button, Card, Separator } from "@radix-ui/themes";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";

const schema = yup.object().shape({
  email: yup
    .string()
    .email("유효한 이메일을 입력해주세요")
    .required("이메일은 필수입니다"),
  name: yup.string().required("이름은 필수입니다"),
  phoneNumber: yup
    .string()
    .matches(/^[0-9]{10,11}$/, "전화번호는 10~11자리의 숫자만 입력해주세요")
    .required("전화번호는 필수입니다"),
  password: yup
    .string()
    .matches(
      /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d가-힣!@#$%^&*]{8,}$/,
      "비밀번호는 최소 8자 이상이며, 영문자와 숫자를 포함해야 합니다",
    )
    .required("비밀번호는 필수입니다"),
  passwordConfirm: yup
    .string()
    .oneOf([yup.ref("password"), null], "비밀번호가 일치하지 않습니다")
    .required("비밀번호 확인은 필수입니다"),
  birthDate: yup
    .date()
    .nullable()
    .typeError("유효한 날짜를 입력해주세요")
    .required("생년월일은 필수입니다"),
  gender: yup
    .string()
    .oneOf(["male", "female", "other"], "유효한 성별을 선택해주세요")
    .required("성별은 필수입니다"),
  agreeTerms: yup
    .boolean()
    .oneOf([true], "이용약관 및 개인정보 처리방침에 동의해야 합니다"),
});

const SignupPage = () => {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onChange",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const onSubmit = async (data) => {
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp(
        {
          email: data.email,
          password: data.password,
        },
      );

      if (signUpError) throw signUpError;

      if (!authData.user) {
        throw new Error("회원가입 중 문제가 발생했습니다. 다시 시도해주세요.");
      }

      const { error: userError } = await supabase.from("users").insert({
        id: authData.user.id,
        email: data.email,
        name: data.name,
        phone_number: data.phoneNumber,
        birth_date: data.birthDate,
        gender: data.gender,
        role: "client",
        is_active: false,
      });

      if (userError) {
        console.error("User insertion error:", userError);
        await supabase.auth.signOut();
        throw userError;
      }

      setModalMessage(
        "회원가입이 완료되었습니다. 관리자의 승인을 기다려주세요.",
      );
      setIsModalOpen(true);
    } catch (error) {
      console.error("Signup error:", error);
      setModalMessage(error.message || "회원가입 중 오류가 발생했습니다.");
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    router.push("/login");
  };

  return (
    <Box
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh", // 높이 수정
      }}
    >
      <Card style={{ width: "400px", padding: "2rem" }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex direction="column" gap="3">
            <Text size="5" weight="bold">
              회원가입
            </Text>
            {[
              "email",
              "name",
              "phoneNumber",
              "password",
              "passwordConfirm",
            ].map((field) => (
              <Box key={field}>
                <input
                  type={
                    field.includes("password")
                      ? "password"
                      : field === "email"
                        ? "email"
                        : "text"
                  }
                  placeholder={
                    field === "phoneNumber"
                      ? "전화번호"
                      : field === "passwordConfirm"
                        ? "비밀번호 확인"
                        : field
                  }
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
            <Box>
              <input
                type="date"
                {...register("birthDate")}
                placeholder="생년월일"
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
                {errors.birthDate?.message || " "}
              </Text>
            </Box>
            <Box>
              <select
                {...register("gender")}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid var(--gray-6)",
                  borderRadius: "var(--radius-2)",
                }}
              >
                <option value="">성별 선택</option>
                <option value="male">남성</option>
                <option value="female">여성</option>
                <option value="other">기타</option>
              </select>
              <Text
                color="red"
                size="1"
                style={{ minHeight: "20px", marginTop: "4px" }}
              >
                {errors.gender?.message || " "}
              </Text>
            </Box>
            {/* 이용약관 동의 */}
            <Flex gap="2" align="center">
              <input type="checkbox" {...register("agreeTerms")} />
              <Text size="2">이용약관 및 개인정보 처리방침에 동의합니다</Text>
            </Flex>
            <Text
              color="red"
              size="1"
              style={{ minHeight: "20px", marginTop: "4px" }}
            >
              {errors.agreeTerms?.message || " "}
            </Text>
            <Button type="submit" disabled={!isValid}>
              회원가입
            </Button>
            <Separator size="4" />
            <Text size="2" align="center">
              이미 계정이 있으신가요?{" "}
              <Link href="/login" style={{ color: "var(--accent-9)" }}>
                로그인
              </Link>
            </Text>
          </Flex>
        </form>
      </Card>

      {/* Radix UI Dialog for messages */}
      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />
          <Dialog.Content
            className="fixed top-1/2 left-1/2 bg-white dark:bg-gray-800 rounded-lg p-6 transform -translate-x-1/2 -translate-y-1/2 max-w-md w-full"
            style={{ zIndex: 1000 }}
          >
            <Dialog.Title className="text-lg font-bold mb-4">알림</Dialog.Title>
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
              <Button onClick={closeModal}>확인</Button>
            </Flex>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </Box>
  );
};

export default SignupPage;
