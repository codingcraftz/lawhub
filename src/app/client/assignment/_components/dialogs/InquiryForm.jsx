// src/app/clinet/assignment/_components/dialogs/InquiryForm.jsx

"use client";

import React, { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { supabase } from "@/utils/supabase";
import { useForm } from "react-hook-form";
import { Box, Flex, Text, Button, TextArea } from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";

export default function InquiryForm({
  open,
  onOpenChange,
  assignmentId,
  inquiryData, // 수정 시 가져올 데이터
  user,
  onSuccess,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      inquiry: "",
      status: "ongoing",
    },
  });

  // 만약 수정하려는 데이터가 있다면 폼에 반영
  useEffect(() => {
    if (inquiryData) {
      setValue("title", inquiryData.title || "");
      setValue("inquiry", inquiryData.inquiry || "");
      setValue("status", inquiryData.status || "ongoing");
    }
  }, [inquiryData, setValue]);

  // 폼 제출
  const onSubmit = async (formValues) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const payload = {
        assignment_id: assignmentId,
        user_id: inquiryData ? inquiryData.user_id : user?.id,
        title: formValues.title.trim(),
        inquiry: formValues.inquiry.trim(),
        status: formValues.status,
      };

      // 등록 vs 수정
      if (inquiryData?.id) {
        // 수정
        const { error } = await supabase
          .from("assignment_inquiries")
          .update(payload)
          .eq("id", inquiryData.id);

        if (error) throw error;
      } else {
        // 신규 등록
        payload.created_at = new Date().toISOString(); // created_at 직접 세팅(선택)
        const { error } = await supabase
          .from("assignment_inquiries")
          .insert(payload);

        if (error) throw error;
      }

      alert("저장되었습니다.");
      onOpenChange(false); // 다이얼로그 닫기
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("문의 저장 오류:", err);
      alert("문의 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Overlay className="fixed inset-0 bg-black opacity-50 z-40" />
      <Dialog.Content
        className="
          fixed 
          left-1/2 top-1/2
          w-full max-w-[500px]
          -translate-x-1/2 -translate-y-1/2
          bg-gray-2 border border-gray-6
          rounded-md p-4
          shadow-md shadow-gray-7
          text-gray-12
          z-50
          focus:outline-none
          overflow-y-auto
        "
      >
        {/* 헤더 */}
        <Flex justify="between" align="center" className="mb-3">
          <Dialog.Title className="font-bold text-xl">
            {inquiryData ? "문의 수정" : "문의 등록"}
          </Dialog.Title>
          <Dialog.Close asChild>
            <Button variant="ghost" color="gray">
              <Cross2Icon width={20} height={20} />
            </Button>
          </Dialog.Close>
        </Flex>

        {/* 폼 */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex direction="column" gap="3">
            {/* 제목 */}
            <Box>
              <Text size="2" color="gray" className="mb-1">
                제목
              </Text>
              <input
                {...register("title", { required: true })}
                placeholder="문의 제목"
                className="w-full p-2 border border-gray-6 rounded"
              />
              {errors.title && (
                <Text color="red" size="2">
                  제목을 입력해주세요.
                </Text>
              )}
            </Box>

            {/* 문의 내용 */}
            <Box>
              <Text size="2" color="gray" className="mb-1">
                문의 내용
              </Text>
              <TextArea
                {...register("inquiry", { required: true })}
                placeholder="문의 내용을 입력하세요"
                className="w-full border border-gray-6 rounded p-2"
              />
              {errors.inquiry && (
                <Text color="red" size="2">
                  문의 내용을 입력해주세요.
                </Text>
              )}
            </Box>

            {/* 버튼 영역 */}
            <Flex justify="end" gap="2">
              <Button
                variant="soft"
                color="gray"
                type="button"
                onClick={() => onOpenChange(false)}
              >
                닫기
              </Button>
              <Button variant="solid" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "저장 중..." : "저장"}
              </Button>
            </Flex>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
