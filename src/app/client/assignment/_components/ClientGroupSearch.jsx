"use client";

import React, { useState } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Flex, Button, Text } from "@radix-ui/themes";

export default function ClientGroupSearch({
  assignedClients,
  setAssignedClients,
  assignedGroups,
  setAssignedGroups,
}) {
  // 개인 의뢰인 검색 상태
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [clientSearchResults, setClientSearchResults] = useState([]);
  const [clientLoading, setClientLoading] = useState(false);

  // 그룹 검색 상태
  const [groupSearchTerm, setGroupSearchTerm] = useState("");
  const [groupSearchResults, setGroupSearchResults] = useState([]);
  const [groupLoading, setGroupLoading] = useState(false);

  // -----------------------------
  // 1) 개인 의뢰인 검색
  // -----------------------------
  const handleClientSearch = async () => {
    if (!clientSearchTerm.trim()) return;

    try {
      setClientLoading(true);

      // name 컬럼을 대상으로 ilike 검색 (부분 일치)
      const { data, error } = await supabase
        .from("users")
        .select("id, name, phone_number")
        .ilike("name", `%${clientSearchTerm}%`);

      if (error) {
        console.error("개인 의뢰인 검색 오류:", error);
        return;
      }

      setClientSearchResults(data || []);
    } catch (err) {
      console.error("Unexpected client search error:", err);
    } finally {
      setClientLoading(false);
    }
  };

  const handleClientKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleClientSearch();
    }
  };

  const handleAddClient = (client) => {
    // 이미 assignedClients에 포함되어 있지 않은 경우만 추가
    if (!assignedClients.some((c) => c.client_id === client.id)) {
      // assignment_clients 테이블에는 client_id 컬럼이 필요하므로 필드를 맞춰줌
      const newClient = {
        client_id: client.id,
        name: client.name,
        phone_number: client.phone_number,
      };

      setAssignedClients((prev) => [...prev, newClient]);
    }
  };

  // -----------------------------
  // 2) 그룹 검색
  // -----------------------------
  const handleGroupSearch = async () => {
    if (!groupSearchTerm.trim()) return;

    try {
      setGroupLoading(true);

      // name 컬럼을 대상으로 ilike 검색 (부분 일치)
      const { data, error } = await supabase
        .from("groups")
        .select("id, name")
        .ilike("name", `%${groupSearchTerm}%`);

      if (error) {
        console.error("그룹 검색 오류:", error);
        return;
      }

      setGroupSearchResults(data || []);
    } catch (err) {
      console.error("Unexpected group search error:", err);
    } finally {
      setGroupLoading(false);
    }
  };

  const handleGroupKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleGroupSearch();
    }
  };

  const handleAddGroup = (group) => {
    // 이미 assignedGroups에 포함되어 있지 않은 경우만 추가
    if (!assignedGroups.some((g) => g.group_id === group.id)) {
      // assignment_groups 테이블에는 group_id 컬럼이 필요하므로 필드를 맞춰줌
      const newGroup = {
        group_id: group.id,
        name: group.name,
      };

      setAssignedGroups((prev) => [...prev, newGroup]);
    }
  };

  // -----------------------------
  // UI 렌더링
  // -----------------------------
  return (
    <Box className="space-y-4">
      {/* --- 개인 의뢰인 검색 영역 --- */}
      <Box>
        <Text size="3" weight="bold" className="mb-2">
          개인 의뢰인 검색
        </Text>
        <Flex gap="2" className="mb-3">
          <input
            type="text"
            className="border border-gray-6 rounded px-2 py-1 flex-1"
            placeholder="이름으로 검색"
            value={clientSearchTerm}
            onChange={(e) => setClientSearchTerm(e.target.value)}
            onKeyDown={handleClientKeyPress}
          />
          <Button
            variant="soft"
            color="blue"
            onClick={handleClientSearch}
            disabled={clientLoading}
          >
            검색
          </Button>
        </Flex>

        {/* 검색 결과 리스트 */}
        {clientSearchResults.length > 0 && (
          <Box
            style={{
              maxHeight: "150px",
              overflowY: "auto",
              border: "1px solid var(--gray-6)",
              borderRadius: 4,
              padding: 8,
            }}
          >
            {clientSearchResults.map((item) => (
              <Flex
                key={item.id}
                align="center"
                justify="between"
                className="mb-2 last:mb-0"
              >
                <Text size="2">
                  {item.name} / {item.phone_number || "전화번호 없음"}
                </Text>
                <Button
                  variant="soft"
                  size="2"
                  onClick={() => handleAddClient(item)}
                >
                  추가
                </Button>
              </Flex>
            ))}
          </Box>
        )}
      </Box>

      {/* --- 그룹 검색 영역 --- */}
      <Box>
        <Text size="3" weight="bold" className="mb-2">
          그룹 검색
        </Text>
        <Flex gap="2" className="mb-3">
          <input
            type="text"
            className="border border-gray-6 rounded px-2 py-1 flex-1"
            placeholder="그룹명으로 검색"
            value={groupSearchTerm}
            onChange={(e) => setGroupSearchTerm(e.target.value)}
            onKeyDown={handleGroupKeyPress}
          />
          <Button
            variant="soft"
            color="blue"
            onClick={handleGroupSearch}
            disabled={groupLoading}
          >
            검색
          </Button>
        </Flex>

        {/* 그룹 검색 결과 리스트 */}
        {groupSearchResults.length > 0 && (
          <Box
            style={{
              maxHeight: "150px",
              overflowY: "auto",
              border: "1px solid var(--gray-6)",
              borderRadius: 4,
              padding: 8,
            }}
          >
            {groupSearchResults.map((group) => (
              <Flex
                key={group.id}
                align="center"
                justify="between"
                className="mb-2 last:mb-0"
              >
                <Text size="2">{group.name}</Text>
                <Button
                  variant="soft"
                  size="2"
                  onClick={() => handleAddGroup(group)}
                >
                  추가
                </Button>
              </Flex>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
