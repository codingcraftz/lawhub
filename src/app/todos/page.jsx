"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { useUser } from "@/hooks/useUser";
import { Text, Flex, Button, Table, TextArea } from "@radix-ui/themes";
import * as Dialog from "@radix-ui/react-dialog";
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
        case_id
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
      // 승인 모달을 띄웁니다.
      setApprovingRequest(request);
    } else {
      // 거절 처리
      try {
        const { error } = await supabase
          .from("requests")
          .update({ status: "rejected" })
          .eq("id", request.id);
        if (error) throw error;
        fetchRequests(); // 요청 목록을 다시 가져옵니다.
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
          message: `요청이 승인되었습니다: ${approvalDescription}`,
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
            <Table.ColumnHeaderCell>설명</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>유형</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>요청자</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>작업</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {requests.map((request) => (
            <Table.Row key={request.id}>
              <Table.Cell>{request.case_timelines.description}</Table.Cell>
              <Table.Cell>{request.case_timelines.type}</Table.Cell>
              <Table.Cell>{request.requester?.name || "알 수 없음"}</Table.Cell>
              <Table.Cell>
                <Flex gap="2">
                  <Button
                    onClick={() => handleRequestAction(request, "accepted")}
                  >
                    승인
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

      {approvingRequest && (
        <Dialog.Root
          open={!!approvingRequest}
          onOpenChange={() => setApprovingRequest(null)}
        >
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />
            <Dialog.Content
              className="fixed top-1/2 left-1/2 bg-white dark:bg-gray-800 rounded-lg p-6 transform -translate-x-1/2 -translate-y-1/2 max-w-md w-full"
              style={{ zIndex: 1000 }}
            >
              <Dialog.Title className="text-lg font-bold mb-4">
                요청 승인
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button
                  variant="ghost"
                  size="1"
                  style={{ position: "absolute", top: 8, right: 8 }}
                  onClick={() => setApprovingRequest(null)}
                >
                  <Cross2Icon />
                </Button>
              </Dialog.Close>
              <form onSubmit={handleApprovalSubmit}>
                <Flex direction="column" gap="4">
                  <Text>
                    요청: {approvingRequest.case_timelines.description}
                  </Text>
                  <TextArea
                    placeholder="완료 내용을 입력하세요"
                    value={approvalDescription}
                    onChange={(e) => setApprovalDescription(e.target.value)}
                    required
                    style={{ minHeight: "100px" }}
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
                </Flex>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </div>
  );
};

export default TodosPage;
