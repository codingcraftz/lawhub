// src/app/case-management/_components/CaseCompactView.jsx

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Text, Flex, Tabs, Button } from "@radix-ui/themes";
import { useUser } from "@/hooks/useUser";
import { useRouter, useSearchParams } from "next/navigation";

const CaseCompactView = ({ newCaseTrigger }) => {
  const fetchLimit = 20;
  const initialState = {
    cases: [],
    page: 1,
    hasMore: true,
    loading: false,
  };

  const router = useRouter();
  const searchParams = useSearchParams();

  const initialTab = searchParams.get("tab") || "ongoing";
  const initialPage = parseInt(searchParams.get("page")) || 1;

  const [caseData, setCaseData] = useState({
    ongoing: {
      ...initialState,
      page: initialTab === "ongoing" ? initialPage : 1,
    },
    scheduled: {
      ...initialState,
      page: initialTab === "scheduled" ? initialPage : 1,
    },
    closed: {
      ...initialState,
      page: initialTab === "closed" ? initialPage : 1,
    },
  });

  const [currentTab, setCurrentTab] = useState(initialTab);
  const { user } = useUser();

  const updateSearchParams = (params) => {
    const currentParams = new URLSearchParams(searchParams.toString());

    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") {
        currentParams.delete(key);
      } else {
        currentParams.set(key, value);
      }
    });

    const newSearch = currentParams.toString();
    const newPath = newSearch ? `?${newSearch}` : "";

    router.push(newPath);
  };

  const handleTabChange = (value) => {
    setCurrentTab(value);
    updateSearchParams({ tab: value, page: 1 }); // 탭 변경 시 페이지를 1로 초기화
  };

  const fetchCases = useCallback(
    async (status) => {
      if (!user || caseData[status].loading || !caseData[status].hasMore)
        return;

      setCaseData((prevData) => ({
        ...prevData,
        [status]: { ...prevData[status], loading: true },
      }));

      try {
        let query = supabase
          .from("cases")
          .select(
            `
            *,
            case_categories (id, name),
            case_clients (client:users (id, name)),
            case_staff (staff:users (id, name)),
            case_opponents (opponent:opponents (id, name))
          `,
          )
          .eq("status", status)
          .order("start_date", { ascending: true })
          .range(
            (caseData[status].page - 1) * fetchLimit,
            caseData[status].page * fetchLimit - 1,
          );

        if (user.role === "staff") {
          const { data: caseStaffs, error } = await supabase
            .from("case_staff")
            .select("case_id")
            .eq("staff_id", user.id);

          if (error) throw error;

          const caseIds = caseStaffs.map((cs) => cs.case_id);
          if (caseIds.length > 0) {
            query = query.in("id", caseIds);
          } else {
            setCaseData((prevData) => ({
              ...prevData,
              [status]: { ...prevData[status], hasMore: false, loading: false },
            }));
            return;
          }
        }

        const { data, error } = await query;
        if (error) throw error;

        const hasMore = data.length === fetchLimit;
        setCaseData((prevData) => ({
          ...prevData,
          [status]: {
            ...prevData[status],
            cases: [
              ...prevData[status].cases,
              ...data.filter(
                (newCase) =>
                  !prevData[status].cases.find(
                    (existingCase) => existingCase.id === newCase.id,
                  ),
              ),
            ],
            page: prevData[status].page + 1,
            hasMore,
            loading: false,
          },
        }));

        // 현재 탭에 해당하는 페이지 번호를 URL에 저장
        if (status === currentTab) {
          updateSearchParams({ page: prevData[status].page });
        }
      } catch (error) {
        console.error(`Error fetching ${status} cases:`, error);
        setCaseData((prevData) => ({
          ...prevData,
          [status]: { ...prevData[status], loading: false },
        }));
      }
    },
    [user, caseData, fetchLimit, currentTab],
  );

  useEffect(() => {
    if (user) {
      fetchCases(currentTab);
    }
  }, [user, currentTab, newCaseTrigger]);

  const handleClick = (caseId) => {
    router.push(`/cases/${caseId}`);
  };

  return (
    <Box className="p-4 max-w-7xl w-full mx-auto relative flex flex-col">
      <Tabs.Root
        defaultValue={currentTab}
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
                  <thead className="font-semibold">
                    <tr style={{ backgroundColor: "var(--gray-6)" }}>
                      <th
                        className="border px-4 py-2 text-left"
                        style={{ borderColor: "var(--gray-6)" }}
                      >
                        타입
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
                        의뢰인
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
                        담당자
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
                        onClick={() => handleClick(caseItem.id)}
                        style={{
                          cursor: "pointer",
                          backgroundColor: "var(--gray-1)",
                        }}
                      >
                        <td
                          className="border px-4 py-2 truncate"
                          style={{ borderColor: "var(--gray-6)" }}
                        >
                          <Text>{caseItem.case_categories.name}</Text>
                        </td>

                        <td
                          className="border px-4 py-2 truncate"
                          style={{ borderColor: "var(--gray-6)" }}
                        >
                          <Text>{caseItem.title}</Text>
                        </td>
                        <td
                          className="border px-4 py-2 truncate"
                          style={{ borderColor: "var(--gray-6)" }}
                        >
                          {caseItem.case_clients
                            .map((cc) => cc.client.name)
                            .join(", ")}
                        </td>
                        <td
                          className="border px-4 py-2 truncate"
                          style={{ borderColor: "var(--gray-6)" }}
                        >
                          {caseItem.case_opponents
                            .map((co) => co.opponent.name)
                            .join(", ")}
                        </td>
                        <td
                          className="border px-4 py-2 truncate"
                          style={{ borderColor: "var(--gray-6)" }}
                        >
                          {caseItem.case_staff
                            .map((cs) => cs.staff.name)
                            .join(", ")}
                        </td>
                        <td
                          className="border px-4 py-2"
                          style={{ borderColor: "var(--gray-6)" }}
                        >
                          {new Date(caseItem.start_date).toLocaleDateString(
                            "ko-KR",
                            {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                            },
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {caseData[status].hasMore && (
                  <Flex justify="center" mt="4">
                    <Button
                      onClick={() => fetchCases(status)}
                      disabled={caseData[status].loading}
                    >
                      {caseData[status].loading ? "로딩 중..." : "더 보기"}
                    </Button>
                  </Flex>
                )}
              </>
            ) : (
              <Flex justify="center">
                <Text size="4" className="text-center mt-8">
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

export default CaseCompactView;
