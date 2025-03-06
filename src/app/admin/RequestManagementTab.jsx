"use client";

import React from "react";
import { supabase } from "@/utils/supabase";
import { Table, Text } from "@radix-ui/themes";

/**
 * @param {Array} requests - [{ id, user_id, name, phone, email, case_detail, want, is_read, created_at }, ...]
 * @param {Function} onRefresh - 호출하면 목록 갱신
 */
export default function RequestManagementTab({ requests, onRefresh }) {
  // 의뢰 읽음 상태 토글
  const handleToggleRead = async (req) => {
    const newVal = !req.is_read;
    const { error } = await supabase
      .from("requests")
      .update({ is_read: newVal })
      .eq("id", req.id);

    if (error) {
      console.error("Error updating request is_read:", error);
      return;
    }
    onRefresh();
  };

  if (!requests || requests.length === 0) {
    return <Text>의뢰 내역이 없습니다.</Text>;
  }

  return (
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>이름</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>전화번호</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>이메일</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>유형</Table.ColumnHeaderCell>{" "}
          {/* 신규 컬럼 */}
          <Table.ColumnHeaderCell>사건 경위</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>원하는 바</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>작성일</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>읽음</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {requests.map((req) => (
          <Table.Row key={req.id}>
            <Table.Cell>{req.name || "이름없음"}</Table.Cell>
            <Table.Cell>{req.phone || "-"}</Table.Cell>
            <Table.Cell>{req.email || "-"}</Table.Cell>

            {/* user_id => "기존고객" : "비고객" */}
            <Table.Cell>{req.user_id ? "기존고객" : "비고객"}</Table.Cell>

            <Table.Cell>{req.case_detail || "-"}</Table.Cell>
            <Table.Cell>{req.want || "-"}</Table.Cell>
            <Table.Cell>
              {new Date(req.created_at).toLocaleString("ko-KR")}
            </Table.Cell>
            <Table.Cell>
              <input
                type="checkbox"
                checked={req.is_read || false}
                onChange={() => handleToggleRead(req)}
              />
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}
