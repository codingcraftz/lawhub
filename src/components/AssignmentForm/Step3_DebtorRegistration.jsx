"use client";

import React, { useState } from "react";
import { Box, Flex, Button, Text } from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";
import DebtorForm from "./DebtorForm";

export default function Step3_DebtorRegistration({
  assignmentType,
  selectedDebtors,
  setSelectedDebtors,
  removeDebtor,
}) {
  const [isAdding, setIsAdding] = useState(false);

  const handleAddDebtor = (newDebtor) => {
    setSelectedDebtors((prev) => [...prev, newDebtor]);
    setIsAdding(false);
  };

  // Label (피고 or 채무자)
  const labelText = assignmentType === "소송" ? "피고" : "채무자";

  return (
    <Box>
      {/* 이미 등록된 목록 */}
      {selectedDebtors.length > 0 && (
        <Box mb="4">
          <Text size="3" weight="bold" mb="2">
            등록된 {labelText} 목록
          </Text>
          <Flex direction="column" gap="2">
            {selectedDebtors.map((d, index) => (
              <Flex
                key={index}
                align="center"
                style={{
                  backgroundColor: "var(--gray-2)",
                  borderRadius: 4,
                  padding: "4px 8px",
                }}
              >
                <Text mr="1">
                  {d.name} / {d.registration_number || "주민번호 없음"} /{" "}
                  {d.phone_number || "전화번호 없음"} /{" "}
                  {d.address || "주소 없음"} /{" "}
                  {d.workplace_name || "직장이름 없음"} /{" "}
                  {d.workplace_address || "직장주소 없음"}
                </Text>
                <Button
                  variant="ghost"
                  color="gray"
                  size="2"
                  onClick={() => removeDebtor(index)}
                >
                  <Cross2Icon width={20} height={20} />
                </Button>
              </Flex>
            ))}
          </Flex>
        </Box>
      )}

      {/* 채무자(피고) 추가하기 버튼 or 폼 */}
      {isAdding ? (
        <DebtorForm
          onOpenChange={setIsAdding} // 폼 안에서 닫기 누르면 false로
          onSubmit={handleAddDebtor}  // 폼 submit하면 newDebtor 추가
        />
      ) : (
        <Button onClick={() => setIsAdding(true)}>
          {labelText} 추가하기
        </Button>
      )}
    </Box>
  );
}
