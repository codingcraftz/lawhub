"use client";

import React, { useState, useEffect } from "react";
import { Box, Text, Flex, Button, Card } from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";
import { supabase } from "@/utils/supabase";

/**
 * - 상단: 고객/그룹 검색 → 선택
 * - 중단: 선택된 고객/그룹의 Assignments 목록 → "할당" 버튼
 * - 하단: 현재 이 외부직원이 가진 Assignments 목록 → "삭제" 버튼
 */

export default function UserAssignmentEditor({ user, assignments }) {
  // (A) 고객/그룹 검색 상태
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]); // [{ id, name, type }]
  const [selectedEntity, setSelectedEntity] = useState(null); // { id, name, type: 'client' | 'group' }

  // (B) 선택된 고객/그룹에 연결된 Assignments (의뢰) 목록
  const [entityAssignments, setEntityAssignments] = useState([]);

  // (C) 이미 이 외부직원에게 허가된 Assignments 목록
  const [userAssignments, setUserAssignments] = useState([]);

  // --- (1) 외부직원(user)이 가진 Assignments 불러오기 ---
  const fetchUserAssignments = async () => {
    // user_assignments 테이블: { user_id, assignment_id }
    const { data, error } = await supabase
      .from("user_assignments")
      .select(
        "id, assignment_id, assignments!inner(description, status, created_at)",
      )
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching user assignments:", error);
      return;
    }
    setUserAssignments(data || []);
  };

  useEffect(() => {
    if (user?.id) {
      fetchUserAssignments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // --- (2) 고객/그룹 검색 ---
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    // (2-1) 클라이언트
    const { data: clientData, error: clientError } = await supabase
      .from("users")
      .select("id, name")
      .eq("role", "client")
      .ilike("name", `%${searchTerm}%`);

    if (clientError) {
      console.error("Error searching clients:", clientError);
    }

    // (2-2) 그룹
    const { data: groupData, error: groupError } = await supabase
      .from("groups")
      .select("id, name")
      .ilike("name", `%${searchTerm}%`);

    if (groupError) {
      console.error("Error searching groups:", groupError);
    }

    const combined = [];
    if (clientData) {
      combined.push(
        ...clientData.map((c) => ({ id: c.id, name: c.name, type: "client" })),
      );
    }
    if (groupData) {
      combined.push(
        ...groupData.map((g) => ({ id: g.id, name: g.name, type: "group" })),
      );
    }

    setSearchResults(combined);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  // --- (3) 고객/그룹 선택 ---
  const handleSelectEntity = async (entity) => {
    setSelectedEntity(entity);
    setEntityAssignments([]);

    // (3-1) 그 entity가 가진 Assignments 불러오기
    if (entity.type === "client") {
      // assignment_clients에서 client_id = entity.id
      const { data, error } = await supabase
        .from("assignment_clients")
        .select("assignment_id, assignments(*)")
        .eq("client_id", entity.id);

      if (error) {
        console.error("Error fetching assignments for client:", error);
      } else {
        const result =
          data?.map((row) => ({
            id: row.assignments.id,
            description: row.assignments.description,
            status: row.assignments.status,
            created_at: row.assignments.created_at,
          })) || [];
        setEntityAssignments(result);
      }
    }

    if (entity.type === "group") {
      // assignment_groups에서 group_id = entity.id
      const { data, error } = await supabase
        .from("assignment_groups")
        .select("assignment_id, assignments(*)")
        .eq("group_id", entity.id);

      if (error) {
        console.error("Error fetching assignments for group:", error);
      } else {
        const result =
          data?.map((row) => ({
            id: row.assignments.id,
            description: row.assignments.description,
            status: row.assignments.status,
            created_at: row.assignments.created_at,
          })) || [];
        setEntityAssignments(result);
      }
    }
  };

  // --- (4) 이 외부직원에게 Assignment 추가(허가) ---
  const handleAddAssignment = async (assignment) => {
    // user_assignments에 insert
    const { error } = await supabase.from("user_assignments").insert({
      user_id: user.id,
      assignment_id: assignment.id,
    });
    if (error) {
      console.error("Error assigning assignment:", error);
      alert("추가 중 오류가 발생했습니다.");
      return;
    }
    alert(`${assignment.description}을(를) ${user.name}님에게 할당했습니다.`);
    // 다시 업데이트
    fetchUserAssignments();
  };

  // --- (5) 이 외부직원에게 할당된 Assignment 삭제 ---
  const handleRemoveAssignment = async (id) => {
    // user_assignments에서 id로 삭제
    const { error } = await supabase
      .from("user_assignments")
      .delete()
      .eq("id", id);
    if (error) {
      console.error("Error removing assignment:", error);
      alert("삭제 중 오류가 발생했습니다.");
      return;
    }
    alert("해당 업무 권한이 제거되었습니다.");
    fetchUserAssignments();
  };

  return (
    <Box>
      <p className="pb-3 font-bold text-lg">
        {user.name} ({user.email})
      </p>

      {/* (A) 고객/그룹 검색 영역 */}
      <Flex gap="2" className="mb-4">
        <input
          type="text"
          placeholder="고객/그룹 이름 검색"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 border border-gray-6 rounded px-2 py-1"
        />
        <Button variant="soft" onClick={handleSearch}>
          검색
        </Button>
      </Flex>

      {/* 검색 결과 */}
      {searchResults.length > 0 && (
        <Card p="3" className="mb-4 border border-gray-6">
          <Text size="3" weight="bold" className="mb-2">
            검색 결과
          </Text>
          {searchResults.map((item) => (
            <Flex
              key={`${item.type}-${item.id}`}
              align="center"
              justify="between"
              className="border-b last:border-b-0 border-gray-6 py-2 cursor-pointer hover:bg-gray-3"
              onClick={() => handleSelectEntity(item)}
            >
              <Text>
                {item.name} ({item.type === "client" ? "개인" : "단체"})
              </Text>
            </Flex>
          ))}
        </Card>
      )}

      {/* (B) 선택된 고객/그룹 + 그에 연결된 Assignments 목록 */}
      {selectedEntity && (
        <Card p="3" className="mb-4 border border-gray-6">
          <Text size="3" weight="bold" className="mb-2">
            [{selectedEntity.type === "group" ? "단체" : "개인"}]선택된 대상:{" "}
            {selectedEntity.name}
          </Text>

          {entityAssignments.length === 0 ? (
            <h2 className="text-gray-11 py-2">
              해당 고객의 등록된 의뢰가 없습니다.
            </h2>
          ) : (
            <Box className="max-h-[200px] overflow-y-auto">
              {entityAssignments.map((assg) => (
                <Flex
                  key={assg.id}
                  align="center"
                  justify="between"
                  className="border-b last:border-b-0 border-gray-6 py-2 px-2 hover:bg-gray-3"
                >
                  <Box>
                    <Text size="3" weight="semibold">
                      {assg.description || "No Description"}
                    </Text>
                    <Text size="2" color="gray">
                      {assg.status} /{" "}
                      {new Date(assg.created_at).toLocaleDateString("ko-KR")}
                    </Text>
                  </Box>
                  <Button
                    variant="outline"
                    size="2"
                    onClick={() => handleAddAssignment(assg)}
                  >
                    할당
                  </Button>
                </Flex>
              ))}
            </Box>
          )}
        </Card>
      )}

      {/* (C) 이미 이 외부직원에게 허락된 Assignments 목록 */}
      <Text size="3" weight="bold" className="mb-2">
        할당된 의뢰 목록
      </Text>
      {userAssignments.length === 0 ? (
        <Text color="gray">아직 아무것도 할당되지 않았습니다.</Text>
      ) : (
        <Box className="max-h-[200px] overflow-y-auto border-t pt-2 border-gray-6">
          {userAssignments.map((ua) => (
            <Flex
              key={ua.id}
              align="center"
              justify="between"
              className="border-b last:border-b-0 border-gray-6 py-2 px-2 hover:bg-gray-3"
            >
              <Box className="flex gap-2 items-center">
                <Text size="3" weight="semibold">
                  {ua.assignments.description || "No Description"}
                </Text>
                <Text size="2" color="gray">
                  {new Date(ua.assignments.created_at).toLocaleDateString(
                    "ko-KR",
                  )}
                </Text>
              </Box>
              <Button
                variant="ghost"
                color="red"
                size="2"
                onClick={() => handleRemoveAssignment(ua.id)}
              >
                <Cross2Icon width={20} height={20} />
              </Button>
            </Flex>
          ))}
        </Box>
      )}
    </Box>
  );
}
