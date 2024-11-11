// components/_components/CaseCard.js

"use client";

import React, { useState } from "react";
import { Card, Flex, Text, Badge, Button, Dialog } from "@radix-ui/themes";
import CaseForm from "@/app/case-management/_components/CaseForm";
import { getCategoryColor, getClientRoleColor } from "@/utils/util";
import CaseDetails from "./CaseDetails";
import { Cross2Icon } from "@radix-ui/react-icons";

const CaseCard = ({ caseItem, onClick, isAdmin, fetchCases }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const categoryStyle = getCategoryColor(caseItem.case_categories?.name);

  if (
    !caseItem ||
    !caseItem.case_categories ||
    !caseItem.case_categories.name
  ) {
    return null;
  }

  const clientNames = caseItem.case_clients
    ? caseItem.case_clients.map((c) => c.client && c.client.name).join(", ")
    : "없음";

  const opponentNames = caseItem.case_opponents
    ? caseItem.case_opponents
        .map((o) => o.opponent && o.opponent.name)
        .join(", ")
    : "없음";

  const staffNames = caseItem.case_staff
    ? caseItem.case_staff.map((s) => s.staff && s.staff.name).join(", ")
    : "없음";

  return (
    <>
      <Card
        className="w-full cursor-pointer p-4 rounded-lg shadow-md transition-shadow duration-300 hover:shadow-lg"
        onClick={onClick}
      >
        <Flex className="h-full" direction="column" gap="2">
          <Flex justify="between" align="flex-start">
            <Text size="5" weight="bold" style={{ flex: 1 }}>
              {caseItem.title}
            </Text>
            <Badge
              className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full `}
              style={{
                alignSelf: "flex-start",
                ...categoryStyle,
              }}
            >
              {caseItem.case_categories.name}
            </Badge>
          </Flex>
          <div style={{ flexGrow: 1 }} />

          <Flex align="center">
            <Text size="3">
              <strong>의뢰인:</strong> {clientNames}
            </Text>
            {caseItem.client_role && caseItem.client_role !== "미정" && (
              <Badge
                size="3"
                style={{
                  background: "none",
                  color: getClientRoleColor(caseItem.client_role),
                }}
              >
                ({caseItem.client_role})
              </Badge>
            )}
          </Flex>
          <Text size="3">
            <strong>상대방:</strong> {opponentNames}
          </Text>
          <Text size="3">
            <strong>담당자:</strong> {staffNames}
          </Text>
          <Text size="2" color="gray">
            <strong>시작일:</strong>{" "}
            {caseItem.start_date ? (
              new Date(caseItem.start_date).toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              })
            ) : (
              <Text>시작 예정 사건입니다.</Text>
            )}
          </Text>
          {caseItem.end_date && (
            <Text size="2" color="gray">
              <strong>종료일:</strong>{" "}
              {new Date(caseItem.end_date).toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              })}
            </Text>
          )}
          <Flex width="100%" gap="0.5rem">
            <Button
              className="flex-1"
              variant="soft"
              color="blue"
              size="1"
              onClick={(e) => {
                e.stopPropagation();
                setIsDetailsModalOpen(true);
              }}
            >
              사건 정보
            </Button>
            {isAdmin && caseItem.status !== "closed" && (
              <Button
                className="flex-1"
                variant="soft"
                color="blue"
                size="1"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditModalOpen(true);
                }}
              >
                수정
              </Button>
            )}
          </Flex>
        </Flex>
      </Card>

      {/* Edit Modal for Admin */}
      {isAdmin && (
        <Dialog.Root open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <Dialog.Content style={{ maxWidth: 500 }}>
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
              caseData={caseItem}
              onSuccess={() => {
                setIsEditModalOpen(false);
                fetchCases();
              }}
              onClose={() => setIsEditModalOpen(false)}
            />
          </Dialog.Content>
        </Dialog.Root>
      )}

      {/* Case Details Modal */}
      {isDetailsModalOpen && (
        <CaseDetails
          caseData={caseItem}
          onClose={() => setIsDetailsModalOpen(false)}
        />
      )}
    </>
  );
};

export default CaseCard;
