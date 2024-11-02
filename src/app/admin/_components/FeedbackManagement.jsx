"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Text, Table, Flex, Button, Dialog } from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";

const FeedbackManagement = () => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // 피드백 데이터를 가져오는 함수
  const fetchFeedback = async () => {
    const { data, error } = await supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("피드백 불러오기 오류:", error);
    } else {
      setFeedbackList(data);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const handleViewFeedback = (feedback) => {
    setSelectedFeedback(feedback);
    setIsDialogOpen(true);
  };

  return (
    <Box>
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>이름</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>이메일</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>제목</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>날짜</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>보기</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {feedbackList.map((feedback) => (
            <Table.Row key={feedback.id}>
              <Table.Cell>{feedback.name}</Table.Cell>
              <Table.Cell>{feedback.email}</Table.Cell>
              <Table.Cell>
                {feedback.title.length > 20
                  ? feedback.title.slice(0, 20) + "..."
                  : feedback.title}
              </Table.Cell>
              <Table.Cell>
                {new Date(feedback.created_at).toLocaleDateString("ko-KR")}
              </Table.Cell>
              <Table.Cell>
                <Button
                  size="1"
                  variant="soft"
                  onClick={() => handleViewFeedback(feedback)}
                >
                  자세히 보기
                </Button>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>

      {/* 피드백 상세보기 다이얼로그 */}
      <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Dialog.Content style={{ maxWidth: 450 }}>
          <Dialog.Title>{selectedFeedback?.title}</Dialog.Title>
          <Dialog.Close asChild>
            <Button
              variant="ghost"
              size="1"
              style={{ position: "absolute", top: 8, right: 8 }}
              onClick={() => setIsDialogOpen(false)}
            >
              <Cross2Icon />
            </Button>
          </Dialog.Close>
          {selectedFeedback && (
            <Box>
              <Text as="p" size="3">
                이름: {selectedFeedback.name}
              </Text>
              <Text as="p" size="3" mb="4">
                이메일: {selectedFeedback.email}
              </Text>

              <Text size="4" style={{ whiteSpace: "pre-wrap" }}>
                {selectedFeedback.message}
              </Text>
            </Box>
          )}
        </Dialog.Content>
      </Dialog.Root>
    </Box>
  );
};

export default FeedbackManagement;
