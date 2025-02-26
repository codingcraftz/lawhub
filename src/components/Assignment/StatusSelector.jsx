"use client";

import React, { useState } from "react";
import { supabase } from "@/utils/supabase";
import { Button, Flex, Text } from "@radix-ui/themes";

/**
 * @param {string} field - 예) 'civil_litigation_status', 'asset_declaration_status', 'creditor_attachment_status' 등
 * @param {string} currentStatus - 현재 DB에 저장된 상태값
 * @param {boolean} isAdmin - 관리자 여부 (true 이면 상태 변경 버튼 활성화)
 */
export default function StatusSelector({ assignmentId, field, currentStatus, isAdmin }) {
	// 상태 옵션 정의
	const litigationStatus = ["예정", "진행중"];
	const litigationResults = ["승소", "패소", "일부승"];
	const defaultStatusOptions = ["예정", "진행중", "완료"];

	// 상태에 따른 옵션 선택
	const statusOptions = field === "civil_litigation_status" ? litigationStatus : defaultStatusOptions;
	const [selectedStatus, setSelectedStatus] = useState(currentStatus || "");

	// DB 업데이트 함수 (관리자만 호출)
	const updateStatus = async (newStatus) => {
		if (selectedStatus === newStatus) return; // 같은 상태면 업데이트 X
		const { error } = await supabase
			.from("assignments")
			.update({ [field]: newStatus })
			.eq("id", assignmentId);

		if (error) {
			console.error("상태 업데이트 오류:", error);
		} else {
			setSelectedStatus(newStatus);
		}
	};

	// 일반 사용자: 현재 상태만 텍스트로 표시
	if (!isAdmin) {
		return <Text className="text-center w-full">{selectedStatus || "상태없음"}</Text>;
	}

	// 관리자 UI: 상태 선택 버튼 제공
	return (
		<Flex direction="column" gap="2" className="items-center justify-center w-full">
			{/* 일반 상태 옵션 (예정, 진행중, 완료) */}
			<Flex wrap="wrap" className="items-center gap-2 justify-center flex-col">
				{statusOptions.map((status) => (
					<Button
						key={status}
						variant={selectedStatus === status ? "outline" : "ghost"}
						size="1"
						onClick={() => updateStatus(status)}
					>
						{status}
					</Button>
				))}
			</Flex>

			{/* 승소/패소/일부승 (민사소송 전용) - 가로 정렬 */}
			{field === "civil_litigation_status" && (
				<Flex wrap="nowrap" className="items-center gap-2">
					{litigationResults.map((status) => (
						<Button
							key={status}
							variant={selectedStatus === status ? "outline" : "ghost"}
							size="1"
							onClick={() => updateStatus(status)}
						>
							{status}
						</Button>
					))}
				</Flex>
			)}
		</Flex>
	);
}



