"use client";

import React, { useState } from "react";
import { Box, Button, Flex, Text } from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";
import * as Dialog from "@radix-ui/react-dialog";

const EditDebtorDialog = ({ open, onOpenChange, debtors, onSave }) => {
	const [selectedDebtors, setSelectedDebtors] = useState(debtors);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSaveChanges = async () => {
		if (isSubmitting) return;
		setIsSubmitting(true);
		try {
			onSave(selectedDebtors);
			onOpenChange(false);
		} catch (err) {
			console.error("Error saving debtor changes:", err);
			alert("채무자 저장 중 오류가 발생했습니다.");
		} finally { setIsSubmitting(false); }
	};

	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Overlay className="fixed inset-0 bg-black opacity-50 z-40" />
			<Dialog.Content
				className="
          fixed 
          left-1/2 top-1/2 
          max-h-[85vh] w-full max-w-[600px] 
          -translate-x-1/2 -translate-y-1/2 
          rounded-md p-6 
          bg-gray-2 border border-gray-6 
          shadow-md shadow-gray-7
          focus:outline-none 
          z-50 
          overflow-y-auto
        "
			>
				<Flex justify="between" align="center" className="mb-4">
					<Dialog.Title className="font-bold text-xl text-gray-12">
						채무자 정보 수정
					</Dialog.Title>
					<Dialog.Close asChild>
						<Button variant="ghost" color="gray">
							<Cross2Icon width={20} height={20} />
						</Button>
					</Dialog.Close>
				</Flex>

				{/* 예: 채무자들 편집할 내용 들어갈 부분 */}
				<Box className="mt-2 text-gray-12">
					<Text size="2" color="gray">
						(채무자 목록 및 편집 로직을 구현하세요)
					</Text>
				</Box>

				<Flex justify="end" mt="4" gap="2">
					<Button variant="soft" color="gray" onClick={() => onOpenChange(false)}>
						닫기
					</Button>
					<Button variant="solid" color="blue" onClick={handleSaveChanges} disabled={isSubmitting}>
						{isSubmitting ? "저장 중..." : "저장"}
					</Button>
				</Flex>
			</Dialog.Content>
		</Dialog.Root>
	);
};

export default EditDebtorDialog;

