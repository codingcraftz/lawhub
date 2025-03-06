// src/app/client/assignment/[id]/Inquiry.jsx

"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Flex, Text, Button, Badge } from "@radix-ui/themes";
import { motion } from "framer-motion";
import InquiryForm from "../_components/dialogs/InquiryForm"; // Dialog 폼
import InquiryComments from "./InquiryComments";

const Inquiry = ({ assignmentId, user }) => {
  const [inquiries, setInquiries] = useState([]);
  const [expandedInquiryId, setExpandedInquiryId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentInquiry, setCurrentInquiry] = useState(null);
  const [showAll, setShowAll] = useState(false); // 더보기/접기 토글
  const isAdmin = user?.role === "staff" || user?.role === "admin";

  // DB에서 문의 목록 가져오기
  const fetchInquiries = async () => {
    const { data, error } = await supabase
      .from("assignment_inquiries")
      .select(
        `
        id,
        title,
        inquiry,
        status,
        created_at,
        user: user_id(id, name)
      `,
      )
      .eq("assignment_id", assignmentId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("문의 목록 가져오기 오류:", error);
      return;
    }

    // 진행중 먼저
    const sorted = (data || []).sort((a, b) => {
      if (a.status === "ongoing" && b.status === "closed") return -1;
      if (a.status === "closed" && b.status === "ongoing") return 1;
      return new Date(a.created_at) - new Date(b.created_at);
    });

    setInquiries(sorted);
  };

  useEffect(() => {
    fetchInquiries();
  }, [assignmentId]);

  // 새 문의 등록 (Dialog 열기)
  const openCreateForm = () => {
    setCurrentInquiry(null);
    setIsFormOpen(true);
  };

  // 문의 수정 (Dialog 열기)
  const openEditForm = (inquiry) => {
    setCurrentInquiry(inquiry);
    setIsFormOpen(true);
  };

  // Dialog 저장 완료 콜백
  const handleFormSuccess = () => {
    fetchInquiries();
    setIsFormOpen(false);
    setCurrentInquiry(null);
  };

  // 문의 삭제
  const handleDeleteInquiry = async (id) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    const { error } = await supabase
      .from("assignment_inquiries")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("문의 삭제 오류:", error);
      alert("문의 삭제 중 오류가 발생했습니다.");
    } else {
      fetchInquiries();
    }
  };

  // 문의 상태 토글 (ongoing <-> closed)
  const toggleStatus = async (inquiry) => {
    const newStatus = inquiry.status === "ongoing" ? "closed" : "ongoing";
    const { error } = await supabase
      .from("assignment_inquiries")
      .update({ status: newStatus })
      .eq("id", inquiry.id);

    if (error) {
      console.error("상태 변경 오류:", error);
      alert("문의 상태 변경 중 오류가 발생했습니다.");
    } else {
      fetchInquiries();
    }
  };

  // 문의 펼치기/접기
  const toggleExpand = (id) => {
    setExpandedInquiryId((prev) => (prev === id ? null : id));
  };

  // 상태 뱃지
  const StatusBadge = ({ status }) => {
    if (status === "ongoing") {
      return <Badge color="green">진행</Badge>;
    }
    if (status === "closed") {
      return <Badge color="red">완료</Badge>;
    }
    return null;
  };

  // 진행중인 문의 수
  const ongoingCount = inquiries.filter(
    (inq) => inq.status === "ongoing",
  ).length;
  // 더보기/접기 적용된 목록
  const visibleInquiries = showAll ? inquiries : inquiries.slice(0, 3);

  return (
    <section className="flex flex-col mb-6 p-4 rounded shadow-md shadow-gray-7 bg-gray-2 text-gray-12">
      {/* 헤더 */}
      <Flex justify="between" align="center" className="mb-3 flex-wrap gap-2">
        <Text className="text-lg font-semibold flex-1">
          문의 목록{" "}
          <span className="text-md text-gray-10">
            ({ongoingCount}개 진행중)
          </span>
        </Text>
        {isAdmin && (
          <Button variant="soft" onClick={openCreateForm}>
            등록
          </Button>
        )}
      </Flex>

      {/* 목록 */}
      {inquiries.length === 0 ? (
        <Text>등록된 문의가 없습니다.</Text>
      ) : (
        <ul className="space-y-3">
          {visibleInquiries.map((inquiry) => {
            const isExpanded = expandedInquiryId === inquiry.id;
            const isOwner = inquiry.user?.id === user?.id;

            return (
              <li
                key={inquiry.id}
                className={`bg-gray-3 border border-gray-6 p-3 rounded ${
                  inquiry.status === "closed" ? "opacity-80" : ""
                }`}
              >
                {/* 상단 영역: (제목, 상태 뱃지, 작성자/날짜 등) */}
                <Flex
                  justify="between"
                  align="start"
                  className="flex-wrap gap-2"
                >
                  <Box className="flex-1">
                    {/* 제목 + 상태 */}
                    <Flex align="center" gap="2" className="mb-1 flex-wrap">
                      <StatusBadge status={inquiry.status} />
                      <Text className="font-medium text-sm md:text-base">
                        {inquiry.title || "제목 없음"}
                      </Text>
                    </Flex>
                    {/* 작성자: OOO (날짜) */}
                    <Text size="2" color="gray" className="text-xs md:text-sm">
                      작성자: {inquiry.user?.name || "알 수 없음"} (
                      {new Date(inquiry.created_at).toLocaleDateString(
                        "ko-KR",
                        {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                      )
                    </Text>
                  </Box>

                  {/* 우측 버튼들 */}
                  <Flex className="items-center gap-2">
                    {/* 수정/삭제: 관리자이면서 본인일 때 */}
                    {isAdmin && isOwner && (
                      <>
                        <Button
                          variant="soft"
                          size="1"
                          onClick={() => openEditForm(inquiry)}
                        >
                          수정
                        </Button>
                        <Button
                          variant="soft"
                          size="1"
                          color="red"
                          onClick={() => handleDeleteInquiry(inquiry.id)}
                        >
                          삭제
                        </Button>
                      </>
                    )}

                    {/* 완료하기 / 진행중으로: 관리자만 */}
                    {isAdmin && (
                      <Button
                        variant="soft"
                        size="1"
                        onClick={() => toggleStatus(inquiry)}
                      >
                        {inquiry.status === "ongoing"
                          ? "완료하기"
                          : "진행중으로"}
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="1"
                      onClick={() => toggleExpand(inquiry.id)}
                    >
                      {isExpanded ? "닫기" : "상세보기"}
                    </Button>
                  </Flex>
                </Flex>

                {/* 펼쳐지는 상세 */}
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{
                    height: isExpanded ? "auto" : 0,
                    opacity: isExpanded ? 1 : 0,
                  }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  {isExpanded && (
                    <Box className="mt-4 bg-gray-2 p-3 border border-gray-6 rounded">
                      <Text className="mb-4">
                        {inquiry.inquiry || "문의 내용이 없습니다."}
                      </Text>
                      {/* 댓글 컴포넌트 */}
                      <InquiryComments inquiryId={inquiry.id} user={user} />
                    </Box>
                  )}
                </motion.div>
              </li>
            );
          })}
        </ul>
      )}

      {/* 더보기 / 접기 */}
      {inquiries.length > 3 && (
        <Button
          className="mt-4"
          variant="ghost"
          size="1"
          onClick={() => setShowAll((prev) => !prev)}
        >
          {showAll ? "접기" : "더보기"}
        </Button>
      )}

      {/* 폼 다이얼로그 (등록/수정) */}
      {isFormOpen && (
        <InquiryForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          assignmentId={assignmentId}
          inquiryData={currentInquiry}
          user={user}
          onSuccess={handleFormSuccess}
        />
      )}
    </section>
  );
};

export default Inquiry;
