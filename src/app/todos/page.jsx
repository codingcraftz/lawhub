"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { useUser } from "@/hooks/useUser";
import {
  Text,
  Flex,
  Button,
  Table,
  TextArea,
  Box,
  Dialog,
} from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";
import TodoList from "./TodoList";
import useRoleRedirect from "@/hooks/userRoleRedirect";

const TodosPage = () => {
  const [requests, setRequests] = useState([]);
  const { user } = useUser();
  const [approvingRequest, setApprovingRequest] = useState(null);
  const [approvalDescription, setApprovalDescription] = useState("");

  useRoleRedirect(["staff", "admin"], "/login");

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from("requests")
      .select(
        `
      *,
      requester:users(id, name),
      case_timelines (
        id,
        description,
        type,
        case_id,
        case:cases(title)
      )
    `,
      )
      .eq("receiver_id", user.id)
      .eq("status", "pending");

    if (error) {
      console.error("Error fetching requests:", error);
    } else {
      setRequests(data);
    }
  };
  const handleRequestAction = async (request, action) => {
    if (action === "accepted") {
      setApprovingRequest(request);
    } else {
      try {
        const { error } = await supabase
          .from("requests")
          .update({ status: "rejected" })
          .eq("id", request.id);
        if (error) throw error;
        fetchRequests();
      } catch (error) {
        console.error(`Error ${action} request:`, error);
      }
    }
  };
  const handleApprovalSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data: timelineData, error: timelineError } = await supabase
        .from("case_timelines")
        .insert({
          case_id: approvingRequest.case_timelines.case_id,
          type: "완료",
          description: approvalDescription,
          created_by: user.id,
          status: "완료",
        })
        .select();

      if (timelineError) throw timelineError;

      const { error: requestError } = await supabase
        .from("requests")
        .update({ status: "accepted" })
        .eq("id", approvingRequest.id);

      if (requestError) throw requestError;

      const { error: notificationError } = await supabase
        .from("notifications")
        .insert({
          user_id: approvingRequest.requester_id,
          case_timeline_id: timelineData[0].id,
          case_id: approvingRequest.case_timelines.case_id,
          type: "요청 승인",
          message: `${approvalDescription}`,
          is_read: false,
        });

      if (notificationError) throw notificationError;

      setApprovingRequest(null);
      setApprovalDescription("");
      fetchRequests();
    } catch (error) {
      console.error("Error approving request:", error);
      alert("요청 승인 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="p-4 max-w-7xl w-full mx-auto relative flex flex-col">
      <Flex justify="between" align="center" className="mb-4">
        <Text size="8" weight="bold">
          요청 목록
        </Text>
      </Flex>
      <Table.Root mb="6">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>유형</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>요청자</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>사건</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>설명</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>작업</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {requests.map((request) => (
            <Table.Row key={request.id}>
              <Table.Cell>{request.case_timelines.type}</Table.Cell>
              <Table.Cell>{request.requester?.name || "알 수 없음"}</Table.Cell>
              <Table.Cell>
                {request.case_timelines.case?.title || "없음"}
              </Table.Cell>
              <Table.Cell>{request.case_timelines.description}</Table.Cell>
              <Table.Cell>
                <Flex gap="2">
                  <Button
                    onClick={() => handleRequestAction(request, "accepted")}
                  >
                    완료
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleRequestAction(request, "rejected")}
                  >
                    거절
                  </Button>
                </Flex>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>

      <TodoList />

      {/* 승인 모달 */}
      <Dialog.Root
        open={!!approvingRequest}
        onOpenChange={() => setApprovingRequest(null)}
      >
        <Dialog.Content style={{ maxWidth: 450 }}>
          <Dialog.Title>요청 승인</Dialog.Title>
          <Dialog.Close asChild>
            <Button
              variant="ghost"
              color="gray"
              size="1"
              style={{ position: "absolute", top: 8, right: 8 }}
              onClick={() => setApprovingRequest(null)}
            >
              <Cross2Icon />
            </Button>
          </Dialog.Close>
          <form onSubmit={handleApprovalSubmit}>
            <Box mb="4">
              <Text size="2" color="gray">
                요청 내용: {approvingRequest?.case_timelines.description}
              </Text>
            </Box>
            <TextArea
              placeholder="완료 내용을 입력하세요"
              value={approvalDescription}
              onChange={(e) => setApprovalDescription(e.target.value)}
              required
              style={{ minHeight: "100px", marginBottom: "1rem" }}
            />
            <Flex justify="end" gap="2">
              <Button
                variant="soft"
                color="gray"
                onClick={() => setApprovingRequest(null)}
              >
                취소
              </Button>
              <Button type="submit">완료</Button>
            </Flex>
          </form>
        </Dialog.Content>
      </Dialog.Root>
    </div>
  );
};

export default TodosPage;
