import React, { useState } from "react";
import { Box, Button, Text } from "@radix-ui/themes";
import Step2_DebtorSelection from "@/components/AssignmentForm/Step2_DebtorSelection";
import { Cross2Icon } from "@radix-ui/react-icons";
import * as Dialog from "@radix-ui/react-dialog";

const EditDebtorDialog = ({
	open,
	onOpenChange,
	debtors,
	assignmentId,
	onSave,
}) => {
	const [selectedDebtors, setSelectedDebtors] = useState(debtors);

	const handleSaveChanges = async () => {
		try {
			// 저장 로직: 부모 컴포넌트로 수정된 채무자 데이터를 반환
			onSave(selectedDebtors);
			onOpenChange(false);
		} catch (err) {
			console.error("Error saving debtor changes:", err);
			alert("채무자 저장 중 오류가 발생했습니다.");
		}
	};

	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Overlay className="fixed inset-0 bg-black opacity-50 z-30" />
			<Dialog.Content className="fixed bg-gray-3 left-1/2 top-1/2 max-h-[85vh] w-full max-w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-md p-[25px] shadow focus:outline-none z-40 overflow-y-auto">
				<Dialog.Title className="font-bold text-xl">
					채무자 정보 수정
				</Dialog.Title>
				<Dialog.Close asChild>
					<Button
						variant="ghost"
						color="gray"
						style={{ position: "absolute", top: 24, right: 24 }}
					>
						<Cross2Icon width={25} height={25} />
					</Button>
				</Dialog.Close>

				<Box open={open} onOpenChange={onOpenChange} className="flex flex-col">
					<Box className="mt-2">
						<Step2_DebtorSelection
							selectedDebtors={selectedDebtors}
							setSelectedDebtors={setSelectedDebtors}
							removeDebtor={(id) =>
								setSelectedDebtors((prev) =>
									prev.filter((debtor) => debtor.id !== id),
								)
							}
						/>
					</Box>
					<Box mt="4" className="flex gap-2 ml-auto">
						<Button
							variant="soft"
							color="gray"
							onClick={() => onOpenChange(false)}
						>
							취소
						</Button>
						<Button variant="soft" color="blue" onClick={handleSaveChanges}>
							저장
						</Button>
					</Box>
				</Box>
			</Dialog.Content>
		</Dialog.Root>
	);
};

export default EditDebtorDialog;
