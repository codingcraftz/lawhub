// src/app/boards/page.jsx

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Text, Flex, Tabs, Button, Dialog } from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";
import CaseCard from "./_components/CaseCard";
import CaseTimeline from "./_components/CaseTimeline";
import CaseForm from "./_components/CaseForm";
import { useUser } from "@/hooks/useUser";
import Pagination from "@/components/Pagination";

const BoardsPage = () => {
  const [cases, setCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);
  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 9;
  const [totalCasesCount, setTotalCasesCount] = useState(0);

  const { user } = useUser();

  useEffect(() => {
    if (user) {
      fetchCases(page, pageSize);
    }
  }, [user, page]);

  const fetchCases = useCallback(
    async (page = 1, pageSize = 10) => {
      try {
        setIsLoading(true);
        if (!user) {
          setCases([]);
          setTotalCasesCount(0);
          return;
        }

        // case_opponents 테이블을 opponents와 조인하여 이름 가져오기
        let query = supabase.from("cases").select(
          `
        *,
        case_categories (id, name),
        case_clients (
          client:users (id, name)
        ),
        case_staff!inner (
          staff:users (id, name)
        ),
        case_opponents (
          opponent:opponents (id, name)
        )
      `,
          { count: "exact" },
        );

        if (user.role === "staff") {
          query = query.eq("case_staff.staff_id", user.id);
        }

        query = query
          .order("start_date", { ascending: false })
          .range((page - 1) * pageSize, page * pageSize - 1);

        const { data, error, count } = await query;

        if (error) throw error;

        setCases(data);
        setTotalCasesCount(count);
      } catch (error) {
        console.error("Error fetching cases:", error);
        setCases([]);
      } finally {
        setIsLoading(false);
      }
    },
    [user],
  );

  if (isLoading) return <Text>Loading...</Text>;

  const ongoingCases = cases.filter((c) => c.status === "ongoing" || !c.status);
  const closedCases = cases.filter((c) => c.status === "completed");
  const hasCases = cases.length > 0;
  const totalPages = Math.ceil(totalCasesCount / pageSize);

  console.log(ongoingCases);
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
            <Dialog.Trigger asChild>
              <Button>새 사건 등록</Button>
            </Dialog.Trigger>
            <Dialog.Content style={{ maxWidth: 450 }}>
              <Dialog.Title>새 사건 등록</Dialog.Title>
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
              <CaseForm
                onSuccess={() => {
                  fetchCases(page, pageSize);
                  setIsNewCaseModalOpen(false);
                }}
                onClose={() => setIsNewCaseModalOpen(false)}
              />
            </Dialog.Content>
          </Dialog.Root>
        )}
      </Flex>

      <Tabs.Root defaultValue="ongoing">
        <Tabs.List>
          <Tabs.Trigger value="ongoing">진행중인 사건</Tabs.Trigger>
          <Tabs.Trigger value="closed">종료된 사건</Tabs.Trigger>
        </Tabs.List>

        {hasCases ? (
          <>
            <Tabs.Content value="ongoing">
              {ongoingCases.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {ongoingCases.map((caseItem) => (
                    <CaseCard
                      key={caseItem.id}
                      caseItem={caseItem}
                      onClick={() => setSelectedCase(caseItem)}
                    />
                  ))}
                </div>
              ) : (
                <Text size="3" className="text-center mt-8">
                  진행중인 사건이 없습니다.
                </Text>
              )}
            </Tabs.Content>

            <Tabs.Content value="closed">
              {closedCases.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {closedCases.map((caseItem) => (
                    <CaseCard
                      key={caseItem.id}
                      caseItem={caseItem}
                      onClick={() => setSelectedCase(caseItem)}
                    />
                  ))}
                </div>
              ) : (
                <Text size="3" className="text-center mt-8">
                  종료된 사건이 없습니다.
                </Text>
              )}
            </Tabs.Content>
          </>
        ) : (
          <Text size="3" className="text-center mt-8">
            등록된 사건이 없습니다. 새 사건을 등록해세요.
          </Text>
        )}
      </Tabs.Root>

      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      {/* 타임라인 모달 */}
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

export default BoardsPage;
