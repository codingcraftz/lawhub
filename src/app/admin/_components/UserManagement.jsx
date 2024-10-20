// src/app/admin/_components/UserManagement.jsx

"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Text, Flex, Button, Table, Dialog } from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";
import UserForm from "./UserForm";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
    } else {
      setUsers(data);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEdit = (user) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const handleDelete = async (userId) => {
    if (confirm("정말로 이 사용자를 삭제하시겠습니까?")) {
      try {
        const response = await fetch("/api/deleteUser", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: userId }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || "사용자 삭제 중 오류가 발생했습니다."
          );
        }

        fetchUsers();
      } catch (error) {
        console.error("Error deleting user:", error);
        alert(error.message || "사용자 삭제 중 오류가 발생했습니다.");
      }
    }
  };

  const handleFormSuccess = () => {
    fetchUsers();
    setIsDialogOpen(false);
    setEditingUser(null);
  };

  return (
    <Box>
      <Flex justify="between" align="center" mb="4">
        <Text size="8" weight="bold">
          사용자 관리
        </Text>
        <Button
          onClick={() => {
            setEditingUser(null);
            setIsDialogOpen(true);
          }}
        >
          사용자 추가
        </Button>
      </Flex>

      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>이름</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>이메일</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>핸드폰 번호</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>생년월일</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>성별</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>역할</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>활성화 여부</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>액션</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {users.map((user) => (
            <Table.Row key={user.id}>
              <Table.Cell>{user.name}</Table.Cell>
              <Table.Cell>{user.email}</Table.Cell>
              <Table.Cell>{user.phone_number}</Table.Cell>
              <Table.Cell>
                {user.birth_date ? user.birth_date.split("T")[0] : ""}
              </Table.Cell>
              <Table.Cell>{user.gender}</Table.Cell>
              <Table.Cell>{user.role}</Table.Cell>
              <Table.Cell>{user.is_active ? "활성화" : "비활성화"}</Table.Cell>
              <Table.Cell>
                <Flex gap="2">
                  <Button size="1" variant="soft" onClick={() => handleEdit(user)}>
                    수정
                  </Button>
                  <Button size="1" variant="soft" color="red" onClick={() => handleDelete(user.id)}>
                    삭제
                  </Button>
                </Flex>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>

      <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Dialog.Content style={{ maxWidth: 450 }}>
          <Dialog.Title className="text-lg font-bold mb-4">
            사용자 {editingUser ? "수정" : "추가"}
          </Dialog.Title>
          <Dialog.Close asChild>
            <Button
              variant="ghost"
              size="1"
              style={{ position: "absolute", top: 8, right: 8 }}
            >
              <Cross2Icon />
            </Button>
          </Dialog.Close>
          <UserForm
            editingUser={editingUser}
            onSuccess={handleFormSuccess}
            onClose={() => setIsDialogOpen(false)}
          />
        </Dialog.Content>
      </Dialog.Root>
    </Box>
  );
};

export default UserManagement;