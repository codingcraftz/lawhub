"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { Button, Flex, Text } from "@radix-ui/themes";
import * as Dialog from "@radix-ui/react-dialog";
import { useForm } from "react-hook-form";
import { Cross2Icon } from "@radix-ui/react-icons";

export default function EnforcementForm({
  open,
  onOpenChange,
  assignmentId,
  enforcementData,
  onSuccess,
}) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      type: "",
      status: "ongoing",
      amount: 0,
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (enforcementData) {
      setValue("type", enforcementData.type || "");
      setValue("status", enforcementData.status || "ongoing");
      setValue("amount", enforcementData.amount || 0);
    }
  }, [enforcementData, setValue]);

  const onSubmit = async (formData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = {
        assignment_id: assignmentId,
        type: formData.type || "",
        status: formData.status || "ongoing",
        amount: formData.amount ? parseInt(formData.amount, 10) : 0,
      };

      if (enforcementData?.id) {
        const { error } = await supabase
          .from("enforcements")
          .update(payload)
          .eq("id", enforcementData.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("enforcements").insert(payload);

        if (error) throw error;
      }
      alert("저장되었습니다.");
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Enforcement save error:", error);
      alert("강제집행 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!enforcementData?.id) {
      alert("삭제할 항목이 없습니다.");
      return;
    }
    if (!confirm("정말로 이 항목을 삭제하시겠습니까?")) return;

    try {
      const { error } = await supabase
        .from("enforcements")
        .delete()
        .eq("id", enforcementData.id);

      if (error) throw error;
      alert("항목이 성공적으로 삭제되었습니다.");
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Error deleting enforcement item:", err);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Overlay className="fixed inset-0 bg-black opacity-50 z-40" />
      <Dialog.Content
        className="
          fixed 
          left-1/2 top-1/2 
          max-h-[85vh] min-w-[400px] max-w-[600px]
          -translate-x-1/2 -translate-y-1/2 
          p-6 
          bg-gray-2 border border-gray-6 
          shadow-md shadow-gray-7 
          rounded-md 
          focus:outline-none 
          z-50 
          overflow-y-auto
        "
      >
        <Flex justify="between" align="center" className="mb-4">
          <Dialog.Title className="font-bold text-xl text-gray-12">
            {enforcementData ? "회수활동 수정" : "회수활동 등록"}
          </Dialog.Title>
          <Dialog.Close asChild>
            <Button variant="ghost" color="gray">
              <Cross2Icon width={20} height={20} />
            </Button>
          </Dialog.Close>
        </Flex>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex direction="column" gap="4">
            {/* 상태 */}
            <div>
              <Text size="2" color="gray" className="mb-1">
                상태
              </Text>
              <select {...register("status")}>
                <option value="ongoing">진행</option>
                <option value="closed">완료</option>
              </select>
            </div>

            {/* 종류 */}
            <div>
              <Text size="2" color="gray" className="mb-1">
                종류
              </Text>
              <input
                type="text"
                {...register("type")}
                className="
                  w-full p-2
                  border border-gray-6
                  rounded text-gray-12
                  focus:outline-none focus:border-gray-8
                "
                placeholder="예: 압류, 추심, 부동산 강제집행 등"
              />
            </div>

            {/* 금액 */}
            <div>
              <Text size="2" color="gray" className="mb-1">
                금액
              </Text>
              <input
                type="number"
                {...register("amount")}
                className="
                  w-full p-2
                  border border-gray-6
                  rounded text-gray-12
                  focus:outline-none focus:border-gray-8
                "
                placeholder="회수금액(원)"
              />
            </div>
            <Flex justify="end" gap="2" mt="2">
              {enforcementData && (
                <Button
                  type="button"
                  color="red"
                  variant="soft"
                  onClick={handleDelete}
                >
                  삭제
                </Button>
              )}
              <Button
                variant="soft"
                color="gray"
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
