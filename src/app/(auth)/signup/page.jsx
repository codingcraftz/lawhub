"use client";

import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase";
import { Box, Flex, Text, Button, Card, Separator } from "@radix-ui/themes";
import * as Dialog from "@radix-ui/react-dialog";
import CustomDatePicker from "@/components/CustomDatePicker";
import { useUser } from "@/hooks/useUser";
import { signupSchema } from "@/utils/schema";

const SignupPage = () => {
  const router = useRouter();
  const { user } = useUser();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    control,
  } = useForm({
    resolver: yupResolver(signupSchema),
    mode: "onChange",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  const onSubmit = async (data) => {
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp(
        {
          email: data.email,
          password: data.password,
        },
      );
      if (signUpError) {
        let errorMessage = "회원가입 중 오류가 발생했습니다.";
        if (signUpError.message.includes("User already registered")) {
          errorMessage = "이미 등록된 이메일입니다.";
        } else if (signUpError.message.includes("Invalid email")) {
          errorMessage = "유효한 이메일을 입력해주세요.";
        } else if (signUpError.message.includes("Password")) {
          errorMessage = "비밀번호 조건을 확인해주세요.";
        }
        throw new Error(errorMessage);
      }

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
        throw new Error("회원 정보를 저장하는 중 오류가 발생했습니다.");
      }

      await supabase.auth.signOut();
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
  };

  return (
    <Box className="flex justify-center items-center min-h-screen px-4 sm:px-6 md:px-8">
      <Card className="w-full max-w-md p-6 sm:p-8 md:p-10 lg:w-1/3">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex direction="column" gap="3">
            <Text size="5" weight="bold">
              회원가입
            </Text>
            {[
              { field: "email", placeholder: "이메일 (필수)", type: "email" },
              { field: "name", placeholder: "이름 (필수)", type: "text" },
              {
                field: "phoneNumber",
                placeholder: "전화번호 (필수)",
                type: "text",
              },
              {
                field: "password",
                placeholder: "비밀번호 (필수)",
                type: "password",
              },
              {
                field: "passwordConfirm",
                placeholder: "비밀번호 확인 (필수)",
                type: "password",
              },
            ].map(({ field, placeholder, type }) => (
              <Box key={field}>
                <input
                  type={type}
                  placeholder={placeholder}
                  {...register(field)}
                  className="w-full p-2 border rounded-md"
                  style={{
                    border: "1px solid var(--gray-6)",
                  }}
                />
                <Text color="red" size="1" className="min-h-[20px] mt-1">
                  {errors[field]?.message || " "}
                </Text>
              </Box>
            ))}
            <Box className="w-full">
              <Controller
                control={control}
                name="birthDate"
                render={({ field }) => (
                  <CustomDatePicker
                    title="생년월일 (필수)"
                    selectedDate={field.value}
                    onDateChange={(date) =>
                      field.onChange(
                        date ? date.toISOString().split("T")[0] : "",
                      )
                    }
                    openDate="1990-01-01"
                  />
                )}
              />
              <Text color="red" size="1" className="min-h-[20px] mt-1">
                {errors.birthDate?.message || " "}
              </Text>
            </Box>
            <Box>
              <select
                {...register("gender")}
                className="w-full p-2 border rounded-md"
                style={{
                  border: "1px solid var(--gray-6)",
                }}
              >
                <option value="">성별 선택 (필수)</option>
                <option value="male">남성</option>
                <option value="female">여성</option>
                <option value="other">기타</option>
              </select>
              <Text color="red" size="1" className="min-h-[20px] mt-1">
                {errors.gender?.message || " "}
              </Text>
            </Box>
            <Flex gap="2" align="center">
              <input type="checkbox" {...register("agreeTerms")} />
              <Text size="2">
                <span className="text-red-500">(필수) </span>
                <Link
                  className="text-blue-500 underline"
                  href="/term-of-service"
                >
                  이용약관
                </Link>
                {" 및 "}
                <Link
                  className="text-blue-500 underline"
                  href="/privacy-policy"
                >
                  개인정보처리방침
                </Link>
                에 동의합니다
              </Text>
            </Flex>
            <Text color="red" size="1" className="min-h-[20px] mt-1">
              {errors.agreeTerms?.message || " "}
            </Text>
            <Button type="submit" disabled={!isValid} className="w-full">
              회원가입
            </Button>
            <Separator size="4" />
            <Text size="2" align="center">
              이미 계정이 있으신가요?{" "}
              <Link href="/login" className="text-blue-500">
                로그인
              </Link>
            </Text>
          </Flex>
        </form>

        <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
          <Dialog.Content
            className="max-w-[450px] p-8 rounded-md border-2 bg-white fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-lg z-50 text-center"
            style={{
              border: "1px solid var(--gray-6)",
            }}
          >
            <Dialog.Title className="text-lg font-semibold text-blue-500 mb-4">
              알림
            </Dialog.Title>
            <Dialog.Description className="text-base text-gray-700 mb-6">
              {modalMessage}
            </Dialog.Description>
            <Dialog.Close asChild>
              <Button
                variant="soft"
                color="blue"
                className="w-full py-2 rounded-md text-base font-medium"
                onClick={closeModal}
              >
                확인
              </Button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Root>
      </Card>
    </Box>
  );
};

export default SignupPage;
