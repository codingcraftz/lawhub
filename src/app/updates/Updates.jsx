"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Text, Button, Flex, Dialog } from "@radix-ui/themes";
import { useUser } from "@/hooks/useUser";
import FeedbackForm from "./FeedbackForm";
import Pagination from "@/components/Pagination";
import { Cross2Icon } from "@radix-ui/react-icons";

const Updates = () => {
  const [updates, setUpdates] = useState([]);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [expandedUpdate, setExpandedUpdate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { user } = useUser();

  const itemsPerPage = 5;

  useEffect(() => {
    fetchUpdates();
  }, [currentPage]);

  const fetchUpdates = async () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;

    const { data, count, error } = await supabase
      .from("updates")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(start, end - 1);

    if (error) {
      console.error("업데이트 불러오기 오류:", error);
    } else {
      setUpdates(data);
      setTotalPages(Math.ceil(count / itemsPerPage));
    }
  };

  const handleFeedbackClick = () => {
    if (user) {
      setIsFeedbackModalOpen(true);
    } else {
      alert("회원만 이용할 수 있습니다.");
      window.location.href = "/signup";
    }
  };

  const toggleUpdate = (id) => {
    setExpandedUpdate(expandedUpdate === id ? null : id);
  };

  return (
    <Box className="container mx-auto p-4">
      {/* 안내문 섹션 */}
      <Box
        className="p-4 mb-14 rounded-md"
        style={{
          backgroundColor: "var(--gray-2)",
          border: "1px solid var(--gray-6)",
          color: "var(--gray-11)",
        }}
      >
        <Text as="p" size="4" weight="medium" style={{ lineHeight: "1.5" }}>
          💬 LawHub는 현재 초기 개발 단계에 있습니다.
        </Text>
        <Text as="p" size="4" weight="medium" style={{ lineHeight: "1.5" }}>
          🚀 서비스의 완성도를 높이기 위해 여러분의 소중한 의견을 기다리고
          있습니다.
        </Text>
        <Text as="p" size="4" weight="medium" style={{ lineHeight: "1.5" }}>
          🛠️ 버그나 개선 사항이 있다면 피드백을 통해 알려주시면 감사하겠습니다.
        </Text>
        <Text as="p" size="4" weight="medium" style={{ lineHeight: "1.5" }}>
          🙌 함께 더 나은 서비스를 만들어 나가요!
        </Text>
      </Box>

      {/* 공지 사항 헤더와 피드백 버튼 */}
      <Flex justify="between" className="mb-6 items-center">
        <Text as="h1" size="6" weight="bold">
          공지 사항
        </Text>
        <Button variant="solid" color="blue" onClick={handleFeedbackClick}>
          피드백 보내기
        </Button>
      </Flex>

      {/* 업데이트 리스트 */}
      {updates.map((update) => (
        <Box
          key={update.id}
          className="mb-4 p-4 border rounded-lg cursor-pointer transition duration-150 ease-in-out hover:shadow-lg"
          style={{
            borderColor: "var(--gray-6)",
            backgroundColor:
              expandedUpdate === update.id ? "var(--gray-2)" : "transparent",
          }}
          onClick={() => toggleUpdate(update.id)}
        >
          <Text
            as="h2"
            size="5"
            weight="bold"
            mb="2"
            style={{
              color:
                expandedUpdate === update.id
                  ? "var(--blue-9)"
                  : "var(--gray-12)",
              cursor: "pointer",
              transition: "color 0.15s ease-in-out",
            }}
          >
            {update.title}
          </Text>
          <Text
            size="3"
            color="gray"
            mb="2"
            style={{ marginLeft: "8px", fontWeight: 500 }}
          >
            {new Date(update.created_at).toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })}
          </Text>
          {expandedUpdate === update.id && (
            <Box className="mt-2">
              <Text
                size="4"
                style={{ color: "var(--gray-11)", whiteSpace: "pre-wrap" }}
              >
                {update.content}
              </Text>
            </Box>
          )}
        </Box>
      ))}

      {/* 페이지네이션 */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* 피드백 모달 */}
      <Dialog.Root
        open={isFeedbackModalOpen}
        onOpenChange={setIsFeedbackModalOpen}
      >
        <Dialog.Content style={{ maxWidth: 450 }}>
          <Dialog.Title>피드백 보내기</Dialog.Title>
          <Dialog.Close asChild>
            <Button
              variant="ghost"
              color="gray"
              size="1"
              style={{ position: "absolute", top: 8, right: 8 }}
              onClick={() => setIsFeedbackModalOpen(false)}
            >
              <Cross2Icon />
            </Button>
          </Dialog.Close>
          <FeedbackForm
            user={user}
            onClose={() => setIsFeedbackModalOpen(false)}
          />
        </Dialog.Content>
      </Dialog.Root>
    </Box>
  );
};

export default Updates;
