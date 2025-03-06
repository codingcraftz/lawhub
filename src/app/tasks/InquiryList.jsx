"use client";

import React, { useState } from "react";
import { Box, Text } from "@radix-ui/themes";
import Pagination from "@/components/Pagination"; // 기존과 동일한 페이징 컴포넌트 재활용
import InquiryItem from "./InquiryItem";

export default function InquiryList({
  inquiries,
  user,
  currentPage,
  totalPages,
  onPageChange,
  onCloseInquiry,
}) {
  // "펼침/닫힘" 상태: 단일 inquiry ID를 저장
  const [expandedInquiryId, setExpandedInquiryId] = useState(null);

  const handleToggleExpand = (inquiryId) => {
    setExpandedInquiryId((prev) => (prev === inquiryId ? null : inquiryId));
  };

  if (!inquiries || inquiries.length === 0) {
    return <Text>등록된 문의가 없습니다.</Text>;
  }

  return (
    <Box>
      {inquiries.map((inquiry) => (
        <InquiryItem
          key={inquiry.id}
          inquiry={inquiry}
          user={user}
          expanded={expandedInquiryId === inquiry.id}
          onToggleExpand={handleToggleExpand}
          onCloseInquiry={onCloseInquiry}
        />
      ))}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </Box>
  );
}
