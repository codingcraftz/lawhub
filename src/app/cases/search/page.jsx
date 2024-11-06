// src/app/cases/search/page.jsx

"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { Box, Text, Flex, Button } from "@radix-ui/themes";
import Pagination from "@/components/Pagination";
import CaseCard from "@/app/case-management/_components/CaseCard";

const SearchPage = () => {
  const [cases, setCases] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 9;
  const router = useRouter();
  const searchParams = useSearchParams();

  const query = searchParams.get("query");
  const category = searchParams.get("category");
  console.log(query);
  console.log(category);

  useEffect(() => {
    if (query && category) {
      fetchSearchResults();
    }
  }, [query, category, page]);
  const fetchSearchResults = async () => {
    try {
      let caseIds = [];

      if (category === "client") {
        // 1단계: 검색어와 일치하는 의뢰인 ID 가져오기
        const { data: clients, error: clientError } = await supabase
          .from("users")
          .select("id")
          .ilike("name", `%${query}%`);

        if (clientError) throw clientError;

        const clientIds = clients.map((client) => client.id);

        // 2단계: 해당 의뢰인과 연결된 케이스 ID 가져오기
        const { data: caseClients, error: caseClientError } = await supabase
          .from("case_clients")
          .select("case_id")
          .in("client_id", clientIds);

        if (caseClientError) throw caseClientError;

        caseIds = caseClients.map((cc) => cc.case_id);
      } else if (category === "staff") {
        // 담당자에 대한 동일한 로직
        const { data: staff, error: staffError } = await supabase
          .from("users")
          .select("id")
          .ilike("name", `%${query}%`);

        if (staffError) throw staffError;

        const staffIds = staff.map((s) => s.id);

        const { data: caseStaffs, error: caseStaffError } = await supabase
          .from("case_staff")
          .select("case_id")
          .in("staff_id", staffIds);

        if (caseStaffError) throw caseStaffError;

        caseIds = caseStaffs.map((cs) => cs.case_id);
      } else if (category === "opponent") {
        // 상대방에 대한 동일한 로직
        const { data: opponents, error: opponentError } = await supabase
          .from("opponents")
          .select("id")
          .ilike("name", `%${query}%`);

        if (opponentError) throw opponentError;

        const opponentIds = opponents.map((o) => o.id);

        const { data: caseOpponents, error: caseOpponentError } = await supabase
          .from("case_opponents")
          .select("case_id")
          .in("opponent_id", opponentIds);

        if (caseOpponentError) throw caseOpponentError;

        caseIds = caseOpponents.map((co) => co.case_id);
      }

      // 케이스 ID를 사용하여 케이스 가져오기
      let queryBuilder = supabase.from("cases").select(
        `
      *,
      case_categories (id, name),
      case_clients (
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

      if (caseIds.length > 0) {
        queryBuilder = queryBuilder.in("id", caseIds);
      } else {
        // 일치하는 케이스가 없을 경우 결과를 비우기 위해 불가능한 조건 설정
        queryBuilder = queryBuilder.eq(
          "id",
          "00000000-0000-0000-0000-000000000000",
        );
      }

      const { data, error, count } = await queryBuilder
        .order("start_date", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (error) throw error;

      setCases(data);
      setCount(count);
    } catch (error) {
      console.error("Error fetching search results:", error);
    }
  };

  const handlePageChange = (newPage) => setPage(newPage);
  console.log(cases);

  return (
    <Box className="p-4 max-w-7xl w-full mx-auto">
      <Text size="8" weight="bold" className="mb-4">
        검색 결과
      </Text>
      {cases.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cases.map((caseItem) => (
              <CaseCard key={caseItem.id} caseItem={caseItem} />
            ))}
          </div>
          {Math.ceil(count / pageSize) > 1 && (
            <Pagination
              currentPage={page}
              totalPages={Math.ceil(count / pageSize)}
              onPageChange={handlePageChange}
            />
          )}
        </>
      ) : (
        <Flex justify="center">
          <Text size="3" className="text-center mt-8">
            검색 결과가 없습니다.
          </Text>
        </Flex>
      )}
      <Button onClick={() => router.back()} className="mt-4">
        돌아가기
      </Button>
    </Box>
  );
};

export default SearchPage;
