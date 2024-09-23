"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Text, Flex, IconButton, Tooltip, Tabs } from "@radix-ui/themes";
import { PlusIcon } from "@radix-ui/react-icons";
import CaseForm from "./_components/CaseForm";
import CaseCard from "./_components/CaseCard";
import CaseTimeline from "./_components/CaseTimeline";
import Modal from "@/components/Modal";

const BoardsPage = () => {
  const [cases, setCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const { data, error } = await supabase
        .from("cases")
        .select(
          `
        *,
        clients:case_clients(
          profiles(
            id,
            name,
            phone_number
          )
        ),
        staff:case_staff(
          profiles(
            id,
            name
          )
        ),
        category:case_categories(name)
      `,
        )
        .order("start_date", { ascending: false });

      if (error) throw error;

      setCases(data);
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

  console.log(cases);
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
              <Flex wrap="wrap" gap="4" mt="4">
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
              </Flex>
            </Tabs.Content>

            <Tabs.Content value="closed">
              <Flex wrap="wrap" gap="4" mt="4">
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
              </Flex>
            </Tabs.Content>
          </>
        ) : (
          <Text size="3" style={{ textAlign: "center", marginTop: "2rem" }}>
            등록된 사건이 없습니다. 새 사건을 등록해주세요.
          </Text>
        )}
      </Tabs.Root>

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
              fetchCases();
              setIsNewCaseModalOpen(false);
            }}
          />
        </Modal>
      )}
    </Box>
  );
};

export default BoardsPage;
