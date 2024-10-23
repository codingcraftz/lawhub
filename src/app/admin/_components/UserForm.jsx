// src/app/admin/_components/UserForm.jsx

"use client";

import React, { useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { useForm } from "react-hook-form";
import { Box, Flex, Button, Text, Dialog } from "@radix-ui/themes";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Cross2Icon } from "@radix-ui/react-icons";

const schema = yup.object().shape({
  email: yup
    .string()
    .email("유효한 이메일을 입력해주세요")
    .required("이메일은 필수입니다"),
  name: yup.string().required("이름은 필수입니다"),
  phone_number: yup.string(),
  birth_date: yup.date(),
  gender: yup.string(),
  role: yup
    .string()
    .oneOf(["admin", "staff", "client"])
    .required("역할은 필수입니다"),
  is_active: yup.boolean().required("활성화 여부는 필수입니다"),
});

const UserForm = ({ editingUser, onSuccess, onClose }) => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    if (editingUser) {
      setValue("email", editingUser.email);
      setValue("name", editingUser.name);
      setValue("phone_number", editingUser.phone_number);
      setValue(
        "birth_date",
        editingUser.birth_date ? editingUser.birth_date.split("T")[0] : "",
      );
      setValue("gender", editingUser.gender);
      setValue("role", editingUser.role);
      setValue("is_active", editingUser.is_active);
    }
  }, [editingUser, setValue]);

  const onSubmit = async (data) => {
    try {
      if (editingUser) {
        // 사용자 정보 업데이트 (이메일 제외)
        const response = await fetch("/api/updateUser", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: editingUser.id,
            name: data.name,
            phone_number: data.phone_number,
            birth_date: data.birth_date,
            gender: data.gender,
            role: data.role,
            is_active: data.is_active,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || "사용자 업데이트 중 오류가 발생했습니다.",
          );
        }
      } else {
        // 새로운 사용자 생성 요청
        const response = await fetch("/api/createUser", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: data.email,
            name: data.name,
            phone_number: data.phone_number,
            birth_date: data.birth_date,
            gender: data.gender,
            role: data.role,
            is_active: data.is_active,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || "사용자 생성 중 오류가 발생했습니다.",
          );
        }
      }

      onSuccess();
    } catch (error) {
      console.error("Error saving user:", error);
      alert(error.message || "사용자 저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Flex direction="column" gap="4">
        <Box>
          <input
            placeholder="이메일"
            type="email"
            {...register("email")}
            disabled={!!editingUser} // 수정 시 이메일 변경 불가
            style={{
              width: "100%",
              padding: "0.6rem 0.8rem",
              border: "2px solid var(--gray-6)",
              borderRadius: "var(--radius-1)",
            }}
          />
          {errors.email && (
            <Text color="red" size="2">
              {errors.email.message}
            </Text>
          )}
        </Box>
        <Box>
          <input
            placeholder="이름"
            type="text"
            {...register("name")}
            style={{
              width: "100%",
              padding: "0.6rem 0.8rem",
              border: "2px solid var(--gray-6)",
              borderRadius: "var(--radius-1)",
            }}
          />
          {errors.name && (
            <Text color="red" size="2">
              {errors.name.message}
            </Text>
          )}
        </Box>
        <Box>
          <input
            placeholder="핸드폰 번호"
            type="text"
            {...register("phone_number")}
            style={{
              width: "100%",
              padding: "0.6rem 0.8rem",
              border: "2px solid var(--gray-6)",
              borderRadius: "var(--radius-1)",
            }}
          />
          {errors.phone_number && (
            <Text color="red" size="2">
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
              padding: "0.6rem 0.8rem",
              border: "2px solid var(--gray-6)",
              borderRadius: "var(--radius-1)",
            }}
          />
          {errors.birth_date && (
            <Text color="red" size="2">
              {errors.birth_date.message}
            </Text>
          )}
        </Box>
        <Box>
          <select
            {...register("gender")}
            style={{
              width: "100%",
              padding: "0.6rem 0.8rem",
              border: "2px solid var(--gray-6)",
              borderRadius: "var(--radius-1)",
            }}
          >
            <option value="">성별 선택</option>
            <option value="male">남성</option>
            <option value="female">여성</option>
            <option value="other">기타</option>
          </select>
          {errors.gender && (
            <Text color="red" size="2">
              {errors.gender.message}
            </Text>
          )}
        </Box>
        <Box>
          <select
            {...register("role")}
            style={{
              width: "100%",
              padding: "0.6rem 0.8rem",
              border: "2px solid var(--gray-6)",
              borderRadius: "var(--radius-1)",
            }}
          >
            <option value="admin">관리자</option>
            <option value="staff">직원</option>
            <option value="client">고객</option>
          </select>
          {errors.role && (
            <Text color="red" size="2">
              {errors.role.message}
            </Text>
          )}
        </Box>
        <Box>
          <select
            {...register("is_active")}
            style={{
              width: "100%",
              padding: "0.6rem 0.8rem",
              border: "2px solid var(--gray-6)",
              borderRadius: "var(--radius-1)",
            }}
          >
            <option value="true">활성화</option>
            <option value="false">비활성화</option>
          </select>
          {errors.is_active && (
            <Text color="red" size="2">
              {errors.is_active.message}
            </Text>
          )}
        </Box>
        <Flex gap="3" mt="4" justify="end">
          <Button variant="soft" color="gray" onClick={onClose}>
            취소
          </Button>
          <Button type="submit">{editingUser ? "수정" : "추가"}</Button>
        </Flex>
      </Flex>
    </form>
  );
};

export default UserForm;
