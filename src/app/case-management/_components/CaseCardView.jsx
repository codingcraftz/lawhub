// src/app/case-management/_components/CaseCardView.jsx

"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Text, Flex, Tabs, Button } from "@radix-ui/themes";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import CaseCard from "./CaseCard";
import { useUser } from "@/hooks/useUser";
import Pagination from "@/components/Pagination";
import useRoleRedirect from "@/hooks/userRoleRedirect";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

const CaseCardView = ({ newCaseTrigger }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Extract initial parameters from URL
  const initialTab = searchParams.get("tab") || "ongoing";
  const initialPage = parseInt(searchParams.get("page")) || 1;
  const initialSearchTerm = searchParams.get("searchTerm") || "";
  const initialSearchCategory = searchParams.get("searchCategory") || "client";

  const [currentTab, setCurrentTab] = useState(initialTab);

  const initialState = (status) => ({
    cases: [],
    count: 0,
    page: initialTab === status && initialSearchTerm ? initialPage : 1,
  });

  const [caseData, setCaseData] = useState({
    ongoing: initialState("ongoing"),
    scheduled: initialState("scheduled"),
    closed: initialState("closed"),
  });

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      searchTerm: initialSearchTerm,
      searchCategory: initialSearchCategory,
    },
  });

  const [formValues, setFormValues] = useState({
    searchTerm: initialSearchTerm,
    searchCategory: initialSearchCategory,
  });

  const pageSize = 9;
  const { user } = useUser();
  const [isSearching, setIsSearching] = useState(!!initialSearchTerm);

  useRoleRedirect(["staff", "admin"], "/login");

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
    updateSearchParams({
      tab: value,
      page: 1,
      searchTerm: isSearching ? formValues.searchTerm : null,
      searchCategory: isSearching ? formValues.searchCategory : null,
    });

    // Reset page numbers when tab changes
    setCaseData((prevData) => ({
      ...prevData,
      [value]: { ...prevData[value], page: 1 },
    }));
  };

  const fetchData = async () => {
    try {
      if (!user) return;

      const status = currentTab;
      const page = isSearching
        ? caseData[status].searchPage || 1
        : caseData[status].page || 1;

      let query = supabase.from("cases").select(
        `
          *,
          case_categories (id, name),
          case_clients (client:users (id, name)),
          case_staff (staff:users (id, name)),
          case_opponents (opponent:opponents (id, name))
        `,
        { count: "exact" },
      );

      // Apply status filter
      query = query.eq("status", status);

      if (isSearching && formValues.searchTerm.trim()) {
        // Apply search filters based on category
        const { searchTerm, searchCategory } = formValues;

        if (searchCategory === "client") {
          const { data: clients, error: clientError } = await supabase
            .from("users")
            .select("id")
            .ilike("name", `%${searchTerm}%`);

          if (clientError) throw clientError;
          const clientIds = clients.map((client) => client.id);

          const { data: caseClients, error: caseClientError } = await supabase
            .from("case_clients")
            .select("case_id")
            .in("client_id", clientIds);

          if (caseClientError) throw caseClientError;
          const caseIds = caseClients.map((cc) => cc.case_id);

          query = query.in("id", caseIds);
        } else if (searchCategory === "staff") {
          const { data: staffs, error: staffError } = await supabase
            .from("users")
            .select("id")
            .ilike("name", `%${searchTerm}%`);

          if (staffError) throw staffError;
          const staffIds = staffs.map((staff) => staff.id);

          const { data: caseStaffs, error: caseStaffError } = await supabase
            .from("case_staff")
            .select("case_id")
            .in("staff_id", staffIds);

          if (caseStaffError) throw caseStaffError;
          const caseIds = caseStaffs.map((cs) => cs.case_id);

          query = query.in("id", caseIds);
        } else if (searchCategory === "opponent") {
          const { data: opponents, error: opponentError } = await supabase
            .from("opponents")
            .select("id")
            .ilike("name", `%${searchTerm}%`);

          if (opponentError) throw opponentError;
          const opponentIds = opponents.map((opponent) => opponent.id);

          const { data: caseOpponents, error: caseOpponentError } =
            await supabase
              .from("case_opponents")
              .select("case_id")
              .in("opponent_id", opponentIds);

          if (caseOpponentError) throw caseOpponentError;
          const caseIds = caseOpponents.map((co) => co.case_id);

          query = query.in("id", caseIds);
        }
      } else {
        // Not searching, apply role-based filters
        if (user.role === "staff") {
          const { data: caseStaffs, error: caseStaffError } = await supabase
            .from("case_staff")
            .select("case_id")
            .eq("staff_id", user.id);

          if (caseStaffError) throw caseStaffError;

          const caseIds = caseStaffs.map((cs) => cs.case_id);

          if (caseIds.length === 0) {
            setCaseData((prevData) => ({
              ...prevData,
              [status]: { ...prevData[status], cases: [], count: 0 },
            }));
            return;
          }

          query = query.in("id", caseIds);
        }
        // Admins see all cases
      }

      query = query
        .order("start_date", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      const { data, error, count } = await query;
      if (error) throw error;

      setCaseData((prevData) => ({
        ...prevData,
        [status]: {
          ...prevData[status],
          cases: data,
          count,
          page,
        },
      }));

      // Update URL parameters
      updateSearchParams({
        page,
        tab: currentTab,
        searchTerm: isSearching ? formValues.searchTerm : null,
        searchCategory: isSearching ? formValues.searchCategory : null,
      });
    } catch (error) {
      console.error(`Error fetching cases:`, error);
    }
  };

  // Fetch data when dependencies change
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    user,
    currentTab,
    isSearching,
    formValues.searchTerm,
    formValues.searchCategory,
    caseData[currentTab].page,
    newCaseTrigger,
  ]);

  const category =
    formValues.searchCategory === "client"
      ? "의뢰인"
      : formValues.searchCategory === "opponent"
        ? "상대방"
        : "담당자";

  const onSearch = (data) => {
    setFormValues(data);
    setIsSearching(true);

    // Reset page number to 1 when a new search is initiated
    setCaseData((prevData) => ({
      ...prevData,
      [currentTab]: { ...prevData[currentTab], page: 1 },
    }));
  };

  const clearSearch = () => {
    setIsSearching(false);
    reset();

    // Reset form values and page numbers
    setFormValues({ searchTerm: "", searchCategory: "client" });
    setCaseData((prevData) => ({
      ...prevData,
      ongoing: { ...prevData["ongoing"], page: 1 },
      scheduled: { ...prevData["scheduled"], page: 1 },
      closed: { ...prevData["closed"], page: 1 },
    }));

    // Update URL parameters
    updateSearchParams({
      searchTerm: null,
      searchCategory: null,
      page: 1,
      tab: currentTab,
    });
  };

  const handlePageChange = (newPage) => {
    setCaseData((prevData) => ({
      ...prevData,
      [currentTab]: { ...prevData[currentTab], page: newPage },
    }));
  };

  const totalPages = Math.ceil(caseData[currentTab].count / pageSize);

  return (
    <Box className="p-4 max-w-7xl w-full mx-auto relative flex flex-col">
      {/* Search Form */}
      <form onSubmit={handleSubmit(onSearch)}>
        <Flex
          className="mb-4"
          align="center"
          style={{
            border: "2px solid var(--gray-6)",
            borderRadius: "15px",
            background: "none",
            padding: "0.5rem",
            width: "fit-content",
          }}
        >
          <select
            {...register("searchCategory")}
            style={{
              border: "none",
              padding: "0 0.5rem",
              color: "var(--gray-11)",
            }}
          >
            <option value="client">의뢰인</option>
            <option value="staff">담당자</option>
            <option value="opponent">상대방</option>
          </select>
          <input
            {...register("searchTerm")}
            type="text"
            placeholder="검색"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit(onSearch)();
              }
            }}
            style={{
              background: "none",
              border: "none",
              outline: "none",
              paddingLeft: "0.5rem",
            }}
          />
          <Button
            type="submit"
            style={{
              alignItems: "center",
              justifyContent: "center",
              background: "none",
              border: "none",
              padding: "0.5rem",
              cursor: "pointer",
            }}
          >
            <MagnifyingGlassIcon width="1.4rem" height="1.4rem" />
          </Button>
        </Flex>
      </form>

      {isSearching && formValues.searchTerm.trim() ? (
        <>
          <Flex align="center" gap="1rem" className="mb-4">
            <Text size="6" weight="bold">
              검색 결과
            </Text>
            <Button variant="ghost" onClick={clearSearch}>
              검색 취소
            </Button>
          </Flex>
          <Text size="4" weight="medium" className="mb-4">
            &quot;[{category}] {formValues.searchTerm}&quot;을(를) 검색한
            결과입니다.
          </Text>
        </>
      ) : null}

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
          {caseData[currentTab].cases.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {caseData[currentTab].cases.map((caseItem) => (
                  <CaseCard
                    key={caseItem.id}
                    caseItem={caseItem}
                    isAdmin={user?.role === "admin"}
                    fetchCases={fetchData}
                  />
                ))}
              </div>
              {totalPages > 1 && (
                <Pagination
                  currentPage={caseData[currentTab].page}
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
