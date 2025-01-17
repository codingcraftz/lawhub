// TaskForm.jsx
"use client";

import React, { useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as RadioGroup from "@radix-ui/react-radio-group";  // <-- 핵심
import { useForm } from "react-hook-form";
import { supabase } from "@/utils/supabase";

import {
	Box,
	Flex,
	Text,
	Button,
	TextArea,
} from "@radix-ui/themes"; // <-- 여기엔 Radio가 없음
import { Cross2Icon } from "@radix-ui/react-icons";

export default function TaskForm({
	open,
	onOpenChange,
	assignmentId,
	taskData,
	onSuccess,
	user,
	assignees = [],
}) {
	const {
		register,
		handleSubmit,
		setValue,
		watch,
		formState: { errors },
	} = useForm({
		defaultValues: {
			title: "",
			content: "",
			status: "ongoing",
			type: "task", // 'task' or 'request'
			receiver_id: null,
		},
	});

	const currentType = watch("type");

	useEffect(() => {
		if (taskData) {
			setValue("title", taskData.title || "");
			setValue("content", taskData.content || "");
			setValue("status", taskData.status || "ongoing");
			setValue("type", taskData.type || "task");
			setValue("receiver_id", taskData.receiver_id || null);
		}
	}, [taskData, setValue]);

	const onSubmit = async (formValues) => {
		try {
			// Payload 구성
			const payload = {
				assignment_id: assignmentId,
				title: (formValues.title || "").trim(),
				content: (formValues.content || "").trim(),
				status: formValues.status,
				type: formValues.type,
				requester_id:
					formValues.type === "request"
						? taskData?.requester_id || user.id
						: null,
				receiver_id:
					formValues.type === "request"
						? formValues.receiver_id
						: null,
				created_by: taskData?.id ? taskData.created_by : user.id,
			};

			// Insert/Update
			if (taskData?.id) {
				const { error } = await supabase
					.from("assignment_tasks")
					.update(payload)
					.eq("id", taskData.id);
				if (error) throw error;
			} else {
				const { error } = await supabase
					.from("assignment_tasks")
					.insert(payload);
				if (error) throw error;
			}

			alert("저장되었습니다.");
			onSuccess();
		} catch (err) {
			console.error("업무/요청 저장 오류:", err);
			alert("업무/요청 저장 중 오류가 발생했습니다.");
		}
	};

	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Overlay className="fixed inset-0 bg-black opacity-50 z-40" />
			<Dialog.Content
				className="
          fixed 
          left-1/2 top-1/2
          w-full max-w-[500px]
          -translate-x-1/2 -translate-y-1/2
          bg-gray-2 border border-gray-6
          rounded-md p-4
          shadow-md shadow-gray-7
          text-gray-12
          z-50
          focus:outline-none
          overflow-y-auto
        "
			>
				<Flex justify="between" align="center" className="mb-3">
					<Dialog.Title className="font-bold text-xl">
						{taskData ? "업무 수정" : "업무 등록"}
					</Dialog.Title>
					<Dialog.Close asChild>
						<Button variant="ghost" color="gray">
							<Cross2Icon width={20} height={20} />
						</Button>
					</Dialog.Close>
				</Flex>

				<form onSubmit={handleSubmit(onSubmit)}>
					<Flex direction="column" gap="3">
						{/* 제목 */}
						<Box>
							<Text size="2" color="gray" className="mb-1">
								제목
							</Text>
							<input
								{...register("title", { required: true })}
								placeholder="업무 제목"
								className="w-full p-2 border border-gray-6 rounded"
							/>
							{errors.title && (
								<Text color="red" size="2">
									제목을 입력해주세요.
								</Text>
							)}
						</Box>

						{/* 내용 */}
						<Box>
							<Text size="2" color="gray" className="mb-1">
								내용
							</Text>
							<TextArea
								{...register("content")}
								placeholder="업무 상세 내용"
								className="w-full border border-gray-6 rounded p-2"
							/>
						</Box>

						{/* 유형 */}
						<Box>
							<Text size="2" color="gray" className="mb-1">
								유형
							</Text>
							<select
								{...register("type")}
								className="w-full p-1 border border-gray-6 rounded"
							>
								<option value="task">일반 업무</option>
								<option value="request">요청</option>
							</select>
						</Box>

						{/* 요청일 때 수신자 RadioGroup */}
						{currentType === "request" && (
							<Box>
								<Text size="2" color="gray" className="mb-1">
									수신자 (담당자 중 선택)
								</Text>
								{assignees.length === 0 ? (
									<Text>담당자가 없습니다.</Text>
								) : (
									<RadioGroup.Root
										value={watch("receiver_id") || ""}
										onValueChange={(val) => setValue("receiver_id", val)}
									>
										{assignees.map((item) => (
											<Flex
												key={item.user_id}
												align="center"
												gap="2"
												style={{
													backgroundColor: "var(--gray-2)",
													borderRadius: 4,
													padding: "8px",
													marginBottom: "4px",
												}}
											>
												<RadioGroup.Item
													value={item.user_id}
													id={`radio-${item.user_id}`}
													style={{
														width: 20,
														height: 20,
														backgroundColor: "white",
														borderRadius: "100%",
														border: "1px solid var(--gray-6)",
														display: "flex",
														alignItems: "center",
														justifyContent: "center",
													}}
												>
													<RadioGroup.Indicator
														style={{
															display: "block",
															width: 10,
															height: 10,
															borderRadius: "100%",
															backgroundColor: "var(--blue-9)",
														}}
													/>
												</RadioGroup.Item>
												<label htmlFor={`radio-${item.user_id}`}>
													{item.users?.name} ({item.users?.position || "직위 없음"})
												</label>
											</Flex>
										))}
									</RadioGroup.Root>
								)}
							</Box>
						)}

						{/* 상태 */}
						<Box>
							<Text size="2" color="gray" className="mb-1">
								상태
							</Text>
							<select
								{...register("status")}
								className="w-full p-1 border border-gray-6 rounded"
							>
								<option value="ongoing">진행중</option>
								<option value="closed">완료</option>
							</select>
						</Box>

						{/* 액션 버튼 */}
						<Flex justify="end" gap="2">
							<Button
								variant="soft"
								color="gray"
								type="button"
								onClick={() => onOpenChange(false)}
							>
								닫기
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
}

