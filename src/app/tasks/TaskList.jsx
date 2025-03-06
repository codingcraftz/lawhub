"use client";

import React, { useState } from "react";
import { Box, Text } from "@radix-ui/themes";
import Pagination from "@/components/Pagination";
import TaskItem from "./TaskItem";

const TaskList = ({
  tasks,
  user,
  currentPage,
  totalPages,
  onPageChange,
  onCompleteTask,
}) => {
  // 펼쳐진 Task의 ID 저장 (단일 펼치기 예시)
  const [expandedTaskId, setExpandedTaskId] = useState(null);

  const handleToggleExpand = (taskId) => {
    setExpandedTaskId((prev) => (prev === taskId ? null : taskId));
  };

  if (!tasks || tasks.length === 0) {
    return <Text>등록된 업무가 없습니다.</Text>;
  }

  return (
    <Box>
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          user={user}
          expanded={expandedTaskId === task.id}
          onToggleExpand={handleToggleExpand}
          onComplete={onCompleteTask}
        />
      ))}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </Box>
  );
};

export default TaskList;
