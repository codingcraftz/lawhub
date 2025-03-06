"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Box, Flex, Text, Badge, Button } from "@radix-ui/themes";
import {
  ArrowTopRightIcon,
  EyeOpenIcon,
  EyeClosedIcon,
  CheckIcon,
} from "@radix-ui/react-icons";
import InquiryComments from "./InquiryComments";

export default function InquiryItem({
  inquiry,
  user,
  expanded,
  onToggleExpand,
  onCloseInquiry,
}) {
  const router = useRouter();

  // 권한 확인: 예시로 "admin"이거나, inquiry.user_id === 내 id 면 '완료' 버튼 노출
  // (또는 staff 역할이면서 assignment_assignees에 등록되어 있다면 열어둘 수도 있음)
  const isAdmin = user?.role === "admin";
  const isOwner = user?.id === inquiry.user_id;
  const canClose = inquiry.status === "ongoing" && (isAdmin || isOwner);

  // 상태 배지
  const StatusBadge = ({ status }) => {
    switch (status) {
      case "ongoing":
        return <Badge color="green">진행 중</Badge>;
      case "closed":
        return <Badge color="red">완료</Badge>;
      default:
        return <Badge>알 수 없음</Badge>;
    }
  };

  // 의뢰(assignment) 정보
  const getAssignmentNames = (assignment) => {
    const { assignment_clients = [], assignment_groups = [] } =
      assignment || {};
    if (assignment_groups.length > 0) {
      const groupNames = assignment_groups
        .map((g) => g.group?.name)
        .filter(Boolean);
      return groupNames.length
        ? `그룹: ${groupNames.join(", ")}`
        : "그룹: (이름 없음)";
    } else {
      const clientNames = assignment_clients
        .map((c) => c.client?.name)
        .filter(Boolean);
      return clientNames.length
        ? `의뢰인: ${clientNames.join(", ")}`
        : "의뢰인: (이름 없음)";
    }
  };

  const assignmentNames = getAssignmentNames(inquiry.assignment);
  const assignmentDesc = inquiry.assignment?.description;

  return (
    <Box
      key={inquiry.id}
      className={`
        relative mb-4 p-4 rounded-lg border border-gray-6
        shadow hover:shadow-lg transition-shadow
        ${inquiry.status === "closed" ? "opacity-80" : ""}
      `}
    >
      {/* 상단 라인 */}
      <Flex justify="between" align="start" className="flex-wrap gap-3">
        <Box className="flex-1">
          {/* 상태 배지 + 사건설명 */}
          <Flex align="center" gap="2" className="mb-2 flex-wrap">
            <StatusBadge status={inquiry.status} />
            <Text size="4" weight="bold">
              {assignmentDesc || "사건 설명 없음"}
            </Text>
          </Flex>

          {/* 문의 제목 */}
          <Text size="3" weight="medium" className="mb-1 text-gray-12">
            {inquiry.title}
          </Text>
          {/* 의뢰인/그룹 정보 */}
          <Text as="p" size="2" color="gray" className="mb-1">
            {assignmentNames}
          </Text>
          {/* 작성자 정보 */}
          <Flex justify="between">
            <Text size="2" color="gray" className="mb-1">
              작성자: {inquiry.user?.name || "-"}
            </Text>
          </Flex>
        </Box>

        {/* 우측 버튼들 */}
        <Flex direction="column" gap="2" align="end">
          {/* 의뢰 페이지로 이동 */}
          <Button
            variant="soft"
            size="2"
            onClick={() =>
              router.push(`/client/assignment/${inquiry.assignment_id}`)
            }
          >
            <ArrowTopRightIcon className="mr-1" />
            의뢰 페이지
          </Button>

          {/* 완료 처리 버튼 */}
          {canClose && (
            <Button
              variant="soft"
              color="green"
              size="2"
              onClick={() => onCloseInquiry(inquiry.id)}
            >
              <CheckIcon className="mr-1" />
              완료
            </Button>
          )}

          {/* 펼침/닫힘 토글 버튼 */}
          <Button
            variant="ghost"
            size="2"
            onClick={() => onToggleExpand(inquiry.id)}
          >
            {expanded ? (
              <>
                <EyeClosedIcon className="mr-1" />
                닫기
              </>
            ) : (
              <>
                <EyeOpenIcon className="mr-1" />
                세부 사항
              </>
            )}
          </Button>
        </Flex>
      </Flex>

      {/* 펼쳐진 경우, 세부 영역 */}
      {expanded && (
        <Box
          className="
            mt-4 pt-4 border-t border-gray-6
            bg-gray-1/50 rounded-sm
          "
        >
          {/* 생성일 */}
          <Text size="2" color="gray" className="mb-2">
            생성일:{" "}
            {new Date(inquiry.created_at).toLocaleDateString("ko-KR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>

          {/* 문의 내용 / 추가 정보 */}
          <Text size="3" className="mb-3 whitespace-pre-wrap text-gray-12">
            <strong>문의 내용:</strong> {inquiry.inquiry || "내용 없음"}
          </Text>
          {inquiry.details && (
            <Text size="3" className="mb-3 whitespace-pre-wrap text-gray-12">
              <strong>추가 정보:</strong> {inquiry.details}
            </Text>
          )}

          {/* 댓글 섹션 */}
          <InquiryComments inquiryId={inquiry.id} user={user} />
        </Box>
      )}
    </Box>
  );
}
