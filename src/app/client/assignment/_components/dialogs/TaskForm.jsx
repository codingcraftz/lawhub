"use client";

import React, { useEffect } from "react";
import { supabase } from "@/utils/supabase";
import * as Dialog from "@radix-ui/react-dialog";
import { Box, Flex, Text, Button, TextArea } from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";
import { useForm } from "react-hook-form";

export default function TaskForm({
	open,
	onOpenChange,
	assignmentId,
	taskData,
	onSuccess,
	user,
}) {
	const {
		register,
		handleSubmit,
		setValue,
	} = useForm({
		defaultValues: {
			title: "",
			content: "",
			status: "ongoing", // 기본
		},
	});

	useEffect(() => {
		if (taskData) {
			setValue("title", taskData.title || "");
			setValue("content", taskData.content || "");
			setValue("status", taskData.status || "ongoing");
		}
	}, [taskData]);

	const onSubmit = async (formValues) => {
		try {
			const payload = {
				assignment_id: assignmentId,
				title: formValues.title || "",
				content: formValues.content || "",
				status: formValues.status || "ongoing",
				created_by: taskData?.id ? taskData.created_by : user.id, // 새 업무면 user.id, 기존이면 유지
			};

			if (taskData?.id) {
				// update
				const { error } = await supabase
					.from("assignment_tasks")
					.update(payload)
					.eq("id", taskData.id);
				if (error) throw error;
			} else {
				// insert
				const { error } = await supabase.from("assignment_tasks").insert(payload);
				if (error) throw error;
			}
			alert("저장되었습니다.");
			if (onSuccess) onSuccess();
		} catch (err) {
			console.error("Error saving task:", err);
			alert("업무 저장 중 오류가 발생했습니다.");
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
						<Box>
							<Text size="2" color="gray" className="mb-1">
								제목
							</Text>
							<input
								{...register("title", { required: true })}
								placeholder="업무 제목"
								className="w-full p-2 border border-gray-6 rounded"
							/>
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

						<Box>
							<Text size="2" color="gray" className="mb-1">
								상태
							</Text>
							<select
								{...register("status")}
								className="w-full p-1 border border-gray-6 rounded"
							>
								<option value="ongoing">진행중</option>
								<option value="closed">종결</option>
							</select>
						</Box>

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

