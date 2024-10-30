// src/app/boards/_components/DeadlineForm.jsx

"use client";

import React from "react";
import { useForm, Controller } from "react-hook-form";
import { Box, Button, Flex, Text } from "@radix-ui/themes";
import { supabase } from "@/utils/supabase";
import CustomDatePicker from "@/components/CustomDatePicker";

const DeadlineForm = ({ caseId, onSuccess, onClose }) => {
  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      const { error } = await supabase.from("case_deadlines").insert({
        case_id: caseId,
        type: data.type,
        deadline_date: data.deadline_date,
      });
      if (error) throw error;
      onSuccess();
    } catch (error) {
      console.error("Error adding deadline:", error);
      alert("기일 추가 중 오류가 발생했습니다.");
    }
  };

  console.log("caseId", caseId);
  return (
    <Box>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Flex direction="column" gap="3">
          <Box>
            <input
              {...register("type", { required: "기일 유형을 입력해주세요" })}
              placeholder="기일 유형 (예: 변론, 수사, 감정)"
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid var(--gray-6)",
                borderRadius: "var(--radius-2)",
              }}
            />
            {errors.type && <Text color="red">{errors.type.message}</Text>}
          </Box>
          <Box>
            <Controller
              name="deadline_date"
              control={control}
              rules={{ required: "기일 날짜를 선택해주세요" }}
              render={({ field }) => (
                <CustomDatePicker
                  selectedDate={field.value}
                  onDateChange={field.onChange}
                  title="기일 날짜 선택"
                />
              )}
            />
            {errors.deadline_date && (
              <Text color="red">{errors.deadline_date.message}</Text>
            )}
          </Box>
          <Flex gap="3" mt="4" justify="end">
            <Button variant="soft" color="gray" onClick={onClose}>
              취소
            </Button>
            <Button type="submit">등록</Button>
          </Flex>
        </Flex>
      </form>
    </Box>
  );
};

export default DeadlineForm;
