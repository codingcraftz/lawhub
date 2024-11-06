"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Text, Flex, Tabs, Button, Dialog } from "@radix-ui/themes";
import { Cross2Icon, MagnifyingGlassIcon } from "@radix-ui/react-icons";
import CaseCard from "./_components/CaseCard";
import CaseTimeline from "./_components/CaseTimeline";
import CaseForm from "./_components/CaseForm";
import { useUser } from "@/hooks/useUser";
import Pagination from "@/components/Pagination";
import useRoleRedirect from "@/hooks/userRoleRedirect";
import { useForm } from "react-hook-form";

const CaseManagementPage = () => {
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

  const [searchCaseData, setSearchCaseData] = useState({
    ongoing: initialState,
    scheduled: initialState,
    closed: initialState,
  });

  const [selectedCase, setSelectedCase] = useState(null);
  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { searchTerm: "", searchCategory: "client" },
  });
  const [formValues, setFormValues] = useState({
    searchTerm: "",
    searchCategory: "client",
  });

  const pageSize = 9;
  const { user } = useUser();
  const [isSearching, setIsSearching] = useState(false);
  const [searchPage, setSearchPage] = useState(1);

  useRoleRedirect(["staff", "admin"], "/login");

  useEffect(() => {
    if (user && !isSearching) {
      fetchCases("ongoing");
      fetchCases("scheduled");
      fetchCases("closed");
    }
  }, [
    user,
    caseData.ongoing.page,
    caseData.scheduled.page,
    caseData.closed.page,
    isSearching,
  ]);

  useEffect(() => {
    if (isSearching) {
      fetchSearchResults("ongoing");
      fetchSearchResults("scheduled");
      fetchSearchResults("closed");
    }
  }, [isSearching, searchPage]);

  const fetchCases = useCallback(
    async (status) => {
      try {
        if (!user) return;

        if (user.role === "admin") {
          // 관리자(admin)일 경우 모든 사건을 조회
          const { data, error, count } = await supabase
            .from("cases")
            .select(
              `
                *,
                case_categories (id, name),
                case_clients (client:users (id, name)),
                case_staff (staff:users (id, name)),
                case_opponents (opponent:opponents (id, name))
              `,
              { count: "exact" },
            )
            .eq("status", status)
            .order("start_date", { ascending: false })
            .range(
              (caseData[status].page - 1) * pageSize,
              caseData[status].page * pageSize - 1,
            );

          if (error) throw error;

          setCaseData((prevData) => ({
            ...prevData,
            [status]: { ...prevData[status], cases: data, count },
          }));
        } else if (user.role === "staff") {
          // 직원(staff)일 경우 자신이 담당자인 사건의 ID를 먼저 조회
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

          // 해당 사건 ID로 사건을 조회, 모든 case_staff 포함
          const { data, error, count } = await supabase
            .from("cases")
            .select(
              `
                *,
                case_categories (id, name),
                case_clients (client:users (id, name)),
                case_staff (staff:users (id, name)),
                case_opponents (opponent:opponents (id, name))
              `,
              { count: "exact" },
            )
            .in("id", caseIds)
            .eq("status", status)
            .order("start_date", { ascending: false })
            .range(
              (caseData[status].page - 1) * pageSize,
              caseData[status].page * pageSize - 1,
            );

          if (error) throw error;

          setCaseData((prevData) => ({
            ...prevData,
            [status]: { ...prevData[status], cases: data, count },
          }));
        }
      } catch (error) {
        console.error(`Error fetching ${status} cases:`, error);
      }
    },
    [user, caseData],
  );

  const fetchSearchResults = useCallback(
    async (status) => {
      try {
        const { searchTerm, searchCategory } = formValues;
        let caseIds = [];

        // 검색 조건에 따라 caseIds를 가져옵니다.
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
          caseIds = caseClients.map((cc) => cc.case_id);
        } else if (searchCategory === "staff") {
          const { data: staff, error: staffError } = await supabase
            .from("users")
            .select("id")
            .ilike("name", `%${searchTerm}%`);

          if (staffError) throw staffError;
          const staffIds = staff.map((s) => s.id);

          const { data: caseStaffs, error: caseStaffError } = await supabase
            .from("case_staff")
            .select("case_id")
            .in("staff_id", staffIds);

          if (caseStaffError) throw caseStaffError;
          caseIds = caseStaffs.map((cs) => cs.case_id);
        } else if (searchCategory === "opponent") {
          const { data: opponents, error: opponentError } = await supabase
            .from("opponents")
            .select("id")
            .ilike("name", `%${searchTerm}%`);

          if (opponentError) throw opponentError;
          const opponentIds = opponents.map((o) => o.id);

          const { data: caseOpponents, error: caseOpponentError } =
            await supabase
              .from("case_opponents")
              .select("case_id")
              .in("opponent_id", opponentIds);

          if (caseOpponentError) throw caseOpponentError;
          caseIds = caseOpponents.map((co) => co.case_id);
        }

        // staff 역할의 사용자에 대한 접근 제어
        if (user.role === "staff") {
          // staff가 담당자로 등록된 case들만 가져오기 위해 추가 조건
          const { data: caseStaffs, error: caseStaffError } = await supabase
            .from("case_staff")
            .select("case_id")
            .eq("staff_id", user.id);

          if (caseStaffError) throw caseStaffError;
          const staffCaseIds = caseStaffs.map((cs) => cs.case_id);

          // 검색 조건과 staff 접근 제어 조건 결합
          caseIds = caseIds.filter((id) => staffCaseIds.includes(id));
        }

        // 상태별로 검색 결과를 가져옵니다.
        const { data, error, count } = await supabase
          .from("cases")
          .select(
            `
            *,
            case_categories (id, name),
            case_clients (client:users (id, name)),
            case_staff (staff:users (id, name)),
            case_opponents (opponent:opponents (id, name))
          `,
            { count: "exact" },
          )
          .in("id", caseIds)
          .eq("status", status)
          .order("start_date", { ascending: false })
          .range(
            (searchCaseData[status].page - 1) * pageSize,
            searchCaseData[status].page * pageSize - 1,
          );

        if (error) throw error;

        setSearchCaseData((prevData) => ({
          ...prevData,
          [status]: { ...prevData[status], cases: data, count },
        }));
      } catch (error) {
        console.error(`Error fetching search ${status} cases:`, error);
      }
    },
    [formValues, user, searchCaseData, pageSize],
  );

  const handlePageChange = (status, newPage) => {
    if (isSearching) {
      setSearchCaseData((prevData) => ({
        ...prevData,
        [status]: { ...prevData[status], page: newPage },
      }));
      setSearchPage(newPage);
    } else {
      setCaseData((prevData) => ({
        ...prevData,
        [status]: { ...prevData[status], page: newPage },
      }));
    }
  };

  const onSuccessUpdate = () => {
    fetchCases("ongoing");
    fetchCases("scheduled");
    fetchCases("closed");
    setIsNewCaseModalOpen(false);
    setSelectedCase(null);
  };

  const hasCases = (status, isSearch) =>
    isSearch
      ? searchCaseData[status].cases.length > 0
      : caseData[status].cases.length > 0;

  const totalPagesCalc = (status, isSearch) =>
    isSearch
      ? Math.ceil(searchCaseData[status].count / pageSize)
      : Math.ceil(caseData[status].count / pageSize);

  const onSearch = (data) => {
    setFormValues(data);
    setIsSearching(true);
    setSearchPage(1);
    // Reset searchCaseData pages to 1
    setSearchCaseData({
      ongoing: { ...initialState, page: 1 },
      scheduled: { ...initialState, page: 1 },
      closed: { ...initialState, page: 1 },
    });
  };

  const clearSearch = () => {
    setIsSearching(false);
    reset();
    setSearchCaseData({
      ongoing: initialState,
      scheduled: initialState,
      closed: initialState,
    });
    setSearchPage(1);
  };

  return (
    <Box className="p-4 max-w-7xl w-full mx-auto relative flex flex-col">
      <Flex justify="between" align="center" className="mb-4">
        <Text size="8" weight="bold">
          사건 관리
        </Text>
        {user && (user.role === "admin" || user.role === "staff") && (
          <Dialog.Root
            open={isNewCaseModalOpen}
            onOpenChange={setIsNewCaseModalOpen}
          >
            <Button onClick={() => setIsNewCaseModalOpen(true)}>
              새 사건 등록
            </Button>
            <Dialog.Content style={{ maxWidth: 450 }}>
              <Dialog.Title>새 사건 등록</Dialog.Title>
              <Dialog.Close asChild>
                <Button
                  variant="ghost"
                  color="gray"
                  size="1"
                  style={{ position: "absolute", top: 8, right: 8 }}
                  onClick={() => setIsNewCaseModalOpen(false)}
                >
                  <Cross2Icon />
                </Button>
              </Dialog.Close>
              <CaseForm
                caseData={selectedCase}
                onSuccess={onSuccessUpdate}
                onClose={() => setIsNewCaseModalOpen(false)}
              />
            </Dialog.Content>
          </Dialog.Root>
        )}
      </Flex>
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
                e.preventDefault(); // 기본 폼 제출을 막음
                handleSubmit(onSearch)(); // handleSubmit로 직접 호출
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

      {isSearching ? (
        <>
          <Flex align="center" gap="1rem" className="mb-4">
            <Text size="6" weight="bold">
              검색 결과
            </Text>
            <Button variant="ghost" onClick={clearSearch}>
              검색 취소
            </Button>
          </Flex>

          <Tabs.Root defaultValue="ongoing">
            <Tabs.List>
              <Tabs.Trigger value="ongoing">진행중인 사건</Tabs.Trigger>
              <Tabs.Trigger value="scheduled">진행예정 사건</Tabs.Trigger>
              <Tabs.Trigger value="closed">종료된 사건</Tabs.Trigger>
            </Tabs.List>

            {["ongoing", "scheduled", "closed"].map((status) => (
              <Tabs.Content key={status} value={status}>
                {hasCases(status, true) ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {searchCaseData[status].cases.map((caseItem) => (
                      <CaseCard
                        key={caseItem.id}
                        caseItem={caseItem}
                        onClick={() => setSelectedCase(caseItem)}
                        isAdmin={user?.role === "admin"}
                        fetchCases={() => fetchSearchResults(status)}
                      />
                    ))}
                  </div>
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
                {totalPagesCalc(status, true) > 1 && (
                  <Pagination
                    currentPage={searchCaseData[status].page}
                    totalPages={totalPagesCalc(status, true)}
                    onPageChange={(page) => handlePageChange(status, page)}
                  />
                )}
              </Tabs.Content>
            ))}
          </Tabs.Root>
        </>
      ) : (
        <Tabs.Root defaultValue="ongoing">
          <Tabs.List>
            <Tabs.Trigger value="ongoing">진행중인 사건</Tabs.Trigger>
            <Tabs.Trigger value="scheduled">진행예정 사건</Tabs.Trigger>
            <Tabs.Trigger value="closed">종료된 사건</Tabs.Trigger>
          </Tabs.List>

          {["ongoing", "scheduled", "closed"].map((status) => (
            <Tabs.Content key={status} value={status}>
              {hasCases(status, false) ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {caseData[status].cases.map((caseItem) => (
                    <CaseCard
                      key={caseItem.id}
                      caseItem={caseItem}
                      onClick={() => setSelectedCase(caseItem)}
                      isAdmin={user?.role === "admin"}
                      fetchCases={() => fetchCases(status)}
                    />
                  ))}
                </div>
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
              {totalPagesCalc(status, false) > 1 && (
                <Pagination
                  currentPage={caseData[status].page}
                  totalPages={totalPagesCalc(status, false)}
                  onPageChange={(page) => handlePageChange(status, page)}
                />
              )}
            </Tabs.Content>
          ))}
        </Tabs.Root>
      )}

      {selectedCase && (
        <Dialog.Root
          open={!!selectedCase}
          onOpenChange={() => setSelectedCase(null)}
        >
          <Dialog.Content style={{ maxWidth: 600 }}>
            <Dialog.Title>{selectedCase?.title} 타임라인</Dialog.Title>
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                color="gray"
                size="1"
                style={{ position: "absolute", top: 8, right: 8 }}
              >
                <Cross2Icon />
              </Button>
            </Dialog.Close>
            <CaseTimeline
              caseId={selectedCase?.id}
              caseStatus={selectedCase?.status}
              onClose={() => setSelectedCase(null)}
            />
          </Dialog.Content>
        </Dialog.Root>
      )}
    </Box>
  );
};

export default CaseManagementPage;
