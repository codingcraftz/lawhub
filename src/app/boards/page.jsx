// components/BoardsPage.js

"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Text, Flex, IconButton, Tooltip, Tabs } from "@radix-ui/themes";
import { PlusIcon } from "@radix-ui/react-icons";
import CaseCard from "./_components/CaseCard";
import CaseTimeline from "./_components/CaseTimeline";
import Modal from "@/components/Modal";
import CaseForm from "./_components/CaseForm";
import { useUser } from "@/hooks/useUser";
import Pagination from "@/components/Pagination";

const BoardsPage = () => {
  const [cases, setCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const fetchCases = async (page = 1, pageSize = 10) => {
    try {
      setIsLoading(true);

      let query = supabase
        .from("cases")
        .select(
          `
          *,
          case_categories(name),
          case_clients(
            profiles (
              name
            )
          ),
          case_staff(
            profiles (
              name
            )
          )
        `,
          { count: "exact" },
        )
        .order("start_date", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (user.role === "staff") {
        query = supabase
          .from("cases")
          .select(
            `
            *,
            case_categories(name),
            case_staff(
              profiles (
                name
              )
            )
          `,
            { count: "exact" },
          )
          .eq("case_staff.staff_id", user.id)
          .order("start_date", { ascending: false })
          .range((page - 1) * pageSize, page * pageSize - 1);
      } else if (user.role === "client") {
        query = supabase
          .from("cases")
          .select(
            `
            *,
            case_categories(name),
            case_clients(
              profiles (
                name
              )
            )
          `,
            { count: "exact" },
          )
          .eq("case_clients.client_id", user.id)
          .order("start_date", { ascending: false })
          .range((page - 1) * pageSize, page * pageSize - 1);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      console.log("Fetched cases:", data); // 디버깅용

      setCases(data);
      setTotalCasesCount(count);
    } catch (error) {
      console.error("Error fetching cases:", error);
      setCases([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <Text>Loading...</Text>;

  const ongoingCases = cases.filter((c) => c.status === "ongoing");
  const closedCases = cases.filter((c) => c.status === "closed");
  const hasCases = cases.length > 0;
  const totalPages = Math.ceil(totalCasesCount / pageSize);

  console.log("Ongoing Cases:", ongoingCases);
  console.log("Closed Cases:", closedCases);

  return (
    <Box
      p="4"
      style={{
        maxWidth: "1200px",
        width: "100%",
        margin: "0 auto",
        position: "relative",
        minHeight: "calc(100vh - 60px)",
      }}
    >
      <Text size="8" weight="bold" mb="4">
        사건 관리
      </Text>

      <Tabs.Root defaultValue="ongoing">
        <Tabs.List>
          <Tabs.Trigger value="ongoing">진행중인 사건</Tabs.Trigger>
          <Tabs.Trigger value="closed">종료된 사건</Tabs.Trigger>
        </Tabs.List>

        {hasCases ? (
          <>
            <Tabs.Content value="ongoing">
              {ongoingCases.length > 0 ? (
                <Box
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                    gap: "1rem",
                    marginTop: "1rem",
                  }}
                >
                  {ongoingCases.map((caseItem) => (
                    <CaseCard
                      key={caseItem.id}
                      caseItem={caseItem}
                      onClick={() => {
                        setSelectedCase(caseItem);
                        setIsModalOpen(true);
                      }}
                    />
                  ))}
                </Box>
              ) : (
                <Text
                  size="3"
                  style={{ textAlign: "center", marginTop: "2rem" }}
                >
                  진행중인 사건이 없습니다.
                </Text>
              )}
            </Tabs.Content>

            <Tabs.Content value="closed">
              {closedCases.length > 0 ? (
                <Box
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                    gap: "1rem",
                    marginTop: "1rem",
                  }}
                >
                  {closedCases.map((caseItem) => (
                    <CaseCard
                      key={caseItem.id}
                      caseItem={caseItem}
                      onClick={() => {
                        setSelectedCase(caseItem);
                        setIsModalOpen(true);
                      }}
                    />
                  ))}
                </Box>
              ) : (
                <Text
                  size="3"
                  style={{ textAlign: "center", marginTop: "2rem" }}
                >
                  종료된 사건이 없습니다.
                </Text>
              )}
            </Tabs.Content>
          </>
        ) : (
          <Text size="3" style={{ textAlign: "center", marginTop: "2rem" }}>
            등록된 사건이 없습니다. 새 사건을 등록해주세요.
          </Text>
        )}
      </Tabs.Root>

      {/* 페이지네이션 추가 */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      {/* 새 사건 등록 버튼 */}
      {user.role === "admin" && (
        <Tooltip content="새 사건 등록">
          <IconButton
            size="4"
            variant="solid"
            color="indigo"
            style={{
              position: "fixed",
              bottom: "2rem",
              right: "2rem",
              borderRadius: "50%",
            }}
            onClick={() => setIsNewCaseModalOpen(true)}
          >
            <PlusIcon width="20" height="20" />
          </IconButton>
        </Tooltip>
      )}

      {isModalOpen && selectedCase && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`${selectedCase.title} 타임라인`}
        >
          <CaseTimeline caseId={selectedCase.id} />
        </Modal>
      )}

      {isNewCaseModalOpen && (
        <Modal
          isOpen={isNewCaseModalOpen}
          onClose={() => setIsNewCaseModalOpen(false)}
          title="새 사건 등록"
        >
          <CaseForm
            onSuccess={() => {
              fetchCases(page, pageSize);
              setIsNewCaseModalOpen(false);
            }}
          />
        </Modal>
      )}
    </Box>
  );
};

export default BoardsPage;
