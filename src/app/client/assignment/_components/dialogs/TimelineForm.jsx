// TimelineForm.jsx

"use client";

import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { supabase } from "@/utils/supabase";
import { Box, Flex, Button, Text } from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";

export default function TimelineForm({
	open,
	onOpenChange,
	caseId,
	timelineData,
	onSuccess,
}) {
	const [textValue, setTextValue] = useState("");

	useEffect(() => {
		if (timelineData) {
			setTextValue(timelineData.text || "");
		} else {
			setTextValue("");
		}
	}, [timelineData]);

	const handleSave = async (e) => {
		e.preventDefault();
		if (!textValue.trim()) {
			alert("진행 상황을 입력해주세요.");
			return;
		}

		try {
			if (timelineData) {
				// 수정
				const { error } = await supabase
					.from("case_timelines")
					.update({ text: textValue })
					.eq("id", timelineData.id);
				if (error) throw error;
			} else {
				// 추가
				const { error } = await supabase
					.from("case_timelines")
					.insert({ case_id: caseId, text: textValue });
				if (error) throw error;
			}
			alert("저장되었습니다.");
			if (onSuccess) onSuccess();
		} catch (err) {
			console.error("Error saving timeline:", err);
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
						타임라인 {timelineData ? "수정" : "추가"}
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
							진행 상황
						</Text>
						<textarea
							value={textValue}
							onChange={(e) => setTextValue(e.target.value)}
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
						<Button variant="solid" type="submit">
							저장
						</Button>
					</Flex>
				</form>
			</Dialog.Content>
		</Dialog.Root>
	);
}

