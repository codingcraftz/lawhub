"use client";

import React, { useState } from "react";
import { supabase } from "@/utils/supabase";
import { Button, Popover, Text, Flex } from "@radix-ui/themes";
import { Pencil1Icon } from "@radix-ui/react-icons";

export default function CombinedProceduresStatus({
  assignmentId,
  civil_litigation_status,
  asset_declaration_status,
  creditor_attachment_status,
  isAdmin,
  isSosong,
}) {
  // 상태를 로컬로 관리
  const [statuses, setStatuses] = useState({
    civil_litigation_status: civil_litigation_status || "",
    asset_declaration_status: asset_declaration_status || "",
    creditor_attachment_status: creditor_attachment_status || "",
  });

  // 팝오버 오픈 상태
  const [open, setOpen] = useState(false);

  // 각 필드별 가능한 옵션들
  const civilLitigationOptions = ["예정", "진행중", "승소", "패소", "일부승"];
  const assetDeclarationOptions = [
    "예정",
    "진행중",
    "명시선서",
    "감치",
    "각하",
  ];
  const creditorAttachmentOptions = ["예정", "진행중", "완료"];

  // 필드 업데이트 함수
  const updateField = async (field, newValue) => {
    // 이미 같은 값이면 패스
    if (statuses[field] === newValue) return;

    // DB 업데이트
    const { error } = await supabase
      .from("assignments")
      .update({ [field]: newValue })
      .eq("id", assignmentId);

    if (error) {
      console.error("상태 업데이트 오류:", error);
      return;
    }

    // 로컬 상태 갱신
    setStatuses((prev) => ({ ...prev, [field]: newValue }));
  };

  return (
    <div className="flex itemse-center">
      <div className="w-full flex flex-col items-center justify-center">
        {/* 1) 읽기 영역 */}
        <Flex direction="column" gap="1" className="text-sm justify-center">
          <Text>민사소송: {statuses.civil_litigation_status || "-"}</Text>
          {!isSosong && (
            <Text>재산명시: {statuses.asset_declaration_status || "-"}</Text>
          )}
          {!isSosong && (
            <Text>채권압류: {statuses.creditor_attachment_status || "-"}</Text>
          )}
        </Flex>
        {/* 2) 관리자면 pencil 버튼 표시 */}
      </div>
      {isAdmin && (
        <Popover.Root open={open} onOpenChange={setOpen}>
          <Popover.Trigger asChild>
            <Button
              variant="ghost"
              size="2"
              className="flex items-center gap-1"
            >
              <Pencil1Icon />
              <Text size="2">편집</Text>
            </Button>
          </Popover.Trigger>

          <Popover.Content
            className="bg-white shadow-lg border border-gray-300 rounded-lg max-w-[280px] space-y-4"
            sideOffset={8}
          >
            <div>
              <Text className="font-semibold">민사소송</Text>
              <Flex gap="2" wrap="wrap" className="items-center">
                {civilLitigationOptions.map((option) => (
                  <Button
                    key={option}
                    variant={
                      statuses.civil_litigation_status === option
                        ? "outline"
                        : "ghost"
                    }
                    size="1"
                    onClick={() =>
                      updateField("civil_litigation_status", option)
                    }
                  >
                    {option}
                  </Button>
                ))}
              </Flex>
            </div>

            {!isSosong && (
              <div>
                <div className="space-y-2">
                  <Text className="font-semibold">재산명시</Text>
                  <Flex gap="2" wrap="wrap" className="items-center">
                    {assetDeclarationOptions.map((option) => (
                      <Button
                        key={option}
                        variant={
                          statuses.asset_declaration_status === option
                            ? "outline"
                            : "ghost"
                        }
                        size="1"
                        onClick={() =>
                          updateField("asset_declaration_status", option)
                        }
                      >
                        {option}
                      </Button>
                    ))}
                  </Flex>
                </div>

                <div className="space-y-2">
                  <Text className="font-semibold">채권압류</Text>
                  <Flex gap="2" wrap="wrap" className="items-center">
                    {creditorAttachmentOptions.map((option) => (
                      <Button
                        key={option}
                        variant={
                          statuses.creditor_attachment_status === option
                            ? "outline"
                            : "ghost"
                        }
                        size="1"
                        onClick={() =>
                          updateField("creditor_attachment_status", option)
                        }
                      >
                        {option}
                      </Button>
                    ))}
                  </Flex>
                </div>
              </div>
            )}
          </Popover.Content>
        </Popover.Root>
      )}
    </div>
  );
}
