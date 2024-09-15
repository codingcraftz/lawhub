"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase";
import { useUser } from "@/hooks/useUser";
import { Box, Flex, Text, Button, Card } from "@radix-ui/themes";

const schema = yup.object().shape({
  email: yup
    .string()
    .email("유효한 이메일을 입력해주세요")
    .required("이메일은 필수입니다"),
  password: yup.string().required("비밀번호는 필수입니다"),
});

const LoginPage = () => {
  const router = useRouter();
  const { setUser, fetchUserData } = useUser();
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onChange",
  });

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

      await fetchUserData();
      router.push("/");
    } catch (error) {
      console.error("Login error:", error);
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
      <Card style={{ minWidth: "400px", margin: "auto", padding: "2rem" }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex direction="column" gap="3">
            <Text size="5" weight="bold">
              로그인
            </Text>
            <Box>
              <input
                type="email"
                placeholder="이메일"
                {...register("email")}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid var(--gray-6)",
                  borderRadius: "var(--radius-2)",
                }}
              />
              {errors.email && (
                <Text color="red" size="1">
                  {errors.email.message}
                </Text>
              )}
            </Box>
            <Box>
              <input
                type="password"
                placeholder="비밀번호"
                {...register("password")}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid var(--gray-6)",
                  borderRadius: "var(--radius-2)",
                }}
              />
              {errors.password && (
                <Text color="red" size="1">
                  {errors.password.message}
                </Text>
              )}
            </Box>
            <Button type="submit" disabled={!isValid}>
              로그인
            </Button>
            <Text>
              계정이 없으신가요?{" "}
              <Link href="/signup" style={{ color: "var(--accent-9)" }}>
                회원가입
              </Link>
            </Text>
          </Flex>
        </form>
      </Card>
    </Box>
  );
};

export default LoginPage;
