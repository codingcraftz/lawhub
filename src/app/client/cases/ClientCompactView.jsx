// src/app/client/cases/ClientCompactView.jsx

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Text, Flex, Tabs, Button } from "@radix-ui/themes";
import { useUser } from "@/hooks/useUser";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

const ClientCompactView = ({ fetchLimit = 20 }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const initialTab = searchParams.get("tab") || "ongoing";
  const [currentTab, setCurrentTab] = useState(initialTab);

  const initialPage = parseInt(searchParams.get("page")) || 1;

  const initialState = (status) => ({
    cases: [],
    page: initialTab === status ? initialPage : 1,
    hasMore: true,
    loading: false,
  });

  const [caseData, setCaseData] = useState({
    ongoing: initialState("ongoing"),
    scheduled: initialState("scheduled"),
    closed: initialState("closed"),
  });

  const { user } = useUser();
  const [isFetching, setIsFetching] = useState(false);

  const updateSearchParams = (params) => {
    const currentParams = new URLSearchParams(window.location.search);

    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") {
        currentParams.delete(key);
      } else {
        currentParams.set(key, value);
      }
    });

    const newSearch = currentParams.toString();
    const newPath = pathname + (newSearch ? `?${newSearch}` : "");

    router.push(newPath);
  };

  const handleTabChange = (value) => {
    setCurrentTab(value);
    updateSearchParams({ tab: value, page: 1 });
    setCaseData((prevData) => ({
      ...prevData,
      [value]: { ...prevData[value], page: 1, cases: [], hasMore: true },
    }));
  };

  const fetchCases = useCallback(
    async (status) => {
      if (!user || !user.id || isFetching || caseData[status].loading) return;

      setIsFetching(true);
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
          .eq("case_clients.client_id", user.id)
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

        // 현재 탭의 페이지 번호를 URL에 저장
        if (status === currentTab) {
          updateSearchParams({ page: caseData[status].page - 1 });
        }
      } catch (error) {
        console.error(`Error fetching ${status} cases:`, error);
      } finally {
        setIsFetching(false);
      }
    },
    [user, caseData, fetchLimit, isFetching, currentTab],
  );

  useEffect(() => {
    if (user && currentTab) {
      fetchCases(currentTab);
    }
  }, [user, currentTab]);

  const handleClick = (caseItem) => {
    router.push(`/client/cases/${caseItem.id}`);
  };

  return (
    <Box className="p-4 max-w-7xl w-full mx-auto relative flex flex-col">
      <Tabs.Root
        defaultValue={initialTab}
        value={currentTab}
        onValueChange={handleTabChange}
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
                <table className="w-full table-auto text-sm">
                  <thead>
                    <tr style={{ backgroundColor: "var(--gray-6)" }}>
                      <th
                        className="border px-4 py-2 text-left"
                        style={{ borderColor: "var(--gray-6)" }}
                      >
                        종류
                      </th>
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
                        onClick={() => handleClick(caseItem)}
                        style={{
                          cursor: "pointer",
                          backgroundColor: "var(--gray-1)",
                        }}
                      >
                        <td
                          className="border px-4 py-2"
                          style={{ borderColor: "var(--gray-6)" }}
                        >
                          {caseItem.case_categories.name}
                        </td>

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
    </Box>
  );
};

export default ClientCompactView;
