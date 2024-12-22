// src/app/case-management/_components/CaseCardView.jsx

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Text, Flex, Tabs, Button } from "@radix-ui/themes";
import { useUser } from "@/hooks/useUser";
import { useRouter, useSearchParams } from "next/navigation";
import { calculateExpenses, calculateInterest } from "@/utils/util";
import CaseDetails from "./CaseDetails";
import BondDetails from "./BondDetails";

const CaseCompactView = ({ clientId, newCaseTrigger }) => {
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
  const initialPage = 1;

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
  const isAdmin = user?.role === "staff" || user?.role === "admin";

  const [isBondDetailsOpen, setIsBondDetailsOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);

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
    updateSearchParams({ tab: value, page: 1 });
  };

  const handleClick = (caseItem) => {
    router.push(`/cases/${caseItem.id}`);
  };

  const fetchCases = useCallback(
    async (status) => {
      if (
        !user ||
        !clientId ||
        caseData[status].loading ||
        !caseData[status].hasMore
      )
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
          case_clients!inner (client:users (id, name)),
          case_staff (staff:users (id, name)),
          case_opponents (opponent:opponents (id, name)),
          bonds!bonds_case_id_fkey (principal, interest_1_rate, interest_1_start_date, interest_1_end_date, interest_2_rate, interest_2_start_date, interest_2_end_date, expenses)
        `,
          )
          .eq("case_clients.client_id", clientId)
          .eq("status", status)
          .order("start_date", { ascending: true })
          .range(
            (caseData[status].page - 1) * fetchLimit,
            caseData[status].page * fetchLimit - 1,
          );

        // role이 staff인 경우 자신이 담당자로 등록된 사건만 필터링
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
      } catch (error) {
        console.error(`Error fetching ${status} cases:`, error);
        setCaseData((prevData) => ({
          ...prevData,
          [status]: { ...prevData[status], loading: false },
        }));
      }
    },
    [user, clientId, caseData, fetchLimit],
  );

  useEffect(() => {
    if (user) {
      fetchCases(currentTab);
    }
  }, [user, currentTab, newCaseTrigger]);

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

  return (
    <Box className="py-4 w-full mx-auto relative flex flex-col">
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

export default CaseCompactView;
