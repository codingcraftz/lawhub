// src/app/todos/page.jsx

"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@/hooks/useUser";
import { Tabs, Box, Dialog, Text } from "@radix-ui/themes";
import DialogContent from "./DialogContent";
import RequestTable from "./RequestTable";
import { supabase } from "@/utils/supabase";
import useRoleRedirect from "@/hooks/userRoleRedirect";
import TodoList from "./TodoList";
import DeadlinesCalendar from "./DeadlinesCalender";

const pageSize = 5;

const TodosPage = () => {
  const { user } = useUser();
  const [requestsSent, setRequestsSent] = useState({
    data: [],
    page: 1,
    count: 0,
  });
  const [requestsReceived, setRequestsReceived] = useState({
    data: [],
    page: 1,
    count: 0,
  });
  const [closedRequests, setClosedRequests] = useState({
    data: [],
    page: 1,
    count: 0,
  });
  const [selectedRequest, setSelectedRequest] = useState(null);

  useRoleRedirect(["staff", "admin"], "/login");

  useEffect(() => {
    if (user) {
      fetchRequests("sent", requestsSent.page);
      fetchRequests("received", requestsReceived.page);
      fetchRequests("closed", closedRequests.page);
    }
  }, [user, requestsSent.page, requestsReceived.page, closedRequests.page]);

  const fetchRequests = async (type, page) => {
    let query = supabase.from("requests").select(
      `
          *,
          requester:users(id, name),
          receiver:users(id, name),
          case_timelines ( id, description, type, case:cases(title) )
        `,
      { count: "exact" },
    );

    if (type === "sent") {
      query = query.eq("requester_id", user.id).neq("status", "closed");
    } else if (type === "received") {
      query = query.eq("receiver_id", user.id).eq("status", "ongoing");
    } else if (type === "closed") {
      query = query.eq("requester_id", user.id).eq("status", "closed");
    }

    const { data, count, error } = await query.range(
      (page - 1) * pageSize,
      page * pageSize - 1,
    );

    if (error) {
      console.error(`Error fetching ${type} requests:`, error);
    } else {
      if (type === "sent") {
        setRequestsSent({ data, page, count });
      } else if (type === "received") {
        setRequestsReceived({ data, page, count });
      } else if (type === "closed") {
        setClosedRequests({ data, page, count });
      }
    }
  };

  const handlePageChange = (type, newPage) => {
    if (type === "sent") {
      setRequestsSent((prev) => ({ ...prev, page: newPage }));
    } else if (type === "received") {
      setRequestsReceived((prev) => ({ ...prev, page: newPage }));
    } else if (type === "closed") {
      setClosedRequests((prev) => ({ ...prev, page: newPage }));
    }
  };

  const handleRequestCompletion = async (requestId, timelineId) => {
    if (window.confirm("요청을 완료하시겠습니까?")) {
      try {
        // 1. requests 테이블에서 status 업데이트
        const { error: requestError } = await supabase
          .from("requests")
          .update({ status: "closed" })
          .eq("id", requestId);

        if (requestError) {
          throw new Error("Error completing request in requests table");
        }

        const { error: timelineError } = await supabase
          .from("case_timelines")
          .update({ type: "요청완료" })
          .eq("id", timelineId);

        if (timelineError) {
          throw new Error("Error updating type in case_timelines table");
        }

        setRequestsReceived((prev) => ({
          ...prev,
          data: prev.data.filter((request) => request.id !== requestId),
        }));

        setRequestsSent((prev) => ({
          ...prev,
          data: prev.data.filter((request) => request.id !== requestId),
        }));

        fetchRequests("closed", closedRequests.page);
      } catch (error) {
        console.error(error.message);
        alert("요청 완료 중 오류가 발생했습니다.");
      }
    }
  };

  return (
    <>
      <Box className="p-4 max-w-7xl w-full mx-auto relative flex flex-col">
        <Text size="5" weight="bold">
          요청 관리
        </Text>
        <Tabs.Root defaultValue="received">
          <Tabs.List>
            <Tabs.Trigger value="received">받은 요청</Tabs.Trigger>
            <Tabs.Trigger value="sent">보낸 요청</Tabs.Trigger>
            <Tabs.Trigger value="closed">종료된 요청</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="received">
            <RequestTable
              requests={requestsReceived.data}
              onRequestClick={setSelectedRequest}
              paginationData={requestsReceived}
              onPageChange={(page) => handlePageChange("received", page)}
              onRequestComplete={(requestId, timelineId) =>
                handleRequestCompletion(requestId, timelineId)
              }
            />
          </Tabs.Content>

          <Tabs.Content value="sent">
            <RequestTable
              requests={requestsSent.data}
              onRequestClick={setSelectedRequest}
              paginationData={requestsSent}
              onPageChange={(page) => handlePageChange("sent", page)}
              onRequestComplete={(requestId, timelineId) =>
                handleRequestCompletion(requestId, timelineId)
              }
            />
          </Tabs.Content>

          <Tabs.Content value="closed">
            <RequestTable
              requests={closedRequests.data}
              onRequestClick={setSelectedRequest}
              paginationData={closedRequests}
              onPageChange={(page) => handlePageChange("closed", page)}
            />
          </Tabs.Content>
        </Tabs.Root>

        {selectedRequest && (
          <Dialog.Root
            open={!!selectedRequest}
            onOpenChange={() => setSelectedRequest(null)}
          >
            <DialogContent selectedRequest={selectedRequest} user={user} />
          </Dialog.Root>
        )}
        <DeadlinesCalendar />
      </Box>
    </>
  );
};

export default TodosPage;
