"use client";

import React, { useState } from "react";
import { Box, Flex, Button, Text } from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";
import CreditorForm from "./CreditorForm";

export default function Step2_CreditorRegistration({
	selectedCreditors,
	setSelectedCreditors,
	removeCreditor,
}) {
	// "추가하기" 버튼 → 폼 열기
	const [isAdding, setIsAdding] = useState(false);

	// CreditorForm 제출 처리
	const handleAddCreditor = (newCreditor) => {
		// newCreditor = { name, birth_date, phone_number, address }
		// 배열에 추가
		setSelectedCreditors((prev) => [...prev, newCreditor]);
		// 폼 닫기
		setIsAdding(false);
	};

	return (
		<Box>
			{/* 채권자 목록이 있다면, 표시 */}
			{selectedCreditors.length > 0 && (
				<Box mb="4">
					<Text size="3" weight="bold" mb="2">
						등록된 채권자 목록:
					</Text>
					<Flex direction="column" gap="2">
						{selectedCreditors.map((c, index) => (
							<Flex
								key={index}
								align="center"
								style={{
									backgroundColor: "var(--gray-2)",
									borderRadius: 4,
									padding: "4px 8px",
								}}
							>
								<Text mr="1">
									{c.name} / {c.birth_date || "생년월일 없음"} /{" "}
									{c.phone_number || "전화번호 없음"} / {c.address || "주소 없음"}
								</Text>
								<Button
									variant="ghost"
									color="gray"
									size="2"
									onClick={() => removeCreditor(index)}
								>
									<Cross2Icon width={20} height={20} />
								</Button>
							</Flex>
						))}
					</Flex>
				</Box>
			)}

			{/* 채권자 신규 추가 폼 (inline) */}
			{isAdding ? (
				<CreditorForm onOpenChange={setIsAdding} onSubmit={handleAddCreditor} />
			) : (
				<Flex justify="start">
					<Button onClick={() => setIsAdding(true)}>채권자 추가하기</Button>
				</Flex>
			)}
		</Box>
	);
}

