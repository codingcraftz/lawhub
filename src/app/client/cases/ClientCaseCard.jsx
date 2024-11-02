// components/_components/CaseCard.js

"use client";

import React, { useState } from "react";
import { Card, Flex, Text, Badge, Button } from "@radix-ui/themes";
import { getCategoryColor, getClientRoleColor } from "@/utils/util";
import CaseDetails from "@/app/case-management/_components/CaseDetails";

const ClientCaseCard = ({ caseItem, onClick }) => {
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const categoryStyle = getCategoryColor(caseItem.case_categories.name);
  if (
    !caseItem ||
    !caseItem.case_categories ||
    !caseItem.case_categories.name
  ) {
    return null;
  }

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

  // const staffNames =
  //   caseItem.case_staff && caseItem.case_staff.length > 0
  //     ? caseItem.case_staff
  //         .map((s) => s.staff && s.staff.name)
  //         .filter((name) => name)
  //         .join(", ")
  //     : "없음";

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
              className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full `}
              style={{
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
            {caseItem.client_role && (
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
        </Flex>
      </Card>
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

export default ClientCaseCard;
