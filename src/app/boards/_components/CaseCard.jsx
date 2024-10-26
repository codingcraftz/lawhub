// components/_components/CaseCard.js

"use client";

import React, { useState } from "react";
import { Card, Flex, Text, Badge, Button, Dialog } from "@radix-ui/themes";
import CaseForm from "@/app/boards/_components/CaseForm";

const getCategoryColor = (category) => {
  const colors = {
    민사: "bg-blue-200 text-blue-800",
    형사: "bg-red-200 text-red-800",
    집행: "bg-green-200 text-green-800",
    파산: "bg-orange-200 text-orange-800",
    회생: "bg-purple-200 text-purple-800",
  };
  return colors[category] || "bg-gray-200 text-gray-800";
};

const CaseCard = ({ caseItem, onClick, isAdmin, fetchCases }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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
        <Flex direction="column" gap="2">
          <Flex justify="between" align="center">
            <Text size="5" weight="bold">
              {caseItem.title}
            </Text>
            <Badge
              className={`px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(caseItem.case_categories.name)}`}
            >
              {caseItem.case_categories.name}
            </Badge>
          </Flex>
          <Text size="3">
            <strong>의뢰인:</strong> {clientNames}
          </Text>
          <Text size="3">
            <strong>상대방:</strong> {opponentNames}
          </Text>
          <Text size="3">
            <strong>담당자:</strong> {staffNames}
          </Text>
          <Text size="2" color="gray">
            <strong>시작일:</strong>{" "}
            {new Date(caseItem.start_date).toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })}
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
          {/* Admin Edit Button */}
          {isAdmin && (
            <Button
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
                닫기
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
    </>
  );
};

export default CaseCard;
