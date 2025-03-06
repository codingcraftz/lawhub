"use client";

import React, { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { supabase } from "@/utils/supabase";
import { Box, Flex, Button, Text } from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";

export default function EnforcementDeadlineForm({
  open,
  onOpenChange,
  enforcementId,
  deadlineData,
  onSuccess,
}) {
  const [formData, setFormData] = useState({
    type: "",
    deadline_date: "",
    location: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (deadlineData) {
      setFormData({
        type: deadlineData.type || "",
        deadline_date: deadlineData.deadline_date
          ? deadlineData.deadline_date.slice(0, 16)
          : "",
        location: deadlineData.location || "",
      });
    } else {
      setFormData({ type: "", deadline_date: "", location: "" });
    }
  }, [deadlineData]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.type || !formData.deadline_date) {
      alert("타입과 기일 날짜는 필수입니다.");
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (deadlineData?.id) {
        const { error } = await supabase
          .from("enforcement_deadlines")
          .update({
            type: formData.type,
            deadline_date: formData.deadline_date,
            location: formData.location,
          })
          .eq("id", deadlineData.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("enforcement_deadlines").insert({
          enforcement_id: enforcementId,
          type: formData.type,
          deadline_date: formData.deadline_date,
          location: formData.location,
        });

        if (error) throw error;
      }
      alert("저장되었습니다.");
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Error saving enforcement deadline:", err);
      alert("기일 저장 중 오류가 발생했습니다.");
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
        <Flex justify="between" align="center" className="mb-3">
          <Dialog.Title className="font-bold text-xl">
            기일 {deadlineData ? "수정" : "추가"}
          </Dialog.Title>
          <Dialog.Close asChild>
            <Button variant="ghost" color="gray">
              <Cross2Icon width={20} height={20} />
            </Button>
          </Dialog.Close>
        </Flex>

        <form onSubmit={handleSave}>
          <Box mb="3">
            <Text size="2" color="gray" className="mb-1">
              타입
            </Text>
            <input
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="
                w-full p-2
                border border-gray-6
                rounded text-gray-12
                focus:outline-none focus:border-gray-8
              "
              placeholder="예: 변론기일, 선고기일, 압류시행기일 등"
            />
          </Box>

          <Box mb="3">
            <Text size="2" color="gray" className="mb-1">
              기일
            </Text>
            <input
              type="datetime-local"
              name="deadline_date"
              value={formData.deadline_date}
              onChange={handleChange}
              className="
                w-full p-2
                border border-gray-6
                rounded text-gray-12
                focus:outline-none focus:border-gray-8
              "
            />
          </Box>

          <Box mb="3">
            <Text size="2" color="gray" className="mb-1">
              장소 (선택)
            </Text>
            <input
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="
                w-full p-2
                border border-gray-6
                rounded text-gray-12
                focus:outline-none focus:border-gray-8
              "
              placeholder="ex) 법원 3호실"
            />
          </Box>

          <Flex justify="end" gap="2">
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
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
