"use client";

import React from "react";
import { supabase } from "@/utils/supabase";
import { Table, Text, Button } from "@radix-ui/themes";

/**
 * @param {Array} inquiries - [{ id, user_id, name, phone, email, content, is_read, created_at }, ...]
 * @param {Function} onRefresh - 호출하면 목록 갱신
 */
export default function InquiryManagementTab({ inquiries, onRefresh }) {
	// 문의 읽음 상태 토글
	const handleToggleRead = async (inquiry) => {
		const newVal = !inquiry.is_read;
		const { error } = await supabase
			.from("inquiries")
			.update({ is_read: newVal })
			.eq("id", inquiry.id);

		if (error) {
			console.error("Error updating inquiry is_read:", error);
			return;
		}
		onRefresh();
	};

	if (!inquiries || inquiries.length === 0) {
		return <Text>문의 내역이 없습니다.</Text>;
	}

	return (
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.ColumnHeaderCell>이름</Table.ColumnHeaderCell>
					<Table.ColumnHeaderCell>전화번호</Table.ColumnHeaderCell>
					<Table.ColumnHeaderCell>이메일</Table.ColumnHeaderCell>
					<Table.ColumnHeaderCell>유형</Table.ColumnHeaderCell> {/* 신규 컬럼 */}
					<Table.ColumnHeaderCell>문의 내용</Table.ColumnHeaderCell>
					<Table.ColumnHeaderCell>작성일</Table.ColumnHeaderCell>
					<Table.ColumnHeaderCell>읽음</Table.ColumnHeaderCell>
				</Table.Row>
			</Table.Header>

			<Table.Body>
				{inquiries.map((inq) => (
					<Table.Row key={inq.id}>
						<Table.Cell>{inq.name || "이름없음"}</Table.Cell>
						<Table.Cell>{inq.phone || "-"}</Table.Cell>
						<Table.Cell>{inq.email || "-"}</Table.Cell>

						{/* user_id 존재 여부로 "기존고객 / 비고객" 표시 */}
						<Table.Cell>
							{inq.user_id ? "기존고객" : "비고객"}
						</Table.Cell>

						<Table.Cell>{inq.content || "-"}</Table.Cell>

						<Table.Cell>
							{new Date(inq.created_at).toLocaleString("ko-KR")}
						</Table.Cell>

						<Table.Cell>
							<input
								type="checkbox"
								checked={inq.is_read || false}
								onChange={() => handleToggleRead(inq)}
							/>
						</Table.Cell>
					</Table.Row>
				))}
			</Table.Body>
		</Table.Root>
	);
}

