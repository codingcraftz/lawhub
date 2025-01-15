"use client";

import React, { useState } from "react";
import { Flex, Text, Card } from "@radix-ui/themes";
import UserAssignmentEditor from "./UserAssignmentEditor";

/**
 * 외부 직원( employee_type = 'external' )들 목록을 왼쪽에,
 * 오른쪽에서 선택한 외부직원의 Assignments 관리 (고객/그룹 + 의뢰 검색/할당) 기능을 담당
 */
export default function ExternalAccessTab({ users, assignments }) {
	const [selectedUser, setSelectedUser] = useState(null);

	return (
		<Flex className="mt-4 gap-6">
			{/* 왼쪽: 외부 직원 목록 */}
			<Card
				p="3"
				className="w-1/4 min-w-[350px] max-h-[500px] overflow-auto shadow-md"
			>
				<Text weight="bold" size="4" className="mb-3">
					외부 직원 목록
				</Text>
				{users.length === 0 && <Text color="gray">외부 직원이 없습니다.</Text>}
				{users.map((u) => (
					<div
						key={u.id}
						className={`cursor-pointer rounded-md p-2 mb-1 ${selectedUser?.id === u.id
							? "bg-primary-3 text-primary-11"
							: "hover:bg-gray-3"
							}`}
						onClick={() => setSelectedUser(u)}
					>
						{u.name} ({u.email})
					</div>
				))}
			</Card>

			{/* 오른쪽: 선택된 외부 직원의 Assignments 관리 */}
			<Card p="4" className="flex-1 shadow-md">
				{selectedUser ? (
					<UserAssignmentEditor user={selectedUser} assignments={assignments} />
				) : (
					<Flex justify="center" align="center" className="h-full">
						<Text>좌측에서 외부 직원을 선택해주세요.</Text>
					</Flex>
				)}
			</Card>
		</Flex>
	);
}

