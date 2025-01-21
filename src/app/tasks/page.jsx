"use client";

import React, { useState, useEffect } from "react";
import { Box, Flex, Text } from "@radix-ui/themes";
import { supabase } from "@/utils/supabase";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";

// 하위 컴포넌트
import TaskTab from "./TaskTab";
import TaskList from "./TaskList";

const PAGE_SIZE = 10;

export default function TaskPage() {
  const { user } = useUser();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("received"); // "received" | "sent" | "closed"
  const [tasks, setTasks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 업무 목록 불러오기
  const fetchTasks = async () => {
    if (!user?.id) return;

    try {
      let query = supabase
        .from("assignment_tasks")
        .select(
          `
          id,
          assignment_id,
          title,
          content,
          status,
          created_by,
          created_at,
          assignment:assignments(
            description,
            assignment_clients(
              client_id,
              client:users(name)
            ),
            assignment_groups(
              group_id,
              group:groups(name)
            )
          ),
          requester:requester_id(name),
          receiver:receiver_id(name),
          receiver_id,
          type
        `,
          { count: "exact" }
        )
        .order("created_at", { ascending: false });

      // 탭 필터
      if (activeTab === "received") {
        query = query.eq("receiver_id", user.id);
      } else if (activeTab === "sent") {
        query = query.eq("requester_id", user.id);
      } else if (activeTab === "closed") {
        query = query.eq("status", "closed");
      }

      // 페이지네이션
      const from = (currentPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error, count } = await query.range(from, to);
      if (error) throw error;

      setTasks(data || []);
      setTotalPages(Math.ceil((count || 0) / PAGE_SIZE));
    } catch (err) {
      console.error("Error fetching tasks:", err);
    }
  };

  // "요청 완료" 버튼
  const handleCompleteTask = async (taskId) => {
    if (!window.confirm("정말 이 업무를 완료 처리하시겠습니까?")) return;

    try {
      const { error } = await supabase
        .from("assignment_tasks")
        .update({ status: "closed" })
        .eq("id", taskId);

      if (error) throw error;
      // 완료 후 목록 재조회
      fetchTasks();
    } catch (err) {
      console.error("Error completing task:", err);
    }
  };

  // 탭 변경 시
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentPage, user?.id]);

  return (
    <Box className="p-4 w-full">
      <Text size="6" weight="bold" className="mb-4">
        직원 업무 관리
      </Text>

      <Flex gap="2" className="mb-4">
        <TaskTab
          title="받은 요청"
          isActive={activeTab === "received"}
          onClick={() => handleTabChange("received")}
        />
        <TaskTab
          title="보낸 요청"
          isActive={activeTab === "sent"}
          onClick={() => handleTabChange("sent")}
        />
        <TaskTab
          title="종료된 요청"
          isActive={activeTab === "closed"}
          onClick={() => handleTabChange("closed")}
        />
      </Flex>

      {/* 업무 리스트 */}
      <TaskList
        tasks={tasks}
        user={user}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onCompleteTask={handleCompleteTask}
      />
    </Box>
  );
}

