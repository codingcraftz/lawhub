// src/app/client/assignment/_components/dialogs/TimelineForm.jsx

"use client";

import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { supabase } from "@/utils/supabase";
import { Box, Flex, Button, Text } from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";

export default function TimelineForm({
  open,
  onOpenChange,
  assignmentId,
  timelineData,
  onSuccess,
}) {
  const [descriptionValue, setDescriptionValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (timelineData) {
      setDescriptionValue(timelineData.description || "");
    } else {
      setDescriptionValue("");
    }
  }, [timelineData]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!descriptionValue.trim()) {
      alert("진행 상황을 입력해주세요.");
      return;
    }

    if (!assignmentId) {
      alert("assignmentId가 누락되었습니다. 다시 시도해주세요.");
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (timelineData) {
        // 수정인 경우
        const { error: timelineError } = await supabase
          .from("assignment_timelines")
          .update({ description: descriptionValue })
          .eq("id", timelineData.id);
        if (timelineError) throw timelineError;

        // 기존 알림 업데이트
        const { error: updateError } = await supabase
          .from("notifications")
          .update({
            title: timelineData.title,
            description:
              descriptionValue.length > 50
                ? descriptionValue.slice(0, 50) + "..."
                : descriptionValue,
            is_read: false,
            updated_at: new Date().toISOString(),
          })
          .eq("assignment_id", assignmentId)
          .eq("type", "timeline_update")
          .eq("reference_id", timelineData.id);

        if (updateError) throw updateError;

        // 사건 정보 조회
        const { data: assignmentData, error: assignmentError } = await supabase
          .from("assignments")
          .select(
            `
						id,
						assignment_creditors (id, name),
						assignment_debtors (id, name)
					`,
          )
          .eq("id", assignmentId)
          .single();

        if (assignmentError) throw assignmentError;

        // 채권자와 채무자 이름 추출
        const creditor =
          assignmentData.assignment_creditors?.[0]?.name || "정보 없음";
        const debtor =
          assignmentData.assignment_debtors?.[0]?.name || "정보 없음";
        const title = `채권자: ${creditor} / 채무자: ${debtor}`;

        // 기존 알림이 있으면 업데이트
        const { data: existingNotifications, error: notificationQueryError } =
          await supabase
            .from("notifications")
            .select("id")
            .eq("assignment_id", assignmentId)
            .eq("type", "timeline_update")
            .eq("reference_id", timelineData.id);

        if (notificationQueryError) throw notificationQueryError;

        if (existingNotifications?.length > 0) {
          const { error: updateError } = await supabase
            .from("notifications")
            .update({
              title: title,
              description:
                descriptionValue.length > 50
                  ? descriptionValue.slice(0, 50) + "..."
                  : descriptionValue,
              is_read: false,
              updated_at: new Date().toISOString(),
            })
            .eq("assignment_id", assignmentId)
            .eq("type", "timeline_update")
            .eq("reference_id", timelineData.id);

          if (updateError) throw updateError;
        }
      } else {
        // 새로운 타임라인 추가
        const { data: newTimeline, error } = await supabase
          .from("assignment_timelines")
          .insert({
            assignment_id: assignmentId,
            description: descriptionValue,
          })
          .select()
          .single();

        if (error) throw error;

        // 1. 담당자 목록 조회
        const { data: assignees, error: assigneesError } = await supabase
          .from("assignment_assignees")
          .select(
            `
						user_id,
						users (
							id,
							role
						)
					`,
          )
          .eq("assignment_id", assignmentId);

        if (assigneesError) throw assigneesError;

        // 2. 모든 admin 사용자 조회
        const { data: adminUsers, error: adminError } = await supabase
          .from("users")
          .select("id, role")
          .eq("role", "admin");

        if (adminError) throw adminError;

        // 3. 알림을 받을 사용자 ID 수집 (Set으로 중복 제거)
        let userIds = new Set();

        // 모든 admin 추가
        adminUsers.forEach((user) => userIds.add(user.id));

        // 담당자 중 staff인 경우만 추가 (admin은 이미 추가됨)
        assignees.forEach((assignee) => {
          if (assignee.users.role === "staff") {
            userIds.add(assignee.user_id);
          }
        });

        // 사건 정보 조회
        const { data: assignmentData, error: assignmentError } = await supabase
          .from("assignments")
          .select(
            `
						id,
						assignment_creditors (id, name),
						assignment_debtors (id, name)
					`,
          )
          .eq("id", assignmentId)
          .single();

        if (assignmentError) throw assignmentError;

        const creditor =
          assignmentData.assignment_creditors?.[0]?.name || "정보 없음";
        const debtor =
          assignmentData.assignment_debtors?.[0]?.name || "정보 없음";
        const title = `채권자: ${creditor} / 채무자: ${debtor}`;

        // 새 알림 생성
        const notifications = Array.from(userIds).map((userId) => ({
          user_id: userId,
          assignment_id: assignmentId,
          type: "timeline_update",
          reference_id: newTimeline.id,
          title: title,
          message: "사건 진행상황 알림",
          description:
            descriptionValue.length > 50
              ? descriptionValue.slice(0, 50) + "..."
              : descriptionValue,
          is_read: false,
          created_at: new Date().toISOString(),
        }));

        if (notifications.length > 0) {
          const { error: notificationError } = await supabase
            .from("notifications")
            .insert(notifications);

          if (notificationError) throw notificationError;
        }
      }

      alert("저장되었습니다.");
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Error saving timeline:", err);
      alert("저장 중 오류가 발생했습니다.");
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
        "
      >
        <Flex justify="between" align="center" className="mb-3">
          <Dialog.Title className="font-bold text-xl">
            타임라인 {timelineData ? "수정" : "추가"}
          </Dialog.Title>
          <Dialog.Close asChild>
            <Button variant="ghost" color="gray">
              <Cross2Icon width={20} height={20} />
            </Button>
          </Dialog.Close>
        </Flex>

        <form onSubmit={handleSave}>
          <Box className="flex flex-col gap-2">
            <Text size="2" color="gray">
              진행 상황
            </Text>
            <textarea
              value={descriptionValue}
              onChange={(e) => setDescriptionValue(e.target.value)}
              rows={4}
              className="
                w-full p-2
                border border-gray-6
                rounded text-gray-12
                focus:outline-none focus:border-gray-8
              "
              placeholder="사건진행상황 입력 예) 지급명령중, 재판중"
            />
          </Box>
          <Flex justify="end" gap="2" className="mt-4">
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
