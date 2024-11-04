"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Box, Button, Text, Card, Flex } from "@radix-ui/themes";
import { supabase } from "@/utils/supabase";
import { passwordResetSchema } from "@/utils/schema";

const UpdatePasswordPage = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(passwordResetSchema),
    mode: "onChange",
  });

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
    <Box className="flex justify-center items-center min-h-screen px-4 sm:px-6 md:px-8">
      <Card className="w-full max-w-md p-6 sm:p-8 md:p-10 lg:w-1/3">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex direction="column" gap="3">
            <Text size="5" weight="bold">
              새 비밀번호 설정
            </Text>
            {["password", "passwordConfirm"].map((field) => (
              <Box key={field} className="mt-2">
                <input
                  type="password"
                  placeholder={
                    field === "password" ? "새 비밀번호" : "비밀번호 확인"
                  }
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
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 mt-4"
            >
              {isSubmitting ? "비밀번호 변경 중..." : "비밀번호 변경"}
            </Button>
            {message && (
              <Text color="green" size="2" align="center" className="mt-2">
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
