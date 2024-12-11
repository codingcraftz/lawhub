"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Text, Flex, Tabs } from "@radix-ui/themes";
import CaseCard from "./CaseCard";
import { useUser } from "@/hooks/useUser";
import Pagination from "@/components/Pagination";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import useRoleRedirect from "@/hooks/userRoleRedirect";

const PAGE_SIZE = 9;

const CaseCardView = ({ clientId, newCaseTrigger }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "ongoing";
  const initialPage = parseInt(searchParams.get("page")) || 1;
  const [currentTab, setCurrentTab] = useState(initialTab);
  const [caseData, setCaseData] = useState({
    cases: [],
    count: 0,
    page: initialPage,
  });

  useRoleRedirect(["staff", "admin"], "/login");
  const { user } = useUser();
  const isAdmin = user?.role === "staff" || user?.role === "admin";

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
    router.push(`${pathname}?${newSearch}`);
  };

  const handleTabChange = (value) => {
    setCurrentTab(value);
    updateSearchParams({ tab: value, page: 1 });
    setCaseData((prev) => ({ ...prev, page: 1 }));
  };

  const fetchData = async () => {
    try {
      if (!clientId || !user) return;

      const page = caseData.page;

      // 기본 쿼리 설정
      let query = supabase
        .from("cases")
        .select(
          `
        *,
        case_categories (id, name),
        case_clients!inner (client:users (id, name)),
        case_staff (staff:users (id, name)),
        case_opponents (opponent:opponents (id, name))
      `,
          { count: "exact" },
        )
        .eq("case_clients.client_id", clientId)
        .eq("status", currentTab)
        .order("start_date", { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

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
          // 담당 사건이 없는 경우 빈 결과 반환
          setCaseData((prev) => ({ ...prev, cases: [], count: 0 }));
          return;
        }
      }

      const { data, error, count } = await query;
      if (error) throw error;

      setCaseData((prev) => ({ ...prev, cases: data, count, page }));
    } catch (error) {
      console.error("Error fetching cases:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentTab, caseData.page, clientId, newCaseTrigger]);

  const handlePageChange = (newPage) => {
    setCaseData((prev) => ({ ...prev, page: newPage }));
    updateSearchParams({ page: newPage });
  };

  const totalPages = Math.ceil(caseData.count / PAGE_SIZE);

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

        <Tabs.Content value={currentTab}>
          {caseData.cases.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {caseData.cases.map((caseItem) => (
                  <CaseCard
                    key={caseItem.id}
                    isAdmin={isAdmin}
                    fetchCases={fetchData}
                    caseItem={caseItem}
                  />
                ))}
              </div>
              {totalPages > 1 && (
                <Pagination
                  currentPage={caseData.page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          ) : (
            <Flex justify="center">
              <Text size="3" className="text-center mt-8">
                {currentTab === "ongoing"
                  ? "진행중인 사건이 없습니다."
                  : currentTab === "scheduled"
                    ? "진행예정 사건이 없습니다."
                    : "종료된 사건이 없습니다."}
              </Text>
            </Flex>
          )}
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
};

export default CaseCardView;
