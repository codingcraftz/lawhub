"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Flex, Text, Tabs, Dialog, Button } from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";
import ClientCaseCard from "./ClientCaseCard";
import ClientCaseTimeline from "./ClientCaseTimeline";
import { useUser } from "@/hooks/useUser";
import Pagination from "@/components/Pagination";

const ClientCardView = ({ pageSize = 9 }) => {
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

  const [currentTab, setCurrentTab] = useState("ongoing");
  const [selectedCase, setSelectedCase] = useState(null); // 선택된 사건
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const fetchCases = useCallback(
    async (status) => {
      if (!user || !user.id || isLoading) return;

      setIsLoading(true);

      try {
        const { data, error, count } = await supabase
          .from("cases")
          .select(
            `
            *,
            case_categories (id, name),
            case_clients!inner(client:users(id, name)),
            case_opponents (opponent:opponents (id, name))
          `,
            { count: "exact" },
          )
          .eq("case_clients.client_id", user.id) // 현재 사용자 관련 사건만
          .eq("status", status)
          .order("start_date", { ascending: false })
          .range(
            (caseData[status].page - 1) * pageSize,
            caseData[status].page * pageSize - 1,
          );

        if (error) throw error;

        setCaseData((prevData) => ({
          ...prevData,
          [status]: {
            ...prevData[status],
            cases: data,
            count,
          },
        }));
      } catch (error) {
        console.error(`Error fetching ${status} cases:`, error);
      } finally {
        setIsLoading(false);
      }
    },
    [user, isLoading, caseData, pageSize],
  );

  useEffect(() => {
    if (user) {
      fetchCases(currentTab);
    }
  }, [user, currentTab, caseData[currentTab].page]);

  const handlePageChange = (newPage) => {
    setCaseData((prevData) => ({
      ...prevData,
      [currentTab]: { ...prevData[currentTab], page: newPage },
    }));
  };

  const totalPages = Math.ceil(caseData[currentTab].count / pageSize);

  return (
    <Box className="p-4 max-w-7xl w-full mx-auto relative flex flex-col">
      <Tabs.Root
        defaultValue="ongoing"
        value={currentTab}
        onValueChange={(value) => setCurrentTab(value)}
      >
        <Tabs.List>
          <Tabs.Trigger value="ongoing">진행중인 사건</Tabs.Trigger>
          <Tabs.Trigger value="scheduled">진행예정 사건</Tabs.Trigger>
          <Tabs.Trigger value="closed">종료된 사건</Tabs.Trigger>
        </Tabs.List>

        {["ongoing", "scheduled", "closed"].map((status) => (
          <Tabs.Content key={status} value={status}>
            {caseData[status].cases.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {caseData[status].cases.map((caseItem) => (
                    <ClientCaseCard
                      key={caseItem.id}
                      caseItem={caseItem}
                      onClick={() => setSelectedCase(caseItem)} // 클릭한 사건 저장
                    />
                  ))}
                </div>
                {totalPages > 1 && (
                  <Pagination
                    currentPage={caseData[status].page}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                )}
              </>
            ) : (
              <Flex justify="center">
                <Text size="3" className="text-center mt-8">
                  {status === "ongoing"
                    ? "진행중인 사건이 없습니다."
                    : status === "scheduled"
                      ? "진행예정 사건이 없습니다."
                      : "종료된 사건이 없습니다."}
                </Text>
              </Flex>
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
            <Dialog.Title>{selectedCase.title} 타임라인</Dialog.Title>
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                color="gray"
                size="1"
                style={{ position: "absolute", top: 8, right: 8 }}
                onClick={() => setSelectedCase(null)}
              >
                <Cross2Icon />
              </Button>
            </Dialog.Close>
            <ClientCaseTimeline
              caseId={selectedCase.id} // 사건 ID 전달
              onClose={() => setSelectedCase(null)} // 닫기 핸들러
            />
          </Dialog.Content>
        </Dialog.Root>
      )}
    </Box>
  );
};

export default ClientCardView;
