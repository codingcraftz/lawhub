"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import {
  Box,
  Text,
  Table,
  Dialog,
  Flex,
  IconButton,
  Tooltip,
} from "@radix-ui/themes";
import { PlusIcon, Pencil1Icon, TrashIcon } from "@radix-ui/react-icons";
import ClientForm from "./_components/ClientForm";

const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase.from("clients").select("*");
      if (error) throw error;
      setClients(data);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("정말로 이 고객을 삭제하시겠습니까?")) {
      try {
        const { error } = await supabase.from("clients").delete().eq("id", id);
        if (error) throw error;
        fetchClients();
      } catch (error) {
        console.error("Error deleting client:", error);
      }
    }
  };

  if (isLoading) return <Text>Loading...</Text>;

  return (
    <Box
      p="4"
      style={{
        maxWidth: "1200px",
        position: "relative",
        minHeight: "calc(100vh - 60px)",
      }}
    >
      <Text size="8" weight="bold" mb="4">
        고객 관리
      </Text>
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>이름</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>이메일</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>전화번호</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>생년월일</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>성별</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>작업</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {clients.map((client) => (
            <Table.Row key={client.id}>
              <Table.Cell>{client.name}</Table.Cell>
              <Table.Cell>{client.email}</Table.Cell>
              <Table.Cell>{client.phone_number}</Table.Cell>
              <Table.Cell>{client.birth_date}</Table.Cell>
              <Table.Cell>{client.gender}</Table.Cell>
              <Table.Cell>
                <Flex gap="2">
                  <Dialog.Root>
                    <Dialog.Trigger>
                      <IconButton variant="soft" color="blue">
                        <Pencil1Icon />
                      </IconButton>
                    </Dialog.Trigger>
                    <Dialog.Content style={{ maxWidth: 450 }}>
                      <Dialog.Title>고객 정보 수정</Dialog.Title>
                      <ClientForm client={client} onSuccess={fetchClients} />
                    </Dialog.Content>
                  </Dialog.Root>
                  <IconButton
                    variant="soft"
                    color="red"
                    onClick={() => handleDelete(client.id)}
                  >
                    <TrashIcon />
                  </IconButton>
                </Flex>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
      <Tooltip content="새 고객 추가">
        <Dialog.Root>
          <Dialog.Trigger>
            <IconButton
              size="4"
              variant="solid"
              color="indigo"
              style={{
                position: "fixed",
                bottom: "2rem",
                right: "2rem",
                borderRadius: "50%",
              }}
            >
              <PlusIcon width="20" height="20" />
            </IconButton>
          </Dialog.Trigger>
          <Dialog.Content style={{ maxWidth: 450 }}>
            <Dialog.Title>새 고객 등록</Dialog.Title>
            <ClientForm onSuccess={fetchClients} />
          </Dialog.Content>
        </Dialog.Root>
      </Tooltip>
    </Box>
  );
};

export default ClientsPage;
