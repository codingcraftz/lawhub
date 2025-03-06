"use client";

import React, { useState } from "react";
import { Box, Flex, Button, Text } from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";
import CreditorForm from "./CreditorForm";

export default function Step2_CreditorRegistration({
  assignmentType,
  selectedCreditors,
  setSelectedCreditors,
  removeCreditor,
}) {
  const [isAdding, setIsAdding] = useState(false);

  const handleAddCreditor = (newCreditor) => {
    setSelectedCreditors((prev) => [...prev, newCreditor]);
    setIsAdding(false);
  };

  const labelText = assignmentType === "소송" ? "원고" : "채권자";

  return (
    <Box>
      {selectedCreditors.length > 0 && (
        <Box mb="4">
          <Text size="3" weight="bold" mb="2">
            등록된 {labelText} 목록
          </Text>
          <Flex direction="column" gap="2">
            {selectedCreditors.map((c, index) => (
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
                  {c.name} / {c.registration_number || "주민번호 없음"} /{" "}
                  {c.phone_number || "전화번호 없음"} /{" "}
                  {c.address || "집주소 없음"} /{" "}
                  {c.workplace_name || "직장이름 없음"} /{" "}
                  {c.workplace_address || "직장주소 없음"}
                </Text>
                <Button
                  variant="ghost"
                  color="gray"
                  size="2"
                  onClick={() => removeCreditor(index)}
                >
                  <Cross2Icon width={20} height={20} />
                </Button>
              </Flex>
            ))}
          </Flex>
        </Box>
      )}

      {isAdding ? (
        <CreditorForm onOpenChange={setIsAdding} onSubmit={handleAddCreditor} />
      ) : (
        <Button onClick={() => setIsAdding(true)}>{labelText} 추가하기</Button>
      )}
    </Box>
  );
}
