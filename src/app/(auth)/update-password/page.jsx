"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Box, Button, Text, Card, Flex } from "@radix-ui/themes";
import { supabase } from "@/utils/supabase";

const UpdatePasswordPage = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // 새 비밀번호 설정
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) throw error;

      setMessage("비밀번호가 성공적으로 변경되었습니다.");
      setTimeout(() => router.push("/login"), 2000);
    } catch (error) {
      console.error("Password update error:", error);
      setMessage("비밀번호 변경 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
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
      <Card style={{ width: "100%", maxWidth: "400px", padding: "2rem" }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex direction="column" gap="3">
            <Text size="5" weight="bold">
              새 비밀번호 설정
            </Text>
            <input
              type="password"
              placeholder="새 비밀번호"
              {...register("password", {
                required: "비밀번호를 입력해주세요.",
                minLength: {
                  value: 8,
                  message: "비밀번호는 최소 8자 이상이어야 합니다.",
                },
              })}
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
              {errors.password?.message || " "}
            </Text>
            <Button
              type="submit"
              disabled={isSubmitting}
              style={{ width: "100%", padding: "0.75rem" }}
            >
              {isSubmitting ? "비밀번호 변경 중..." : "비밀번호 변경"}
            </Button>
            {message && (
              <Text color="green" size="2" align="center">
                {message}
              </Text>
            )}
          </Flex>
        </form>
      </Card>
    </Box>
  );
};

export default UpdatePasswordPage;
