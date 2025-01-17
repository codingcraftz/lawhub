"use client";

import React, { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { supabase } from "@/utils/supabase";
import { Box, Flex, Button, Text } from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";

/**
 * 회수활동 타임라인(진행 상황) 등록/수정
 */
export default function EnforcementTimelineForm({
	open,
	onOpenChange,
	enforcementId,
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
			alert("내용을 입력해주세요.");
			return;
		}

		try {
			if (timelineData?.id) {
				// 수정
				const { error } = await supabase
					.from("enforcement_timelines")
					.update({ text: textValue })
					.eq("id", timelineData.id);

				if (error) throw error;
			} else {
				// 등록
				const { error } = await supabase
					.from("enforcement_timelines")
					.insert({ enforcement_id: enforcementId, text: textValue });

				if (error) throw error;
			}
			alert("저장되었습니다.");
			onOpenChange(false);
			if (onSuccess) onSuccess();
		} catch (err) {
			console.error("Error saving enforcement timeline:", err);
			alert("타임라인 저장 중 오류가 발생했습니다.");
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
						진행상황 {timelineData ? "수정" : "추가"}
					</Dialog.Title>
					<Dialog.Close asChild>
						<Button variant="ghost" color="gray">
							<Cross2Icon width={20} height={20} />
						</Button>
					</Dialog.Close>
				</Flex>

				<form onSubmit={handleSave}>
					<Box className="mb-4">
						<Text size="2" color="gray" className="mb-1">
							내용
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
							placeholder="예: 압류 절차 진행, 부동산 감정 신청 완료 등"
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

