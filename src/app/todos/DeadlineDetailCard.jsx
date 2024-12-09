"use client";

import React, { useState } from "react";
import { Box, Button, Dialog, Flex, Text } from "@radix-ui/themes";
import { supabase } from "@/utils/supabase";
import DeadlineForm from "../case-management/_components/DeadlineForm";

const DeadlineDetailCard = ({ event, onClose, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleDelete = async () => {
    if (window.confirm("정말로 이 기일을 삭제하시겠습니까?")) {
      try {
        const { error } = await supabase
          .from("case_deadlines")
          .delete()
          .eq("id", event.id);

        if (error) throw error;

        alert("기일이 성공적으로 삭제되었습니다.");
        onUpdate();
        onClose(); // 모달 닫기
      } catch (error) {
        console.error("기일 삭제 중 오류:", error);
        alert("기일 삭제 중 오류가 발생했습니다.");
      }
    }
  };

  return (
    <Box
      style={{
        position: "fixed",
        top: "30%",
        left: "50%",
        minWidth: "600px",
        transform: "translate(-50%, -20%)",
        border: "1px solid var(--gray-9)",
        backgroundColor: "var(--gray-3)",
        boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
        padding: "1.5rem",
        borderRadius: "8px",
        zIndex: 1000,
      }}
    >
      <Flex direction="column" gap="1">
        <Text weight="bold">{event.caseTitle}</Text>
        <Text className="text-sm mb-2" style={{ color: "var(--gray-10)" }}>
          {event.caseDescription}
        </Text>
        <Text>{`${event.clientName}님의 ${event.type}`}</Text>
        <Text>{`장소: ${event.location}`}</Text>
        <Text>{`날짜: ${event.start.toLocaleString("ko-KR")}`}</Text>
        <Flex gap="2" mt="4" justify="end">
          <Button variant="soft" color="red" onClick={handleDelete}>
            삭제
          </Button>
          <Dialog.Root open={isEditing} onOpenChange={setIsEditing}>
            <Dialog.Trigger asChild>
              <Button
                variant="soft"
                style={{ backgroundColor: "var(--gray-5)" }}
              >
                수정
              </Button>
            </Dialog.Trigger>
            <Dialog.Content style={{ overflow: "visible" }}>
              <Dialog.Title>기일 수정</Dialog.Title>
              <DeadlineForm
                caseId={event.caseId}
                editingDeadline={{ ...event, deadline_date: event.start }}
                onSuccess={() => {
                  setIsEditing(false);
                  onUpdate(); // 달력 업데이트
                }}
                onClose={() => setIsEditing(false)}
              />
            </Dialog.Content>
          </Dialog.Root>

          <Button variant="soft" onClick={onClose}>
            확인
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
};

export default DeadlineDetailCard;
