// src/app/boards/_components/CaseDetails.jsx

"use client";

import React from "react";
import { Dialog, Text, Box, Flex, Button } from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";

const CaseDetails = ({ caseData, onClose }) => {
  if (!caseData) return null;

  const clientNames = caseData.case_clients
    ? caseData.case_clients.map((c) => c.client?.name).join(", ")
    : "없음";

  const opponentNames = caseData.case_opponents
    ? caseData.case_opponents.map((o) => o.opponent?.name).join(", ")
    : "없음";

  const staffNames = caseData.case_staff
    ? caseData.case_staff.map((s) => s.staff?.name).join(", ")
    : "없음";

  return (
    <Dialog.Root open={!!caseData} onOpenChange={onClose}>
      <Dialog.Content
        style={{ minWidth: 500, maxWidth: 1000, width: "fit-content" }}
      >
        <Dialog.Title> {caseData.title}</Dialog.Title>
        <Dialog.Close asChild>
          <Button
            variant="ghost"
            color="gray"
            size="1"
            style={{ position: "absolute", top: 8, right: 8 }}
          >
            <Cross2Icon />
          </Button>
        </Dialog.Close>
        <Flex direction="column" gap="2">
          <Box as="div" className="py-2">
            {caseData.description || "없음"}
          </Box>
          <Box as="div">
            <strong>의뢰인:</strong> {clientNames}
          </Box>
          <Box as="div">
            <strong>상대방:</strong> {opponentNames}
          </Box>
          {staffNames && (
            <Box as="div">
              <strong>담당자:</strong> {staffNames}
            </Box>
          )}
          <Box as="div" style={{ color: "var(--slate-9)" }}>
            <strong>시작일:</strong>{" "}
            {new Date(caseData.start_date).toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })}
          </Box>
          {caseData.end_date && (
            <Box as="div" style={{ color: "var(--gray-6)" }}>
              <strong>종료일:</strong>{" "}
              {new Date(caseData.end_date).toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              })}
            </Box>
          )}
          <Flex>
            <Button className="ml-auto" size="2" onClick={onClose}>
              확인
            </Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default CaseDetails;
