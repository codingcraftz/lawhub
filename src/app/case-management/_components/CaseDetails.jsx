// src/app/boards/_components/CaseDetails.jsx

"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Box, Flex, Button } from "@radix-ui/themes";
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
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-75 data-[state=open]:animate-overlayShow" />
          <Dialog.Content className="fixed bg-gray-3 left-1/2 top-1/2 max-h-[85vh] w-96 max-w-[650px] -translate-x-1/2 -translate-y-1/2 rounded-md p-[25px] shadow focus:outline-none data-[state=open]:animate-contentShow">
            <Dialog.Title className="font-bold text-xl">
              {` ${caseData.court_name || ""} ${caseData.case_year || ""} ${caseData.case_type || ""} ${caseData.case_number || ""} ${caseData.case_subject || ""}`}
            </Dialog.Title>
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
                      className="ml-auto"
                      size="2"
                      onClick={() => setIsEditModalOpen(true)}
                    >
                      수정
                    </Button>
                  )}

                  <Button className="ml-auto" size="2" onClick={onClose}>
                    확인
                  </Button>
                </Flex>
              </Flex>
            </Flex>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <Dialog.Content style={{ maxWidth: 700 }}>
          <Dialog.Title>사건 수정</Dialog.Title>
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
          <CaseForm
            caseData={caseData}
            onSuccess={() => {
              onSuccess();
              setIsEditModalOpen(false);
            }}
            onClose={() => setIsEditModalOpen(false)}
          />
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
};

export default CaseDetails;
