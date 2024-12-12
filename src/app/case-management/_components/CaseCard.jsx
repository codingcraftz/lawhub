// /src/app/case-management/_components/CaseCard.js

"use client";

import React, { useState } from "react";
import { Card, Flex, Text, Badge, Button } from "@radix-ui/themes";
import {
  calculateExpenses,
  calculateInterest,
  getCategoryColor,
  getClientRoleColor,
} from "@/utils/util";
import CaseDetails from "./CaseDetails";
import { useRouter } from "next/navigation";
import BondDetails from "./BondDetails";

const CaseCard = ({ caseItem, isAdmin, fetchCases }) => {
  console.log(isAdmin);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isBondDetailsOpen, setIsBondDetailsOpen] = useState(false);
  const { bonds } = caseItem;
  const bondsData = bonds[0];

  const categoryStyle = getCategoryColor(caseItem.case_categories?.name);
  const router = useRouter();

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

  const handleCardClick = () => {
    if (isAdmin) router.push(`/cases/${caseItem.id}`);
    if (!isAdmin) router.push(`/client/cases/${caseItem.id}`);
  };

  const total1Interest = calculateInterest(
    bondsData?.principal,
    bondsData?.interest_1_rate,
    bondsData?.interest_1_start_date,
    bondsData?.interest_1_end_date,
  );
  const total2Interest = calculateInterest(
    bondsData?.principal,
    bondsData?.interest_2_rate,
    bondsData?.interest_2_start_date,
    bondsData?.interest_2_end_date,
  );

  const totalExpenses = calculateExpenses(bondsData?.expenses);

  const totalPrincipal = Math.floor(
    (bondsData?.principal || 0) +
      total1Interest +
      total2Interest +
      totalExpenses,
  );

  return (
    <>
      <Card
        className="w-full cursor-pointer p-4 rounded-lg shadow-md transition-shadow duration-300 hover:shadow-lg"
        onClick={handleCardClick}
      >
        <Flex className="h-full" direction="column" gap="2">
          <Flex justify="between" align="flex-start">
            <Text size="5" weight="bold" style={{ flex: 1 }}>
              {` ${caseItem.court_name || ""} ${caseItem.case_year || ""} ${caseItem.case_type || ""} ${caseItem.case_subject || ""}`}
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
          <Text size="2" style={{ color: "var(--gray-10)" }}>
            {!!totalPrincipal ? (
              <>
                <strong>원리금:</strong> {totalPrincipal.toLocaleString()}원
              </>
            ) : (
              <>
                <strong>등록된 채권정보가 없습니다.</strong>
              </>
            )}
          </Text>

          <Flex align="center">
            <Text size="3">
              <strong>의뢰인:</strong> {clientNames}
            </Text>
            {caseItem?.client_role !== "미정" && (
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
            <strong>의뢰일: </strong>{" "}
            {caseItem.start_date ? (
              new Date(caseItem.start_date).toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              })
            ) : (
              <Text>시작 예정 사건입니다.</Text>
            )}
            {caseItem.end_date && (
              <Text size="2" color="gray">
                <strong> ~</strong>{" "}
                {new Date(caseItem.end_date).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                })}
              </Text>
            )}
          </Text>
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
            <Button
              className="flex-1"
              variant="soft"
              color="blue"
              size="1"
              onClick={(e) => {
                e.stopPropagation();
                setIsBondDetailsOpen(true); // 채권 정보 열기
              }}
            >
              채권 정보
            </Button>
          </Flex>
        </Flex>
      </Card>

      {/* Case Details Modal */}
      {isDetailsModalOpen && (
        <CaseDetails
          caseData={caseItem}
          isAdmin={isAdmin}
          onSuccess={fetchCases}
          onClose={() => setIsDetailsModalOpen(false)}
        />
      )}
      {isBondDetailsOpen && (
        <BondDetails
          caseId={caseItem.id}
          isAdmin={isAdmin}
          onClose={() => setIsBondDetailsOpen(false)}
        />
      )}
    </>
  );
};

export default CaseCard;
