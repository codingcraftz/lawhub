"use client";

import React, { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { supabase } from "@/utils/supabase";
import { useForm } from "react-hook-form";

import { Box, Flex, Text, Button, TextArea } from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";

export default function TaskForm({
	open,
	onOpenChange,
	assignmentId,
	taskData,
	onSuccess,
	user,
	assignmentAssignees = [],
}) {
	const [allStaff, setAllStaff] = useState([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
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
			type: "task", // 일반 업무 or 요청
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

	useEffect(() => {
		if (user?.role === "admin") {
			fetchAllStaff();
		}
	}, [user]);

	const fetchAllStaff = async () => {
		try {
			const { data, error } = await supabase
				.from("users")
				.select("id, name, position, employee_type, role")
				.or("role.eq.staff,role.eq.admin");

			if (error) throw error;
			setAllStaff(data || []);
		} catch (err) {
			console.error("직원 목록 가져오기 오류:", err);
		} finally { setIsSubmitting(false); }
	};

	const onSubmit = async (formValues) => {
		if (isSubmitting) return;
		setIsSubmitting(true);
		try {
			const payload = {
				assignment_id: assignmentId,
				title: formValues.title.trim(),
				content: formValues.content.trim(),
				status: formValues.status,
				type: formValues.type,
				requester_id: formValues.type === "request" ? taskData?.requester_id || user.id : null,
				receiver_id: formValues.type === "request" ? formValues.receiver_id : null,
				created_by: taskData?.id ? taskData.created_by : user.id,
			};

			if (taskData?.id) {
				const { error } = await supabase
					.from("assignment_tasks")
					.update(payload)
					.eq("id", taskData.id);
				if (error) throw error;
			} else {
				const { error } = await supabase.from("assignment_tasks").insert(payload);
				if (error) throw error;
			}

			alert("저장되었습니다.");
			onSuccess();
		} catch (err) {
			console.error("업무/요청 저장 오류:", err);
			alert("업무/요청 저장 중 오류가 발생했습니다.");
		}
	};

	const assigneesToShow = (user?.role === "admin"
		? allStaff.map((staff) => ({
			id: staff.id,
			name: staff.name,
			position: staff.position,
		}))
		: assignmentAssignees.map((assignee) => ({
			id: assignee.user_id,
			name: assignee.users?.name,
			position: assignee.users?.position,
		}))) || [];


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
						<Box>
							<Text size="2" color="gray" className="mb-1">
								상태
							</Text>
							<select {...register("status")} className="w-full p-2 border border-gray-6 rounded">
								<option value="ongoing">진행</option>
								<option value="closed">완료</option>
							</select>
						</Box>

						<Box>
							<Text size="2" color="gray" className="mb-1">
								유형
							</Text>
							<select {...register("type")} className="w-full p-2 border border-gray-6 rounded">
								<option value="task">일반</option>
								<option value="request">요청</option>
							</select>
						</Box>

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

						{currentType === "request" && (
							<Box>
								<Text size="2" color="gray" className="mb-1">
									수신자
								</Text>
								{assigneesToShow.length === 0 ? (
									<Text as="p">담당자가 없습니다.</Text>
								) : (
									<RadioGroup.Root
										value={watch("receiver_id") || ""}
										onValueChange={(val) => setValue("receiver_id", val)}
									>
										{assigneesToShow.map((assignee) => (
											<Flex
												key={assignee.id}
												align="center"
												gap="2"
												className="mb-2 bg-gray-3 p-2 rounded"
											>
												<RadioGroup.Item
													value={assignee.id}
													id={`radio-${assignee.id}`}
													className="w-4 h-4 rounded-full border border-gray-6 flex items-center justify-center"
												>
													<RadioGroup.Indicator className="w-2 h-2 bg-blue-9 rounded-full" />
												</RadioGroup.Item>
												<label htmlFor={`radio-${assignee.id}`}>
													{assignee?.name} ({assignee?.position || "직위 없음"})
												</label>
											</Flex>
										))}
									</RadioGroup.Root>
								)}
							</Box>
						)}

						<Flex justify="end" gap="2">
							<Button
								variant="soft"
								color="gray"
								type="button"
								onClick={() => onOpenChange(false)}
							>
								닫기
							</Button>
							<Button variant="solid" type="submit" disabled={isSubmitting}>
								{isSubmitting ? "저장 중..." : "저장"}
							</Button>
						</Flex>
					</Flex>
				</form>
			</Dialog.Content>
		</Dialog.Root>
	);
}

