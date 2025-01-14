// DeadlineForm.jsx

"use client";

import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { supabase } from "@/utils/supabase";
import { Box, Flex, Button, Text } from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";

export default function DeadlineForm({
	open,
	onOpenChange,
	caseId,
	deadlineData, // null이면 추가, 있으면 수정
	onSuccess,
}) {
	const [formData, setFormData] = useState({
		type: "",
		deadline_date: "",
		location: "",
	});

	useEffect(() => {
		if (deadlineData) {
			setFormData({
				type: deadlineData.type || "",
				deadline_date: deadlineData.deadline_date
					? deadlineData.deadline_date.slice(0, 16) // 'YYYY-MM-DDTHH:mm' 형태
					: "",
				location: deadlineData.location || "",
			});
		} else {
			// 새로 추가
			setFormData({
				type: "",
				deadline_date: "",
				location: "",
			});
		}
	}, [deadlineData]);

	const handleChange = (e) => {
		setFormData((prev) => ({
			...prev,
			[e.target.name]: e.target.value,
		}));
	};

	const handleSave = async (e) => {
		e.preventDefault();
		if (!formData.type || !formData.deadline_date) {
			alert("타입, 기일 날짜는 필수입니다.");
			return;
		}
		try {
			if (deadlineData) {
				// 수정
				const { error } = await supabase
					.from("case_deadlines")
					.update({
						type: formData.type,
						deadline_date: formData.deadline_date,
						location: formData.location,
					})
					.eq("id", deadlineData.id);
				if (error) throw error;
			} else {
				// 추가
				const { error } = await supabase
					.from("case_deadlines")
					.insert({
						case_id: caseId,
						type: formData.type,
						deadline_date: formData.deadline_date,
						location: formData.location,
					});
				if (error) throw error;
			}
			alert("저장되었습니다.");
			if (onSuccess) onSuccess();
		} catch (err) {
			console.error("Error saving deadline:", err);
			alert("저장 중 오류가 발생했습니다.");
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
        "
			>
				<Flex justify="between" align="center" className="mb-3">
					<Dialog.Title className="font-bold text-xl">
						기일 {deadlineData ? "수정" : "추가"}
					</Dialog.Title>
					<Dialog.Close asChild>
						<Button variant="ghost" color="gray">
							<Cross2Icon width={20} height={20} />
						</Button>
					</Dialog.Close>
				</Flex>

				<form onSubmit={handleSave}>
					<Box mb="3">
						<Text size="2" color="gray" className="mb-1">
							타입
						</Text>
						<input
							name="type"
							value={formData.type}
							onChange={handleChange}
							className="
                w-full p-2
                border border-gray-6
                rounded text-gray-12
                focus:outline-none focus:border-gray-8
              "
							placeholder="예: 변론기일, 선고기일 등"
						/>
					</Box>
					<Box mb="3">
						<Text size="2" color="gray" className="mb-1">
							기일
						</Text>
						<input
							type="datetime-local"
							name="deadline_date"
							value={formData.deadline_date}
							onChange={handleChange}
							className="
                w-full p-2
                border border-gray-6
                rounded text-gray-12
                focus:outline-none focus:border-gray-8
              "
						/>
					</Box>
					<Box mb="3">
						<Text size="2" color="gray" className="mb-1">
							장소 (선택)
						</Text>
						<input
							name="location"
							value={formData.location}
							onChange={handleChange}
							className="
                w-full p-2
                border border-gray-6
                rounded text-gray-12
                focus:outline-none focus:border-gray-8
              "
							placeholder="ex) 3호 법정"
						/>
					</Box>

					<Flex justify="end" gap="2">
						<Button variant="soft" color="gray" onClick={() => onOpenChange(false)}>
							닫기
						</Button>
						<Button variant="solid" type="submit">
							저장
						</Button>
					</Flex>
				</form>
			</Dialog.Content>
		</Dialog.Root>
	);
}

