"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { supabase } from "@/utils/supabase";
import { Box, Flex, Text, Button } from "@radix-ui/themes";

const schema = yup.object().shape({
  name: yup.string().required("이름은 필수입니다"),
  email: yup.string().email("유효한 이메일을 입력해주세요"),
  phone_number: yup
    .string()
    .matches(/^[0-9]{10,11}$/, "유효한 전화번호를 입력해주세요"),
  birth_date: yup.date().nullable().typeError("유효한 날짜를 입력해주세요"),
  gender: yup
    .string()
    .oneOf(["male", "female", "other"], "유효한 성별을 선택해주세요"),
});

const ClientForm = ({ client, onSuccess }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: client || {},
  });

  const onSubmit = async (data) => {
    try {
      if (client) {
        const { error } = await supabase
          .from("clients")
          .update(data)
          .eq("id", client.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("clients").insert([data]);
        if (error) throw error;
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving client:", error);
      alert("고객 정보 저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Flex direction="column" gap="3">
        <Box>
          <input
            placeholder="이름"
            {...register("name")}
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid var(--gray-6)",
              borderRadius: "var(--radius-2)",
            }}
          />
          {errors.name && (
            <Text color="red" size="1">
              {errors.name.message}
            </Text>
          )}
        </Box>
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
            type="tel"
            placeholder="전화번호"
            {...register("phone_number")}
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid var(--gray-6)",
              borderRadius: "var(--radius-2)",
            }}
          />
          {errors.phone_number && (
            <Text color="red" size="1">
              {errors.phone_number.message}
            </Text>
          )}
        </Box>
        <Box>
          <input
            type="date"
            {...register("birth_date")}
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid var(--gray-6)",
              borderRadius: "var(--radius-2)",
            }}
          />
          {errors.birth_date && (
            <Text color="red" size="1">
              {errors.birth_date.message}
            </Text>
          )}
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
          {errors.gender && (
            <Text color="red" size="1">
              {errors.gender.message}
            </Text>
          )}
        </Box>
        <Button type="submit">{client ? "수정" : "등록"}</Button>
      </Flex>
    </form>
  );
};

export default ClientForm;
