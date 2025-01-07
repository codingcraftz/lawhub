// src/app/boards/_components/CaseDetails.jsx

"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Box, Flex, Button, Text } from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";
import CaseForm from "./CaseForm";

const CaseDetails = ({ caseData, onClose, onSuccess, isAdmin }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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
    <>
      <Dialog.Root open={!!caseData} onOpenChange={onClose}>
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-75 z-30" />
        <Dialog.Content className="fixed bg-gray-3 left-1/2 top-1/2 max-h-[85vh] min-w-[420px] max-w-[650px] -translate-x-1/2 -translate-y-1/2 rounded-md p-[25px] shadow focus:outline-none data-[state=open]:animate-contentShow z-40">
          <Dialog.Title className="font-bold text-xl">
            {` ${caseData.court_name || ""} ${caseData.case_year || ""} ${caseData.case_type || ""} ${caseData.case_number || ""} ${caseData.case_subject || ""}`}
          </Dialog.Title>
          <Dialog.Close asChild>
            <Button
              variant="ghost"
              color="gray"
              style={{ position: "absolute", top: 24, right: 24 }}
            >
              <Cross2Icon width={25} height={25} />
            </Button>
          </Dialog.Close>
          <Flex direction="column" gap="2">
            <Box as="div" className="py-2">
              <Text className="text-sm text-gray-10">
                {caseData.description || "없음"}
              </Text>
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
            <Flex align="center">
              <Box as="div" style={{ color: "var(--slate-9)" }}>
                <strong>의뢰일:</strong>{" "}
                {new Date(caseData.start_date).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                })}
              </Box>
              {caseData.end_date && (
                <Box as="div" style={{ color: "var(--slate-9)" }}>
                  {"~ "}
                  {new Date(caseData.end_date).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  })}
                </Box>
              )}
              <Flex className="ml-auto gap-2">
                {isAdmin && (
                  <Button
                    color="blue"
                    variant="soft"
                    className="ml-auto p-2 rounded-md"
                    size="2"
                    onClick={() => setIsEditModalOpen(true)}
                  >
                    수정
                  </Button>
                )}

                <Button
                  color="blue"
                  variant="soft"
                  className="ml-auto p-2 rounded-md"
                  size="2"
                  onClick={onClose}
                >
                  확인
                </Button>
              </Flex>
            </Flex>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      {isAdmin && (
        <CaseForm
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          caseData={caseData}
          onSuccess={() => {
            onSuccess();
            setIsEditModalOpen(false);
          }}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
    </>
  );
};

export default CaseDetails;
