"use client";

import React, { useState, useEffect } from "react";
import { Box, Text, Flex } from "@radix-ui/themes";
import { supabase } from "@/utils/supabase";
import InquiryTab from "./InquiryTab";
import InquiryList from "./InquiryList";

const PAGE_SIZE = 10;

export default function Inquiry({ user }) {
  const [activeTab, setActiveTab] = useState("ongoing"); // "ongoing" / "closed" 등
  const [inquiries, setInquiries] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchInquiries = async () => {
    if (!user) return;

    try {
      // 초기 쿼리: assignment_inquiries 테이블에서 필요한 컬럼 + 관계식 조회
      let query = supabase
        .from("assignment_inquiries")
        .select(
          `
            id,
            assignment_id,
            user_id,
            inquiry,
            details,
            created_at,
            status,
            title,
            assignment:assignments (
              description,
              assignment_clients (
                client_id,
                client:users(name)
              ),
              assignment_groups (
                group_id,
                group:groups(name)
              )
            ),
            user:user_id(name)
          `,
          { count: "exact" },
        )
        .order("created_at", { ascending: false });

      // ───────────────────────────────────
      // (1) 역할(Role)에 따른 필터 로직
      // ───────────────────────────────────
      if (user.role === "admin") {
        // 관리자: 모든 문의 조회(필터 없음)
      } else if (user.role === "staff") {
        // 스탭: assignment_assignees 에 등록된 '내가 담당자로 설정된' 의뢰에 속한 문의만
        const { data: assignees, error: assigneeError } = await supabase
          .from("assignment_assignees")
          .select("assignment_id")
          .eq("user_id", user.id);
        if (assigneeError) throw assigneeError;

        const assignmentIds = assignees?.map((a) => a.assignment_id) || [];
        // assignment_inquiries.assignment_id 가 위 assignmentIds 안에 있는 레코드만 필터
        query = query.in("assignment_id", assignmentIds);
      } else {
        // 그 외(예: client) → 내가 직접 등록한 문의만
        query = query.eq("user_id", user.id);
      }

      // ───────────────────────────────────
      // (2) 탭 상태에 따른 필터 로직
      // ───────────────────────────────────
      if (activeTab === "ongoing") {
        query = query.eq("status", "ongoing");
      } else if (activeTab === "closed") {
        query = query.eq("status", "closed");
      }
      // 필요에 따라 새로운 탭(예: "all")이면 필터 없이 조회하게끔 추가하셔도 됩니다.

      // ───────────────────────────────────
      // (3) 페이징 처리
      // ───────────────────────────────────
      const from = (currentPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error, count } = await query.range(from, to);
      if (error) throw error;

      setInquiries(data || []);
      setTotalPages(Math.ceil((count || 0) / PAGE_SIZE));
    } catch (err) {
      console.error(err);
    }
  };

  // 종료(완료) 처리
  const handleCloseInquiry = async (inquiryId) => {
    if (!window.confirm("정말로 종료(완료) 처리하시겠습니까?")) return;

    try {
      const { error } = await supabase
        .from("assignment_inquiries")
        .update({ status: "closed" })
        .eq("id", inquiryId);
      if (error) throw error;
      fetchInquiries(); // 목록 재조회
    } catch (err) {
      console.error(err);
    }
  };

  // 탭 변경
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchInquiries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentPage, user?.id]);

  return (
    <Box className="p-4 w-full">
      <Text size="6" weight="bold" className="mb-4">
        의뢰 문의 관리
      </Text>

      {/* 상단 탭 */}
      <Flex gap="2" className="mb-4">
        <InquiryTab
          title="진행 중"
          isActive={activeTab === "ongoing"}
          onClick={() => handleTabChange("ongoing")}
        />
        <InquiryTab
          title="종료(완료)"
          isActive={activeTab === "closed"}
          onClick={() => handleTabChange("closed")}
        />
        {/* 필요하다면 "전체(All)" 등 추가 */}
      </Flex>

      {/* 문의 리스트 */}
      <InquiryList
        inquiries={inquiries}
        user={user}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onCloseInquiry={handleCloseInquiry}
      />
    </Box>
  );
}
