// components/_components/CaseCard.js

"use client";

import React from "react";
import { Card, Flex, Text, Badge } from "@radix-ui/themes";

// 카테고리별 색상 매핑
const categoryColors = {
  민사: "blue",
  형사: "red",
  집행: "green",
  파산: "orange",
  회생: "purple",
};

const CaseCard = ({ caseItem, onClick }) => {
  // 필수 데이터 존재 여부 확인
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
          .map((c) => c.profiles && c.profiles.name)
          .filter((name) => name) // 이름이 존재하는지 확인
          .join(", ")
      : "없음";

  // 담당자 이름 추출
  const staffNames =
    caseItem.case_staff && caseItem.case_staff.length > 0
      ? caseItem.case_staff
          .map((s) => s.profiles && s.profiles.name)
          .filter((name) => name) // 이름이 존재하는지 확인
          .join(", ")
      : "없음";

  return (
    <Card
      style={{
        width: "100%", // 부모 요소의 너비에 맞춤
        cursor: "pointer",
        padding: "1rem",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        transition: "box-shadow 0.3s",
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
      }}
    >
      <Flex direction="column" gap="2">
        <Flex justify="space-between" align="center">
          <Text size="5" weight="bold">
            {caseItem.title}
          </Text>
          <Badge
            color={categoryColors[caseItem.case_categories.name] || "gray"}
            style={{ textTransform: "uppercase" }}
          >
            {caseItem.case_categories.name}
          </Badge>
        </Flex>
        <Text size="3">
          <strong>의뢰인:</strong> {clientNames}
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
