// components/_components/CaseCard.js

"use client";

import React from "react";
import { Card, Flex, Text, Badge } from "@radix-ui/themes";

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

const CaseCard = ({ caseItem, onClick }) => {
  // 필수 데이터 존재 여부 확인
  console.log(caseItem);
  if (
    !caseItem ||
    !caseItem.case_categories ||
    !caseItem.case_categories.name
  ) {
    return null;
  }

  // 의뢰인 이름 추출
  const clientNames =
    caseItem.case_clients && caseItem.case_clients.length > 0
      ? caseItem.case_clients
          .map((c) => c.client && c.client.name)
          .filter((name) => name)
          .join(", ")
      : "없음";

  const opponentNames =
    caseItem.case_opponents && caseItem.case_opponents.length > 0
      ? caseItem.case_opponents
          .map((o) => o.opponent && o.opponent.name)
          .filter((name) => name)
          .join(", ")
      : "없음";

  // 담당자 이름 추출
  const staffNames =
    caseItem.case_staff && caseItem.case_staff.length > 0
      ? caseItem.case_staff
          .map((s) => s.staff && s.staff.name)
          .filter((name) => name)
          .join(", ")
      : "없음";

  return (
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
          {new Date(caseItem.start_date).toLocaleDateString()}
        </Text>
        {caseItem.end_date && (
          <Text size="2" color="gray">
            <strong>종료일:</strong>{" "}
            {new Date(caseItem.end_date).toLocaleDateString()}
          </Text>
        )}
      </Flex>
    </Card>
  );
};

export default CaseCard;
