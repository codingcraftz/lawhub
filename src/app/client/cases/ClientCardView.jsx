// src/app/client/cases/ClientCardView.jsx

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Flex, Text, Tabs } from "@radix-ui/themes";
import ClientCaseCard from "./ClientCaseCard";
import { useUser } from "@/hooks/useUser";
import Pagination from "@/components/Pagination";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

const ClientCardView = ({ pageSize = 9 }) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const initialTab = searchParams.get("tab") || "ongoing";
  const [currentTab, setCurrentTab] = useState(initialTab);

  const initialPage = parseInt(searchParams.get("page")) || 1;

  // Make initialState a function that takes status as an argument
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

  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);

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

  const fetchCases = useCallback(
    async (status) => {
      if (!user || isLoading) return;

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
          .eq("case_clients.client_id", user.id)
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

        // Save the current tab's page number in the URL
        if (status === currentTab) {
          updateSearchParams({ page: caseData[status].page });
        }
      } catch (error) {
        console.error(`Error fetching ${status} cases:`, error);
      } finally {
        setIsLoading(false);
      }
    },
    [user, isLoading, caseData, pageSize, currentTab],
  );

  useEffect(() => {
    if (user) {
      fetchCases(currentTab);
    }
    // Only re-fetch when currentTab or the page for the current tab changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentTab, caseData[currentTab].page]);

  const handleTabChange = (value) => {
    setCurrentTab(value);
    updateSearchParams({ tab: value, page: 1 }); // Reset page to 1 when tab changes
    setCaseData((prevData) => ({
      ...prevData,
      [value]: { ...prevData[value], page: 1 },
    }));
  };

  const handlePageChange = (newPage) => {
    setCaseData((prevData) => ({
      ...prevData,
      [currentTab]: { ...prevData[currentTab], page: newPage },
    }));
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

        {["ongoing", "scheduled", "closed"].map((status) => {
          const totalPages = Math.ceil(caseData[status].count / pageSize);

          return (
            <Tabs.Content key={status} value={status}>
              {caseData[status].cases.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {caseData[status].cases.map((caseItem) => (
                      <ClientCaseCard
                        key={caseItem.id}
                        caseItem={caseItem}
                        onClick={() =>
                          router.push(`/client/cases/${caseItem.id}`)
                        }
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
          );
        })}
      </Tabs.Root>
    </Box>
  );
};

export default ClientCardView;
