"use client";

import React, { useState } from "react";
import { Flex, Text, Button } from "@radix-ui/themes";
import { Pencil1Icon } from "@radix-ui/react-icons";
import DeadlineForm from "./DeadlineForm";

const DeadlineList = ({ deadlines, caseId, onSuccess }) => {

	const [deadlineOpenMap, setDeadlineOpenMap] = useState({}); // 각 데드라인 항목의 열림 상태
	const [editingDeadline, setEditingDeadline] = useState(null); // 현재 수정 중인 항목

	// 모달 열기
	const openDeadlineForm = (deadline) => {
		setEditingDeadline(deadline);
		setDeadlineOpenMap((prev) => ({ ...prev, [deadline.id]: true }));
	};

	// 모달 닫기
	const closeDeadlineForm = (deadlineId) => {
		setEditingDeadline(null);
		setDeadlineOpenMap((prev) => ({ ...prev, [deadlineId]: false }));
	};


	return (
		<Flex className="py-1 gap-1" direction="column">
			{deadlines.map((deadline) => (
				<Flex
					className="p-2 border rounded-md justify-between items-center bg-gray-3 border-gray-6"
					key={deadline.id}
				>
					<Flex className="items-center gap-2">
						<Text size="3" weight="bold">
							{deadline.type}
						</Text>
						<Text size="2">{deadline.location}</Text>
						<Button
							size="1"
							variant="soft"
							type="button"
							style={{ display: "flex", alignItems: "center", gap: "4px" }}
							onClick={() => openDeadlineForm(deadline)}
						>
							<Pencil1Icon /> 수정
						</Button>
					</Flex>
					<Flex align="center" gap="2">
						<Text size="2">
							{new Date(deadline.deadline_date).toLocaleDateString("ko-KR", {
								year: "numeric",
								month: "2-digit",
								day: "2-digit",
								hour: "2-digit",
								minute: "2-digit",
							})}
						</Text>
					</Flex>
					{deadlineOpenMap[deadline.id] && (
						<DeadlineForm
							caseId={caseId}
							open={deadlineOpenMap[deadline.id]}
							onOpenChange={(opened) => {
								if (!opened) closeDeadlineForm(deadline.id);
							}}
							test={deadline.id}
							editingDeadline={editingDeadline}
							onSuccess={() => {
								closeDeadlineForm(deadline.id);
								onSuccess();
							}}
						/>
					)}
				</Flex>
			))}
		</Flex>
	);
};

export default DeadlineList;

