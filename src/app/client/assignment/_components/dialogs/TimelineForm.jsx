"use client";

import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { supabase } from "@/utils/supabase";
import { Box, Flex, Button, Text } from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";

export default function TimelineForm({
	open,
	onOpenChange,
	assignmentId,
	timelineData,
	onSuccess,
}) {
	const [descriptionValue, setDescriptionValue] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (timelineData) {
			setDescriptionValue(timelineData.description || "");
		} else {
			setDescriptionValue("");
		}
	}, [timelineData]);

	const handleSave = async (e) => {
		e.preventDefault();
		if (!descriptionValue.trim()) {
			alert("진행 상황을 입력해주세요.");
			return;
		}

		if (!assignmentId) {
			alert("assignmentId가 누락되었습니다. 다시 시도해주세요.");
			return;
		}

		if (isSubmitting) return;
		setIsSubmitting(true);

		try {
			if (timelineData) {
				const { error } = await supabase
					.from("assignment_timelines")
					.update({ description: descriptionValue })
					.eq("id", timelineData.id);
				if (error) throw error;
			} else {
				const { error } = await supabase
					.from("assignment_timelines")
					.insert({ assignment_id: assignmentId, description: descriptionValue });
				if (error) throw error;
			}

			alert("저장되었습니다.");
			onOpenChange(false)
			if (onSuccess) onSuccess();
		} catch (err) {
			console.error("Error saving timeline:", err);
			alert("저장 중 오류가 발생했습니다.");
		} finally { setIsSubmitting(false); }
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
						타임라인 {timelineData ? "수정" : "추가"}
					</Dialog.Title>
					<Dialog.Close asChild>
						<Button variant="ghost" color="gray">
							<Cross2Icon width={20} height={20} />
						</Button>
					</Dialog.Close>
				</Flex>

				<form onSubmit={handleSave}>
					<Box className="flex flex-col gap-2">
						<Text size="2" color="gray">
							진행 상황
						</Text>
						<textarea
							value={descriptionValue}
							onChange={(e) => setDescriptionValue(e.target.value)}
							rows={4}
							className="
                w-full p-2
                border border-gray-6
                rounded text-gray-12
                focus:outline-none focus:border-gray-8
              "
							placeholder="사건진행상황 입력 예) 지급명령중, 재판중"
						/>
					</Box>

					<Flex justify="end" gap="2">
						<Button variant="soft" color="gray" onClick={() => onOpenChange(false)}>
							닫기
						</Button>
						<Button variant="solid" type="submit" disabled={isSubmitting}>
							{isSubmitting ? "저장 중..." : "저장"}
						</Button>
					</Flex>
				</form>
			</Dialog.Content>
		</Dialog.Root>
	);
}

