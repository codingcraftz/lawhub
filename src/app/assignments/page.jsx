"use client";

import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/utils/supabase";
import { useRouter } from "next/navigation";
import { Box, Flex, Text, Button   } from "@radix-ui/themes";
import useRoleRedirect from "@/hooks/userRoleRedirect";
import Pagination from "@/components/Pagination";
import Link from "next/link";

// 페이지당 표시할 사건 수
const PAGE_SIZE = 10;

export default function AssignmentsPage() {
  // 스태프/어드민 역할이 아닌 경우 로그인 페이지(/login)로 리다이렉트
  useRoleRedirect(["staff", "admin"], "/login");

  const router = useRouter();
  const [assignments, setAssignments] = useState([]);
  const [filtered, setFiltered] = useState([]);

  // 검색 상태 (예: 사건 설명, 의뢰인 이름, 채무자 이름 등에서 검색)
  const [searchQuery, setSearchQuery] = useState("");

  // 진행 상태 필터 (예: ongoing / closed 등)
  const [statusFilter, setStatusFilter] = useState("all");

  // 현재 페이지 (Pagination)
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 1. 전체 사건 가져오기
  const fetchAssignments = async () => {
    /**
     * 예: assignments 테이블 구조 (가정)
     * id, description, status, created_at, updated_at 등...
     *
     * 관계:
     * assignment_clients (many to one) → client_id, assignments 테이블과 연결
     * assignment_debtors (many to one) → debtor_id, assignments 테이블과 연결
     *
     * 이 예시는 "users" 테이블에서 의뢰인 이름을 가져오고,
     * "debtors" 테이블에서 채무자 이름을 가져온다고 가정합니다.
     */
    const { data, error } = await supabase.from("assignments").select(
      `
          id,
          description,
          status,
          created_at,
          assignment_clients(
            client_id,
            users!inner(
              id,
              name
            )
          ),
          assignment_debtors(
            debtor_id,
            debtors!inner(
              id,
              name
            )
          )
        `,
    );

    if (error) {
      console.error("Error fetching assignments:", error);
      return;
    }

    // data 예시 구조
    // [
    //   {
    //     id: 1,
    //     description: "사건1 설명",
    //     status: "ongoing",
    //     created_at: "2023-xx-xx",
    //     assignment_clients: [
    //       {
    //         client_id: 2,
    //         users: {
    //           id: 2,
    //           name: "클라이언트A"
    //         }
    //       }
    //     ],
    //     assignment_debtors: [
    //       {
    //         debtor_id: 5,
    //         debtors: {
    //           id: 5,
    //           name: "채무자1"
    //         }
    //       }
    //     ]
    //   },
    //   ...
    // ]

    setAssignments(data || []);
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  // 2. 검색, 필터 적용
  useEffect(() => {
    const filteredData = assignments.filter((assignment) => {
      // 상태 필터 (ongoing, closed, all 등)
      if (statusFilter !== "all" && assignment.status !== statusFilter) {
        return false;
      }

      // 검색어가 있는 경우: 사건 설명, 의뢰인 이름, 채무자 이름 등에 매칭
      const clientNames = assignment.assignment_clients
        ?.map((ac) => ac.users?.name || "")
        .join(", ");
      const debtorNames = assignment.assignment_debtors
        ?.map((ad) => ad.debtors?.name || "")
        .join(", ");

      const searchTarget = [
        assignment.description,
        clientNames,
        debtorNames,
      ].join(" ");

      if (
        searchQuery &&
        !searchTarget.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      return true;
    });

    // 페이징 계산
    const total = filteredData.length;
    setTotalPages(Math.ceil(total / PAGE_SIZE));

    // 현재 페이지 범위에 맞게 slice
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;

    setFiltered(filteredData.slice(startIndex, endIndex));
  }, [assignments, searchQuery, statusFilter, currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // 3. 테이블 렌더
  return (
    <Box className="p-4 w-full">
      <Flex direction="column" gap="4">
        {/* 헤더 영역 */}
        <Flex justify="between" align="center">
          <Text size="5" weight="bold">
            사건 관리
          </Text>

          <Flex gap="2">
            {/* 예시: 새 사건 등록하기 (AssignmentForm 사용 가능) */}
            <Link href="/some-create-assignment-page">
              <Button color="green">새 사건 등록</Button>
            </Link>
          </Flex>
        </Flex>

        {/* 검색, 필터 */}
        <Flex justify="between" align="center" className="mt-2">
          {/* 검색 입력 */}
          <input
            type="text"
            placeholder="검색 (사건 설명, 의뢰인, 채무자)"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="border rounded px-2 py-1 w-60"
          />

          {/* 상태 필터 */}
          <Flex gap="2" align="center">
            <Text size="3">진행 상태:</Text>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="border rounded px-2 py-1"
            >
              <option value="all">전체</option>
              <option value="ongoing">진행 중</option>
              <option value="closed">종결</option>
              {/* 필요하다면 상태 더 추가 */}
            </select>
          </Flex>
        </Flex>

        {/* 사건 목록 테이블 */}
        <Box className="overflow-auto">
          <table className="min-w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-2 border-b border-gray-200">
                <th className="p-2 text-left border-r">설명</th>
                <th className="p-2 text-left border-r">의뢰인</th>
                <th className="p-2 text-left border-r">채무자</th>
                <th className="p-2 text-left border-r">생성일</th>
                <th className="p-2 text-left">관리</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((assignment) => {
                const clientNames = assignment.assignment_clients
                  ?.map((ac) => ac.users?.name)
                  .join(", ");
                const debtorNames = assignment.assignment_debtors
                  ?.map((ad) => ad.debtors?.name)
                  .join(", ");

                return (
                  <tr key={assignment.id} className="border-b border-gray-200">
                    <td className="p-2 border-r">{assignment.description}</td>
                    <td className="p-2 border-r">{clientNames}</td>
                    <td className="p-2 border-r">{debtorNames}</td>
                    <td className="p-2 border-r">
                      {new Date(assignment.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-2">
                      {/* 사건 상세 이동 */}
                      <Link href={`/client/assignment/${assignment.id}`}>
                        <Button color="blue" variant="soft" className="mr-2">
                          상세
                        </Button>
                      </Link>
                      {/* 필요하다면 수정/삭제 버튼 추가 */}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Box>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </Flex>
    </Box>
  );
}
