"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { useRouter } from "next/navigation";
import {
  Box,
  Flex,
  Text,
  Card,
  Dialog,
  Button,
  Switch,
} from "@radix-ui/themes";
import { useUser } from "@/hooks/useUser";
import Pagination from "@/components/Pagination";
import CaseForm from "@/app/case-management/_components/CaseForm";
import useRoleRedirect from "@/hooks/userRoleRedirect";

const PAGE_SIZE = 12; // 한 페이지에 보여줄 카드 수

const ClientManagementPage = () => {
  useRoleRedirect(["staff", "admin"], "/login");

  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState(""); // 검색어 상태
  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [newCaseTrigger, setNewCaseTrigger] = useState(0);
  const [showOngoingOnly, setShowOngoingOnly] = useState(false); // 진행 중 필터

  const router = useRouter();
  const { user } = useUser();

  const fetchClientsWithCaseCount = async () => {
    if (user?.role && user?.id) {
      const { data, error } = await supabase.rpc(
        "get_clients_with_case_counts",
        {
          user_role: user?.role,
          user_id: user?.id,
        },
      );

      if (error) {
        console.error("Error fetching cases:", error);
        return [];
      }

      setClients(data || []);
    }
  };

  useEffect(() => {
    fetchClientsWithCaseCount();
  }, [user]);

  // 현재 페이지에 해당하는 데이터 계산
  useEffect(() => {
    const ongoingFilteredClients = showOngoingOnly
      ? clients.filter((client) => client.ongoing_case_count > 0)
      : clients;

    const searchFilteredClients = ongoingFilteredClients.filter((client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    setFilteredClients(searchFilteredClients.slice(startIndex, endIndex));

    // 총 페이지 수 계산
    setTotalPages(Math.ceil(searchFilteredClients.length / PAGE_SIZE));
  }, [clients, currentPage, showOngoingOnly, searchQuery]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleCaseSuccess = () => {
    setNewCaseTrigger((prev) => prev + 1);
    setIsNewCaseModalOpen(false);
    setSelectedCase(null);
    fetchClientsWithCaseCount();
  };

  return (
    <Box className="p-4 max-w-7xl w-full mx-auto">
      <Flex direction="column" gap="4">
        <header className="flex justify-between items-center">
          <Text size="5" weight="bold">
            의뢰인 목록
          </Text>
          <Button
            onClick={() => setIsNewCaseModalOpen(true)}
            className="px-4 py-2 bg-green-500 text-white rounded-md"
          >
            새 사건 등록
          </Button>
        </header>
        <Flex align="center" justify="between">
          <input
            className="rounded-lg"
            type="text"
            placeholder="이름으로 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: "0.5rem 1rem",
              border: "1px solid var(--gray-6)",
            }}
          />
          <Flex align="center" gap="2">
            <Text size="3">진행 중 사건만 보기</Text>
            <Switch
              checked={showOngoingOnly}
              onCheckedChange={setShowOngoingOnly}
            />
          </Flex>
        </Flex>

        <Flex className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <Card
              key={client.id}
              className="cursor-pointer p-4 shadow-sm"
              onClick={() => router.push(`/clients/${client.id}`)}
            >
              <Text className="mr-3" size="4" weight="bold">
                {client.name}
              </Text>
              <Text size="3" color="gray">
                진행 중 사건: {client.ongoing_case_count}건
              </Text>
            </Card>
          ))}
        </Flex>

        {/* 페이지네이션 컴포넌트 */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </Flex>

      {/* 새 사건 등록 모달 */}
      <Dialog.Root
        open={isNewCaseModalOpen}
        onOpenChange={setIsNewCaseModalOpen}
      >
        <Dialog.Content style={{ maxWidth: 700 }}>
          <Dialog.Title>새 사건 등록</Dialog.Title>
          <CaseForm
            caseData={selectedCase}
            onSuccess={handleCaseSuccess}
            onClose={() => setIsNewCaseModalOpen(false)}
          />
        </Dialog.Content>
      </Dialog.Root>
    </Box>
  );
};

export default ClientManagementPage;
