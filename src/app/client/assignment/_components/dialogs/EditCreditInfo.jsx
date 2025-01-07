"use client";

import React, { useState, useEffect } from "react";
import { Box, Button, Flex, Text } from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";
import * as Dialog from "@radix-ui/react-dialog";

const EditCreditInfo = ({
  open,
  onOpenChange,
  debtor,
  onSave,
  initialCreditInfo,
}) => {
  const [creditInfo, setCreditInfo] = useState(
    debtor?.owned ? Object.entries(debtor.owned) : [],
  );

  useEffect(() => {
    if (open) {
      setCreditInfo(Object.entries(initialCreditInfo || {})); // owned 데이터를 key-value 배열로 변환
    }
  }, [open, initialCreditInfo]);

  const handleAddField = () => {
    setCreditInfo((prev) => [...prev, ["", ""]]);
  };

  const handleChangeField = (index, field, value) => {
    setCreditInfo((prev) =>
      prev.map((entry, i) =>
        i === index
          ? [
              field === "key" ? value : entry[0],
              field === "value" ? value : entry[1],
            ]
          : entry,
      ),
    );
  };

  const handleRemoveField = (index) => {
    setCreditInfo((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const updatedInfo = Object.fromEntries(
      creditInfo.filter(([key, value]) => key && value),
    );
    onSave(updatedInfo);
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Overlay className="fixed inset-0 bg-black opacity-50 z-30" />
      <Dialog.Content className="fixed bg-gray-3 left-1/2 top-1/2 max-h-[85vh] w-full max-w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-md p-[25px] shadow focus:outline-none z-40 overflow-y-auto">
        <Dialog.Title className="font-bold text-xl">신용정보 수정</Dialog.Title>
        <Dialog.Close asChild>
          <Button
            variant="ghost"
            color="gray"
            style={{ position: "absolute", top: 24, right: 24 }}
          >
            <Cross2Icon width={25} height={25} />
          </Button>
        </Dialog.Close>

        <Box className="flex flex-col mt-4">
          <Flex direction="column" gap="3">
            {creditInfo.map(([key, value], index) => (
              <Flex key={index} align="center" gap="2">
                <input
                  placeholder="항목"
                  value={key}
                  onChange={(e) =>
                    handleChangeField(index, "key", e.target.value)
                  }
                  className="flex-1 p-2 border border-gray-6 rounded"
                />
                <input
                  placeholder="디테일"
                  value={value}
                  onChange={(e) =>
                    handleChangeField(index, "value", e.target.value)
                  }
                  className="flex-1 p-2 border border-gray-6 rounded"
                />
                <Button
                  variant="ghost"
                  color="red"
                  onClick={() => handleRemoveField(index)}
                >
                  삭제
                </Button>
              </Flex>
            ))}
            <Button variant="soft" onClick={handleAddField}>
              신용정보 추가하기
            </Button>
          </Flex>
          <Flex justify="end" mt="4" gap="2">
            <Button
              variant="soft"
              color="gray"
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
            <Button variant="soft" color="blue" onClick={handleSave}>
              저장
            </Button>
          </Flex>
        </Box>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default EditCreditInfo;
