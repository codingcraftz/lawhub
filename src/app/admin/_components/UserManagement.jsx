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
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
    } else {
      console.log(data);
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

  const handleFormSuccess = () => {
    fetchUsers();
    setIsDialogOpen(false);
    setEditingUser(null);
  };

  return (
    <Box>
      <Flex justify="between" align="center" mb="4">
        <Button
          className="ml-auto mt-2"
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
            <Table.ColumnHeaderCell>이메일</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>이름</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>핸드폰 번호</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>생년월일</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>성별</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>역할</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>수정</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {users.map((user) => (
            <Table.Row key={user.id}>
              <Table.Cell>{user.email}</Table.Cell>
              <Table.Cell>{user.name}</Table.Cell>
              <Table.Cell>{user.phone_number}</Table.Cell>
              <Table.Cell>
                {user.birth_date ? user.birth_date.split("T")[0] : ""}
              </Table.Cell>
              <Table.Cell>
                {user.gender === "male"
                  ? "남"
                  : user.gender === "female"
                    ? "여"
                    : "기타"}
              </Table.Cell>
              <Table.Cell>
                {user.role === "staff"
                  ? "직원"
                  : user.role === "client"
                    ? "고객"
                    : "관리자"}
              </Table.Cell>
              <Table.Cell>
                <Flex gap="2">
                  <Button
                    size="1"
                    variant="soft"
                    onClick={() => handleEdit(user)}
                  >
                    수정
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
