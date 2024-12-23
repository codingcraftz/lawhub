// src/app/case-management/_components/CaseCardView.jsx

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Text, Flex, Tabs } from "@radix-ui/themes";
import CaseCard from "./CaseCard";
import { useUser } from "@/hooks/useUser";
import Pagination from "@/components/Pagination";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import useRoleRedirect from "@/hooks/userRoleRedirect";

const PAGE_SIZE = 9;

const CaseCardView = ({ clientId, newCaseTrigger }) => {
  useRoleRedirect(["staff", "admin"], "/login");

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialTab = searchParams.get("tab") || "ongoing";
  const initialPage = parseInt(searchParams.get("page")) || 1;

  const initialState = (status) => ({
    cases: [],
    count: 0,
    page: initialTab === status ? initialPage : 1,
  });

  const [caseData, setCaseData] = useState({
    ongoing: initialState("ongoing"),
    scheduled: initialState("scheduled"),
    closed: initialState("closed"),
  });

  const [currentTab, setCurrentTab] = useState(initialTab);

  const { user } = useUser();
  const isAdmin = user?.role === "client" || user?.role === "admin";

  const updateSearchParams = (params) => {
    const currentParams = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([key, value]) => {
      if (value == null || value === "") {
        currentParams.delete(key);
      } else {
        currentParams.set(key, value);
      }
    });
    const newSearch = currentParams.toString();
    router.push(`${pathname}?${newSearch}`);
  };

  const handleTabChange = (value) => {
    setCurrentTab(value);
    updateSearchParams({ tab: value, page: 1 });
    setCaseData((prev) => ({
      ...prev,
      [value]: { ...prev[value], page: 1 },
    }));
  };

  const fetchCases = useCallback(
    async (status) => {
      if (!user || !clientId) return;

      const page = caseData[status].page;

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
          { count: "exact" },
        )
        .eq("case_clients.client_id", clientId)
        .eq("status", status)
        .order("start_date", { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      if (user.role === "staff") {
        const { data: caseStaffs, error } = await supabase
          .from("case_staff")
          .select("case_id")
          .eq("staff_id", user.id);

        if (error) {
          console.error(error);
          return;
        }

        const caseIds = caseStaffs.map((cs) => cs.case_id);
        if (caseIds.length > 0) {
          query = query.in("id", caseIds);
        } else {
          setCaseData((prev) => ({
            ...prev,
            [status]: { ...prev[status], cases: [], count: 0 },
          }));
          return;
        }
      }

      const { data, error, count } = await query;
      if (error) {
        console.error("Error fetching cases:", error);
        return;
      }

      setCaseData((prev) => ({
        ...prev,
        [status]: {
          ...prev[status],
          cases: data,
          count,
        },
      }));

      if (status === currentTab) {
        updateSearchParams({ page: caseData[status].page });
      }
    },
    [user, clientId, currentTab, caseData, PAGE_SIZE],
  );

  useEffect(() => {
    if (user && clientId) {
      fetchCases(currentTab);
    }
  }, [user, clientId, currentTab, caseData[currentTab].page, newCaseTrigger]);

  const handlePageChange = (newPage) => {
    setCaseData((prev) => ({
      ...prev,
      [currentTab]: { ...prev[currentTab], page: newPage },
    }));
  };

  return (
    <Box className="py-4 w-full mx-auto relative flex flex-col">
      <Tabs.Root value={currentTab} onValueChange={handleTabChange}>
        <Tabs.List>
          <Tabs.Trigger value="ongoing">진행중인 사건</Tabs.Trigger>
          <Tabs.Trigger value="scheduled">진행예정 사건</Tabs.Trigger>
          <Tabs.Trigger value="closed">종료된 사건</Tabs.Trigger>
        </Tabs.List>

        {["ongoing", "scheduled", "closed"].map((status) => {
          const tabData = caseData[status];
          const totalTabPages = Math.ceil(tabData.count / PAGE_SIZE);

          return (
            <Tabs.Content key={status} value={status}>
              {tabData.cases.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {tabData.cases.map((caseItem) => (
                      <CaseCard
                        key={caseItem.id}
                        caseItem={caseItem}
                        isAdmin={isAdmin}
                        fetchCases={() => fetchCases(status)}
                      />
                    ))}
                  </div>
                  {totalTabPages > 1 && status === currentTab && (
                    <Pagination
                      currentPage={tabData.page}
                      totalPages={totalTabPages}
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
          );
        })}
      </Tabs.Root>
    </Box>
  );
};

export default CaseCardView;
