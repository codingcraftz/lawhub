// EnforcementForm.jsx
"use client";

import React, { useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Button, Flex, Text } from "@radix-ui/themes";
import * as Dialog from "@radix-ui/react-dialog";
import { useForm } from "react-hook-form";

const EnforcementForm = ({
	open,
	onOpenChange,
	assignmentId,
	enforcementData, // 수정 모드 시 기존 데이터
	onSuccess,
}) => {
	const { register, handleSubmit, setValue, formState: { errors } } = useForm({
		defaultValues: {
			type: "",
			status: "ongoing",
			amount: 0,
		},
	});

	useEffect(() => {
		if (enforcementData) {
			setValue("type", enforcementData.type || "");
			setValue("status", enforcementData.status || "ongoing");
			setValue("amount", enforcementData.amount || 0);
		}
	}, [enforcementData, setValue]);

	const onSubmit = async (formData) => {
		try {
			const payload = {
				assignment_id: assignmentId,
				type: formData.type || "",
				status: formData.status || "ongoing",
				amount: formData.amount ? parseInt(formData.amount, 10) : 0,
			};

			if (enforcementData?.id) {
				// 수정
				const { error } = await supabase
					.from("enforcements")
					.update(payload)
					.eq("id", enforcementData.id);
				if (error) throw error;
			} else {
				// 등록
				const { error } = await supabase
					.from("enforcements")
					.insert(payload);
				if (error) throw error;
			}

			if (onSuccess) onSuccess();
		} catch (error) {
			console.error("Enforcement save error:", error);
			alert("강제집행 저장 중 오류가 발생했습니다.");
		}
	};

	const handleDelete = async () => {

		if (!enforcementData?.id) {
			alert("삭제할 항목이 없습니다.");
			return;
		}

		const confirmation = confirm("정말로 이 항목을 삭제하시겠습니까?");
		if (!confirmation) return;

		try {
			const { error } = await supabase
				.from("enforcements")
				.delete()
				.eq("id", enforcementData.id);

			if (error) {
				throw new Error("데드라인 항목 삭제 중 오류가 발생했습니다.");
			}

			alert("항목이 성공적으로 삭제되었습니다.");
			if (onSuccess) onSuccess(); // 부모 컴포넌트에서 상태를 갱신
			onOpenChange(false); // 다이얼로그 닫기
		} catch (error) {
			console.error("Error deleting timeline item:", error);
			alert("항목 삭제 중 오류가 발생했습니다.");
		}
	};


	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Overlay className="fixed inset-0 bg-black opacity-75 z-40" />
			<Dialog.Content className="fixed bg-gray-3 left-1/2 top-1/2 
        max-h-[85vh] min-w-[400px] max-w-[600px] 
        -translate-x-1/2 -translate-y-1/2 rounded-md 
        p-[25px] shadow focus:outline-none z-50 overflow-y-auto"
			>
				<Dialog.Title className="font-bold text-xl">
					{enforcementData ? "강제집행 수정" : "강제집행 등록"}
				</Dialog.Title>
				<Dialog.Close>
					<Button
						variant="ghost"
						color="gray"
						style={{ position: "absolute", top: 24, right: 24 }}
					>
						닫기
					</Button>
				</Dialog.Close>

				<form onSubmit={handleSubmit(onSubmit)}>
					<Flex direction="column" gap="4">
						<div>
							<Text>종류</Text>
							<input
								type="text"
								{...register("type")}
								className="w-full border rounded p-1 border-gray-6"
							/>
						</div>
						<div>
							<Text>상태</Text>
							<select {...register("status")} className="w-full border rounded p-1 border-gray-6">
								<option value="ongoing">진행중</option>
								<option value="scheduled">대기</option>
								<option value="closed">종결</option>
							</select>
						</div>
						<div>
							<Text>금액</Text>
							<input
								type="number"
								{...register("amount")}
								className="w-full border rounded p-1 border-gray-6"
							/>
						</div>

						<Flex justify="end" gap="2" mt="4">
							{enforcementData &&
								<Button type="button" color="red" variant="soft" onClick={handleDelete}>삭제</Button>
							}

							<Button variant="soft" color="gray" onClick={() => onOpenChange(false)}>
								취소
							</Button>
							<Button variant="solid" type="submit">
								저장
							</Button>
						</Flex>
					</Flex>
				</form>
			</Dialog.Content>
		</Dialog.Root>
	);
};

export default EnforcementForm;

