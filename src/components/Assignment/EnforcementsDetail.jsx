"use client";

import React from "react";
import { Box, Flex, Text } from "@radix-ui/themes";

/**
 * 강제집행(회수) 내역 컴포넌트
 * - 완료된 항목 (closed) → 먼저 표시
 * - 진행 중 항목 (ongoing) → 나중에 표시
 */
export default function EnforcementsDetail({ enforcements }) {
	if (!enforcements || enforcements.length === 0) {
		return <Text>등록된 회수 항목이 없습니다.</Text>;
	}

	// 완료된 회수 내역 (closed)
	const closed = enforcements.filter((enf) => enf.status === "closed");
	// 진행 중 회수 내역 (ongoing 등)
	const ongoing = enforcements.filter((enf) => enf.status !== "closed");

	// 완료된 항목 → 진행 중 항목 순서로 정렬
	const sortedEnforcements = [...closed, ...ongoing];

	return (
		<Box className="p-4 rounded-md bg-gray-3">
			<Flex direction="column" gap="2">
				{sortedEnforcements.map((enf) => {
					const statusLabel = enf.status === "closed" ? "완료" : "진행중";

					return (
						<Box key={enf.id}>
							<Flex className="gap-4">
								<Text>
									<strong>{enf.type}</strong>
								</Text>
								<Text>{parseInt(enf.amount ?? 0).toLocaleString("ko-KR")}원</Text>
								<Text className={enf.status === "closed" ? "text-green-11" : "text-yellow-11"}>
									{statusLabel}
								</Text>
							</Flex>
						</Box>
					);
				})}
			</Flex>
		</Box>
	);
}


