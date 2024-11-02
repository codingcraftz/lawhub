// src/app/admin/_components/AdminDashboard.jsx

"use client";

import React from "react";
import { Tabs, Box, Text } from "@radix-ui/themes";
import UserManagement from "./UserManagement";
import CaseCategoryManagement from "./CaseCategoryManagement";
import UserApproval from "./UserApproval";
import FeedbackManagement from "./FeedbackManagement";

const AdminDashboard = () => {
  return (
    <Box className="p-4 max-w-7xl w-full mx-auto">
      <Text size="8" weight="bold" className="mb-4">
        관리자 대시보드
      </Text>
      <Tabs.Root defaultValue="users">
        <Tabs.List>
          <Tabs.Trigger value="users">사용자 관리</Tabs.Trigger>
          <Tabs.Trigger value="approvals">회원 승인</Tabs.Trigger>{" "}
          <Tabs.Trigger value="feedback">피드백 관리</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="users">
          <UserManagement />
        </Tabs.Content>

        <Tabs.Content value="categories">
          <CaseCategoryManagement />
        </Tabs.Content>

        <Tabs.Content value="approvals">
          <UserApproval />
        </Tabs.Content>

        <Tabs.Content value="feedback">
          <FeedbackManagement />
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
};

export default AdminDashboard;
