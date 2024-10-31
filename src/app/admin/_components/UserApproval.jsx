// src/app/admin/_components/UserApproval.jsx

"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Text, Flex, Button, Table } from "@radix-ui/themes";

const UserApproval = () => {
  const [pendingUsers, setPendingUsers] = useState([]);

  const fetchPendingUsers = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("is_active", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching pending users:", error);
    } else {
      setPendingUsers(data);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  console.log(pendingUsers);
  const handleApprove = async (userId) => {
    const { error } = await supabase
      .from("users")
      .update({ is_active: true })
      .eq("id", userId);

    if (error) {
      console.error("Error approving user:", error);
      alert("회원 승인 중 오류가 발생했습니다.");
    } else {
      alert("회원이 승인되었습니다.");
      fetchPendingUsers();
    }
  };

  const handleReject = async (userId) => {
    if (confirm("정말로 이 회원을 삭제하시겠습니까?")) {
      const { error } = await supabase.from("users").delete().eq("id", userId);

      if (error) {
        console.error("Error rejecting user:", error);
        alert("회원 삭제 중 오류가 발생했습니다.");
      } else {
        alert("회원이 삭제되었습니다.");
        fetchPendingUsers();
      }
    }
  };

  return (
    <Box>
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>이름</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>이메일</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>가입일</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>승인 / 거절</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {pendingUsers.map((user) => (
            <Table.Row key={user.id}>
              <Table.Cell>{user.name}</Table.Cell>
              <Table.Cell>{user.email}</Table.Cell>
              <Table.Cell>
                {new Date(user.created_at).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </Table.Cell>
              <Table.Cell>
                <Flex gap="2">
                  <Button size="1" onClick={() => handleApprove(user.id)}>
                    승인
                  </Button>
                  <Button
                    size="1"
                    color="red"
                    onClick={() => handleReject(user.id)}
                  >
                    거절
                  </Button>
                </Flex>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
};

export default UserApproval;
