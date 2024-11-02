// src/app/boards/_components/DeadlineForm.jsx

"use client";

import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { Box, Button, Flex, Text } from "@radix-ui/themes";
import { supabase } from "@/utils/supabase";
import CustomDatePicker from "@/components/CustomDatePicker";

const DeadlineForm = ({ caseId, onSuccess, onClose, editingDeadline }) => {
  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
    setValue,
  } = useForm({
    defaultValues: editingDeadline || {},
  });

  useEffect(() => {
    if (editingDeadline) {
      setValue("type", editingDeadline.type);
      setValue("deadline_date", new Date(editingDeadline.deadline_date));
    }
  }, [editingDeadline, setValue]);

  const onSubmit = async (data) => {
    try {
      if (editingDeadline) {
        // 수정 모드
        const { error } = await supabase
          .from("case_deadlines")
          .update({
            type: data.type,
            deadline_date: data.deadline_date,
          })
          .eq("id", editingDeadline.id);
        if (error) throw error;
      } else {
        // 추가 모드
        const { error } = await supabase.from("case_deadlines").insert({
          case_id: caseId,
          type: data.type,
          deadline_date: data.deadline_date,
        });
        if (error) throw error;
      }
      onSuccess();
    } catch (error) {
      console.error("기일 저장 중 오류:", error);
      alert("기일 저장 중 오류가 발생했습니다.");
    }
  };

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
                  title="기일 날짜 및 시간 선택"
                  showTimeSelect={true} // 시간 선택 활성화
                  timeIntervals={10} // 15분 간격
                  timeFormat="HH:mm" // 24시간 형식
                  dateFormat="yyyy-MM-dd HH:mm" // 날짜와 시간 형식
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
            <Button type="submit">{editingDeadline ? "수정" : "등록"}</Button>
          </Flex>
        </Flex>
      </form>
    </Box>
  );
};

export default DeadlineForm;
