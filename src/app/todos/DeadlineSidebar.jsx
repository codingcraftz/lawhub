"use client";

import React, { useState } from "react";
import { Box, Flex, Text, Button, Dialog } from "@radix-ui/themes";
import DeadlineForm from "../case-management/_components/DeadlineForm";

// Sidebar에서 이벤트 클릭시 onEventSelect 호출로 상세보기 가능
// "기일 추가"를 위해 Dialog 사용
const DeadlineSidebar = React.forwardRef(
  ({ events, onClose, onEventSelect, onDeadlineAdded }, ref) => {
    const [isAdding, setIsAdding] = useState(false);

    return (
      <Box
        ref={ref}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "300px",
          height: "100%",
          border: "1px solid var(--gray-8)",
          backgroundColor: "var(--gray-1)",
          boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
          padding: "1rem",
          zIndex: 10,
          overflowY: "auto",
        }}
      >
        <Flex align="center" justify="between">
          <Text size="lg" weight="bold">
            {events.length > 0
              ? `선택한 날짜의 이벤트 (${events.length}개)`
              : "이날은 일정이 없습니다"}
          </Text>
          <Button variant="soft" onClick={onClose}>
            닫기
          </Button>
        </Flex>

        <Flex direction="column" gap="2" mt="2">
          {events.map((event) => (
            <Box
              key={event.id}
              style={{
                padding: "0.5rem",
                border: "1px solid var(--gray-6)",
                borderRadius: "4px",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
              onClick={() => onEventSelect(event)}
            >
              <Text>{event.clientName}</Text>
              <Text size="2" color="gray">
                {new Date(event.start).toLocaleString("ko-KR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </Box>
          ))}
        </Flex>

        <Dialog.Root open={isAdding} onOpenChange={setIsAdding}>
          <Dialog.Trigger asChild>
            <Button variant="soft" style={{ marginTop: "1rem" }}>
              기일 추가
            </Button>
          </Dialog.Trigger>
          <Dialog.Content style={{ overflow: "visible" }}>
            <Dialog.Title>기일 추가</Dialog.Title>
            <DeadlineForm
              onSuccess={() => {
                setIsAdding(false);
                onDeadlineAdded();
              }}
              onClose={() => setIsAdding(false)}
            />
          </Dialog.Content>
        </Dialog.Root>
      </Box>
    );
  },
);

export default DeadlineSidebar;
