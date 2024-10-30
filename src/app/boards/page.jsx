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
import useRoleRedirect from "@/hooks/userRoleRedirect";

const BoardsPage = () => {
  const [ongoingCases, setOngoingCases] = useState([]);
  const [closedCases, setClosedCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);
  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false);
  const [ongoingPage, setOngoingPage] = useState(1);
  const [closedPage, setClosedPage] = useState(1);
  const pageSize = 9;
  const [totalOngoingCount, setTotalOngoingCount] = useState(0);
  const [totalClosedCount, setTotalClosedCount] = useState(0);
  const { user } = useUser();

  useRoleRedirect(["staff", "admin"], "/login");

  useEffect(() => {
    if (user) {
      fetchOngoingCases(ongoingPage, pageSize);
      fetchClosedCases(closedPage, pageSize);
    }
  }, [user, ongoingPage, closedPage]);

  const fetchOngoingCases = useCallback(
    async (page = 1, pageSize = 10) => {
      try {
        setIsLoading(true);
        if (!user) {
          setOngoingCases([]);
          setTotalOngoingCount(0);
          return;
        }

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
          .eq("status", "ongoing")
          .order("start_date", { ascending: false })
          .range((page - 1) * pageSize, page * pageSize - 1);

        const { data, error, count } = await query;

        if (error) throw error;

        setOngoingCases(data);
        setTotalOngoingCount(count);
      } catch (error) {
        console.error("Error fetching ongoing cases:", error);
        setOngoingCases([]);
      } finally {
        setIsLoading(false);
      }
    },
    [user],
  );

  const fetchClosedCases = useCallback(
    async (page = 1, pageSize = 10) => {
      try {
        setIsLoading(true);
        if (!user) {
          setClosedCases([]);
          setTotalClosedCount(0);
          return;
        }

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
          .eq("status", "completed")
          .order("start_date", { ascending: false })
          .range((page - 1) * pageSize, page * pageSize - 1);

        const { data, error, count } = await query;

        if (error) throw error;

        setClosedCases(data);
        setTotalClosedCount(count);
      } catch (error) {
        console.error("Error fetching closed cases:", error);
        setClosedCases([]);
      } finally {
        setIsLoading(false);
      }
    },
    [user],
  );

  if (isLoading) return <Text>Loading...</Text>;

  const hasOngoingCases = ongoingCases.length > 0;
  const hasClosedCases = closedCases.length > 0;
  const totalOngoingPages = Math.ceil(totalOngoingCount / pageSize);
  const totalClosedPages = Math.ceil(totalClosedCount / pageSize);

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
                onSuccess={() => {
                  fetchOngoingCases(ongoingPage, pageSize);
                  setIsNewCaseModalOpen(false);
                  setSelectedCase(null);
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

        <Tabs.Content value="ongoing">
          {hasOngoingCases ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {ongoingCases.map((caseItem) => (
                <CaseCard
                  key={caseItem.id}
                  caseItem={caseItem}
                  onClick={() => setSelectedCase(caseItem)}
                  isAdmin={user?.role === "admin"}
                  fetchCases={() => fetchOngoingCases(ongoingPage, pageSize)}
                />
              ))}
            </div>
          ) : (
            <Text size="3" className="text-center mt-8">
              진행중인 사건이 없습니다.
            </Text>
          )}
          {totalOngoingPages > 1 && (
            <Pagination
              currentPage={ongoingPage}
              totalPages={totalOngoingPages}
              onPageChange={setOngoingPage}
            />
          )}
        </Tabs.Content>

        <Tabs.Content value="closed">
          {hasClosedCases ? (
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
          {totalClosedPages > 1 && (
            <Pagination
              currentPage={closedPage}
              totalPages={totalClosedPages}
              onPageChange={setClosedPage}
            />
          )}
        </Tabs.Content>
      </Tabs.Root>

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
