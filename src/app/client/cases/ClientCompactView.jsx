// src/app/client/cases/ClientCompactView.jsx

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Text, Flex, Tabs, Button } from "@radix-ui/themes";
import { useUser } from "@/hooks/useUser";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { calculateExpenses, calculateInterest } from "@/utils/util";
import CaseDetails from "@/app/case-management/_components/CaseDetails";
import BondDetails from "@/app/case-management/_components/BondDetails";

const ClientCompactView = ({ fetchLimit = 20 }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isBondDetailsOpen, setIsBondDetailsOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);

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
  const isAdmin = user?.role === "admin" || user?.role === "staff";
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

  const handleBondClick = (e, caseItem) => {
    e.stopPropagation();
    setSelectedCase(caseItem);
    setIsBondDetailsOpen(true);
  };
  const handleDetailsClick = (e, caseItem) => {
    e.stopPropagation();
    setSelectedCase(caseItem);
    setIsDetailsModalOpen(true);
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
            case_staff (staff:users (id, name)),
            case_opponents (opponent:opponents (id, name)),
            bonds!bonds_case_id_fkey (principal, interest_1_rate, interest_1_start_date, interest_1_end_date, interest_2_rate, interest_2_start_date, interest_2_end_date, expenses)

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
                <table className="w-full table-auto text-sm mt-5">
                  <thead className="font-semibold">
                    <tr style={{ backgroundColor: "var(--gray-6)" }}>
                      <th
                        className="border px-4 py-2"
                        style={{ borderColor: "var(--gray-6)" }}
                      >
                        타입
                      </th>
                      <th
                        className="border px-4 py-2"
                        style={{ borderColor: "var(--gray-6)" }}
                      >
                        수임 원금
                      </th>
                      <th
                        className="border px-4 py-2"
                        style={{ borderColor: "var(--gray-6)" }}
                      >
                        원리금
                      </th>
                      <th
                        className="border px-4 py-2"
                        style={{ borderColor: "var(--gray-6)" }}
                      >
                        비용
                      </th>
                      <th
                        className="border px-4 py-2"
                        style={{ borderColor: "var(--gray-6)" }}
                      >
                        상대방
                      </th>
                      <th
                        className="border px-4 py-2"
                        style={{ borderColor: "var(--gray-6)" }}
                      >
                        담당자
                      </th>
                      <th
                        className="border px-4 py-2"
                        style={{ borderColor: "var(--gray-6)" }}
                      >
                        의뢰인
                      </th>
                      <th
                        className="border px-4 py-2"
                        style={{ borderColor: "var(--gray-6)" }}
                      >
                        채권 정보
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {caseData[status].cases.map((caseItem) => {
                      const bondsData = caseItem?.bonds?.[0];
                      const total1Interest = calculateInterest(
                        bondsData?.principal,
                        bondsData?.interest_1_rate,
                        bondsData?.interest_1_start_date,
                        bondsData?.interest_1_end_date,
                      );
                      const total2Interest = calculateInterest(
                        bondsData?.principal,
                        bondsData?.interest_2_rate,
                        bondsData?.interest_2_start_date,
                        bondsData?.interest_2_end_date,
                      );

                      const totalExpenses = calculateExpenses(
                        bondsData?.expenses,
                      );

                      const totalPrincipal = Math.floor(
                        (bondsData?.principal || 0) +
                          total1Interest +
                          total2Interest +
                          totalExpenses,
                      );

                      return (
                        <tr
                          key={caseItem.id}
                          className="hover:opacity-80 cursor-pointer text-center"
                          onClick={() => handleClick(caseItem)}
                        >
                          <td
                            className="border px-4 py-2"
                            style={{ borderColor: "var(--gray-6)" }}
                          >
                            {caseItem.case_categories.name}
                          </td>
                          <td
                            className="border px-4 py-2 text-end"
                            style={{ borderColor: "var(--gray-6)" }}
                          >
                            {bondsData?.principal
                              ? bondsData.principal.toLocaleString()
                              : "미등록"}
                          </td>
                          <td
                            className="border px-4 py-2 text-end"
                            style={{ borderColor: "var(--gray-6)" }}
                          >
                            {totalPrincipal
                              ? totalPrincipal.toLocaleString()
                              : "미등록"}
                          </td>
                          <td
                            className="border px-4 py-2 text-end"
                            style={{ borderColor: "var(--gray-6)" }}
                          >
                            {totalExpenses
                              ? totalExpenses.toLocaleString()
                              : "미등록"}
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
                            {caseItem.case_staff
                              .map((cs) => cs.staff.name)
                              .join(", ")}
                          </td>
                          <td
                            className="border px-4 py-2"
                            style={{ borderColor: "var(--gray-6)" }}
                          >
                            {caseItem.case_clients
                              .map((cc) => cc.client.name)
                              .join(", ")}
                          </td>
                          <td
                            className="border px-4 py-2 flex gap-2"
                            style={{ borderColor: "var(--gray-6)" }}
                          >
                            <Button
                              className="flex-1 cursor-pointer"
                              variant="soft"
                              color="blue"
                              size="1"
                              onClick={(e) => handleDetailsClick(e, caseItem)}
                            >
                              사건 정보
                            </Button>

                            <Button
                              className="flex-1 cursor-pointer"
                              variant="soft"
                              color="blue"
                              size="1"
                              onClick={(e) => handleBondClick(e, caseItem)}
                            >
                              채권 정보
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
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

      {/* Case Details Modal */}
      {isDetailsModalOpen && selectedCase && (
        <CaseDetails
          caseData={selectedCase}
          isAdmin={isAdmin}
          onClose={() => setIsDetailsModalOpen(false)}
        />
      )}

      {/* Bond Details Modal */}
      {isBondDetailsOpen && selectedCase && (
        <BondDetails
          caseId={selectedCase.id}
          isAdmin={isAdmin}
          onClose={() => setIsBondDetailsOpen(false)}
        />
      )}
    </Box>
  );
};

export default ClientCompactView;
