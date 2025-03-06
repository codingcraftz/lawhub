"use client";

import React, { useState } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Flex, Text } from "@radix-ui/themes";

import StaffSearchBar from "./StaffSearchBar";
import StaffTable from "./StaffTable";

export default function StaffManagementTab({ users, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState("");

  // role이 admin 또는 staff
  const staffList = users.filter(
    (user) => user.role === "admin" || user.role === "staff",
  );

  // 이름으로 검색
  const filteredList = staffList.filter((user) =>
    (user.name || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // 특정 유저 정보 업데이트
  const handleUpdateUser = async (userId, updates) => {
    const { error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", userId);
    if (error) {
      console.error("Error updating user:", error);
      alert("업데이트 중 오류가 발생했습니다.");
      return;
    }
    onRefresh();
  };

  return (
    <Box className="flex flex-col w-full">
      <Flex className="w-full mb-4" justify="between" align="center">
        <Text size="5" weight="bold">
          직원 관리
        </Text>
        <StaffSearchBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          placeholder="직원 이름 검색"
        />
      </Flex>

      <StaffTable staffList={filteredList} onUpdateUser={handleUpdateUser} />
    </Box>
  );
}
