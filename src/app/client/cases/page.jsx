// src/app/clientCases/page.jsx

"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { useUser } from "@/hooks/useUser";
import { Box, Text, Button, Dialog } from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";
import Pagination from "@/components/Pagination";
import ClientCaseTimeline from "./ClientCaseTimeline";
import { useRouter } from "next/navigation";
import ClientCaseCard from "./ClientCaseCard";

const ClientCasesPage = () => {
  const { user } = useUser();
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 9;
  const [totalCasesCount, setTotalCasesCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (user?.role !== "client") {
      router.push("/");
    } else {
      fetchClientCases(page, pageSize);
    }
  }, [user, page]);

  const fetchClientCases = async (page = 1, pageSize = 9) => {
    try {
      setIsLoading(true);

      let query = supabase.from("cases").select(
        `
        *,
        case_categories (id, name),
        case_clients !inner(
          client:users (id, name)
        ),
        case_staff (
          staff:users (id, name)
        ),
        case_opponents (
          opponent:opponents (id, name)
        )
      `,
        { count: "exact" },
      );

      query = query.eq("case_clients.client_id", user.id);

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
  };

  if (isLoading) return <Text>Loading...</Text>;

  const totalPages = Math.ceil(totalCasesCount / pageSize);

  return (
    <Box className="p-4 max-w-7xl w-full mx-auto relative flex flex-col">
      <Text size="8" weight="bold" className="mb-4">
        내 사건 진행 상황
      </Text>

      {cases.length > 0 ? (
        <Box className="flex flex-col gap-4">
          {cases.map((caseItem) => (
            <ClientCaseCard
              key={caseItem.id}
              caseItem={caseItem}
              onClick={() => setSelectedCase(caseItem)}
            />
          ))}
        </Box>
      ) : (
        <Text size="3" className="text-center mt-8">
          진행중인 사건이 없습니다.
        </Text>
      )}

      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
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
            <ClientCaseTimeline
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

export default ClientCasesPage;
