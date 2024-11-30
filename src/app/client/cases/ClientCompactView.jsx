"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Text, Flex, Tabs, Button, Dialog } from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";
import ClientCaseTimeline from "./ClientCaseTimeline";
import { useUser } from "@/hooks/useUser";

const ClientCompactView = ({ fetchLimit = 20 }) => {
  const initialState = {
    cases: [],
    page: 1,
    hasMore: true,
    loading: false,
  };

  const [caseData, setCaseData] = useState({
    ongoing: initialState,
    scheduled: initialState,
    closed: initialState,
  });

  const [currentTab, setCurrentTab] = useState("ongoing"); // Tabs 초기값과 일치
  const [selectedCase, setSelectedCase] = useState(null);
  const { user } = useUser();
  const [isFetching, setIsFetching] = useState(false); // 중복 호출 방지 상태

  const fetchCases = useCallback(
    async (status) => {
      if (!user || !user.id || isFetching || caseData[status].loading) return;

      setIsFetching(true); // 호출 시작 시 상태 변경
      setCaseData((prevData) => ({
        ...prevData,
        [status]: { ...prevData[status], loading: true },
      }));

      try {
        const { data, error } = await supabase
          .from("cases")
          .select(
            `
            *,
            case_categories (id, name),
            case_clients!inner(client:users(id, name)),
            case_opponents (opponent:opponents (id, name))
          `,
          )
          .eq("case_clients.client_id", user.id) // 클라이언트 사건만 조회
          .eq("status", status)
          .order("start_date", { ascending: false })
          .range(
            (caseData[status].page - 1) * fetchLimit,
            caseData[status].page * fetchLimit - 1,
          );

        if (error) throw error;

        const hasMore = data.length === fetchLimit;

        setCaseData((prevData) => ({
          ...prevData,
          [status]: {
            ...prevData[status],
            cases: [...prevData[status].cases, ...data],
            page: prevData[status].page + 1,
            hasMore,
            loading: false,
          },
        }));
      } catch (error) {
        console.error(`Error fetching ${status} cases:`, error);
      } finally {
        setIsFetching(false);
      }
    },
    [user, caseData, fetchLimit, isFetching],
  );

  useEffect(() => {
    if (user && currentTab) {
      fetchCases(currentTab);
    }
  }, [user, currentTab]);

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
                <table className="w-full table-auto">
                  <thead>
                    <tr style={{ backgroundColor: "var(--gray-6)" }}>
                      <th
                        className="border px-4 py-2 text-left"
                        style={{ borderColor: "var(--gray-6)" }}
                      >
                        사건명
                      </th>
                      <th
                        className="border px-4 py-2 text-left"
                        style={{ borderColor: "var(--gray-6)" }}
                      >
                        상대방
                      </th>
                      <th
                        className="border px-4 py-2 text-left"
                        style={{ borderColor: "var(--gray-6)" }}
                      >
                        시작날짜
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {caseData[status].cases.map((caseItem) => (
                      <tr
                        className="hover:opacity-30"
                        key={caseItem.id}
                        onClick={() => setSelectedCase(caseItem)}
                        style={{
                          cursor: "pointer",
                          backgroundColor: "var(--gray-1)",
                        }}
                      >
                        <td
                          className="border px-4 py-2"
                          style={{ borderColor: "var(--gray-6)" }}
                        >
                          {caseItem.title}
                        </td>
                        <td
                          className="border px-4 py-2"
                          style={{ borderColor: "var(--gray-6)" }}
                        >
                          {caseItem.case_opponents
                            .map((co) => co.opponent.name)
                            .join(", ")}
                        </td>
                        <td
                          className="border px-4 py-2"
                          style={{ borderColor: "var(--gray-6)" }}
                        >
                          {new Date(caseItem.start_date).toLocaleDateString(
                            "ko-KR",
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {caseData[status].hasMore && (
                  <Button
                    onClick={() => fetchCases(status)}
                    disabled={caseData[status].loading || isFetching}
                  >
                    더 보기
                  </Button>
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
              caseId={selectedCase.id}
              description={selectedCase.description}
              onClose={() => setSelectedCase(null)}
            />
          </Dialog.Content>
        </Dialog.Root>
      )}
    </Box>
  );
};

export default ClientCompactView;
