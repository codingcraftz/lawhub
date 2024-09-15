"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase";
import {
  Box,
  Flex,
  Text,
  Button,
  Checkbox,
  Separator,
  Card,
} from "@radix-ui/themes";

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
      /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/,
      "비밀번호는 최소 8자 이상이며, 영문자와 숫자를 포함해야 합니다",
    )
    .required("비밀번호는 필수입니다"),
  passwordConfirm: yup
    .string()
    .oneOf([yup.ref("password"), null], "비밀번호가 일치하지 않습니다")
    .required("비밀번호 확인은 필수입니다"),
  agreeTerms: yup
    .boolean()
    .oneOf([true], "이용약관 및 개인정보 처리방침에 동의해야 합니다"),
});

const SignupPage = () => {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, touchedFields },
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onBlur",
  });
  console.log(errors);
  console.log("touchend", touchedFields);

  const onSubmit = async (data) => {
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });
      if (error) throw error;

      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: authData.user.id,
          name: data.name,
          phone_number: data.phoneNumber,
          is_active: false,
        },
      ]);

      if (profileError) throw profileError;

      alert("회원가입이 완료되었습니다. 관리자의 승인을 기다려주세요.");
      router.push("/login");
    } catch (error) {
      console.error("Signup error:", error);
      alert(error.message);
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
                  placeholder={field === "phoneNumber" ? "전화번호" : field}
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
            <Flex gap="2" align="center">
              <input type="checkbox" {...register("agreeTerms")} />
              <Text size="2">이용약관 및 개인정보 처리방침에 동의합니다</Text>
            </Flex>
            {touchedFields.agreeTerms && errors.agreeTerms && (
              <Text color="red" size="1" style={{ minHeight: "20px" }}>
                {errors.agreeTerms.message}
              </Text>
            )}
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
    </Box>
  );
};

export default SignupPage;
