"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Text, Flex, Tabs, Button, Dialog } from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";
import CaseCard from "./_components/CaseCard";
import CaseTimeline from "./_components/CaseTimeline";
import CaseForm from "./_components/CaseForm";
import { useUser } from "@/hooks/useUser";
import Pagination from "@/components/Pagination";
import useRoleRedirect from "@/hooks/userRoleRedirect";

const BoardsPage = () => {
  const initialState = {
    cases: [],
    count: 0,
    page: 1,
  };

  const [caseData, setCaseData] = useState({
    ongoing: initialState,
    scheduled: initialState,
    closed: initialState,
  });
  const [selectedCase, setSelectedCase] = useState(null);
  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false);
  const pageSize = 9;
  const { user } = useUser();

  useRoleRedirect(["staff", "admin"], "/login");

  useEffect(() => {
    if (user) {
      fetchCases("ongoing");
      fetchCases("scheduled");
      fetchCases("closed");
    }
  }, [
    user,
    caseData.ongoing.page,
    caseData.scheduled.page,
    caseData.closed.page,
  ]);

  const fetchCases = useCallback(
    async (status) => {
      try {
        if (!user) return;

        let query = supabase.from("cases").select(
          `
            *,
            case_categories (id, name),
            case_clients (client:users (id, name)),
            case_staff!inner (staff:users (id, name)),
            case_opponents (opponent:opponents (id, name))
          `,
          { count: "exact" },
        );

        if (user.role === "staff") {
          query = query.eq("case_staff.staff_id", user.id);
        }

        query = query
          .eq("status", status)
          .order("start_date", { ascending: false })
          .range(
            (caseData[status].page - 1) * pageSize,
            caseData[status].page * pageSize - 1,
          );

        const { data, error, count } = await query;

        if (error) throw error;

        setCaseData((prevData) => ({
          ...prevData,
          [status]: { ...prevData[status], cases: data, count },
        }));
      } catch (error) {
        console.error(`Error fetching ${status} cases:`, error);
      }
    },
    [user, caseData],
  );

  const handlePageChange = (status, newPage) => {
    setCaseData((prevData) => ({
      ...prevData,
      [status]: { ...prevData[status], page: newPage },
    }));
  };

  const onSuccessUpdate = () => {
    fetchCases("ongoing");
    fetchCases("scheduled");
    fetchCases("closed");
    setIsNewCaseModalOpen(false);
    setSelectedCase(null);
  };

  const hasCases = (status) => caseData[status].cases.length > 0;
  const totalPages = (status) => Math.ceil(caseData[status].count / pageSize);

  return (
    <Box className="p-4 max-w-7xl w-full mx-auto relative flex flex-col">
      <Flex justify="between" align="center" className="mb-4">
        <Text size="8" weight="bold">
          사건 관리
        </Text>
        {user && (user.role === "admin" || user.role === "staff") && (
          <Dialog.Root
            open={isNewCaseModalOpen}
            onOpenChange={setIsNewCaseModalOpen}
          >
            <Button onClick={() => setIsNewCaseModalOpen(true)}>
              새 사건 등록
            </Button>
            <Dialog.Content style={{ maxWidth: 450 }}>
              <Dialog.Title>새 사건 등록</Dialog.Title>
              <Dialog.Close asChild>
                <Button
                  variant="ghost"
                  color="gray"
                  size="1"
                  style={{ position: "absolute", top: 8, right: 8 }}
                  onClick={() => setIsNewCaseModalOpen(false)}
                >
                  <Cross2Icon />
                </Button>
              </Dialog.Close>
              <CaseForm
                caseData={selectedCase}
                onSuccess={onSuccessUpdate}
                onClose={() => setIsNewCaseModalOpen(false)}
              />
            </Dialog.Content>
          </Dialog.Root>
        )}
      </Flex>

      <Tabs.Root defaultValue="ongoing">
        <Tabs.List>
          <Tabs.Trigger value="ongoing">진행중인 사건</Tabs.Trigger>
          <Tabs.Trigger value="scheduled">진행예정 사건</Tabs.Trigger>
          <Tabs.Trigger value="closed">종료된 사건</Tabs.Trigger>
        </Tabs.List>

        {["ongoing", "scheduled", "closed"].map((status) => (
          <Tabs.Content key={status} value={status}>
            {hasCases(status) ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {caseData[status].cases.map((caseItem) => (
                  <CaseCard
                    key={caseItem.id}
                    caseItem={caseItem}
                    onClick={() => setSelectedCase(caseItem)}
                    isAdmin={user?.role === "admin"}
                    fetchCases={() => fetchCases(status)}
                  />
                ))}
              </div>
            ) : (
              <Text size="3" className="text-center mt-8">
                {status === "ongoing"
                  ? "진행중인 사건이 없습니다."
                  : status === "scheduled"
                    ? "진행예정 사건이 없습니다."
                    : "종료된 사건이 없습니다."}
              </Text>
            )}
            {totalPages(status) > 1 && (
              <Pagination
                currentPage={caseData[status].page}
                totalPages={totalPages(status)}
                onPageChange={(page) => handlePageChange(status, page)}
              />
            )}
          </Tabs.Content>
        ))}
      </Tabs.Root>

      {selectedCase && (
        <Dialog.Root
          open={!!selectedCase}
          onOpenChange={() => setSelectedCase(null)}
        >
          <Dialog.Content style={{ maxWidth: 600 }}>
            <Dialog.Title>{selectedCase?.title} 타임라인</Dialog.Title>
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                color="gray"
                size="1"
                style={{ position: "absolute", top: 8, right: 8 }}
              >
                <Cross2Icon />
              </Button>
            </Dialog.Close>
            <CaseTimeline
              caseId={selectedCase?.id}
              caseStatus={selectedCase?.status}
              onClose={() => setSelectedCase(null)}
            />
          </Dialog.Content>
        </Dialog.Root>
      )}
    </Box>
  );
};

export default BoardsPage;
