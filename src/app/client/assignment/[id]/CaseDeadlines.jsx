// CaseDeadlines.jsx

"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Flex, Button, Text } from "@radix-ui/themes";
import DeadlineForm from "../_components/dialogs/DeadlineForm";


export default function CaseDeadlines({ caseId, isAdmin, handleSuccess }) {
	const [deadlines, setDeadlines] = useState([]);
	const [selectedDeadline, setSelectedDeadline] = useState(null); // 수정 시
	const [deadlineFormOpen, setDeadlineFormOpen] = useState(false);

	// 1) 목록
	const fetchDeadlines = async () => {
		const { data, error } = await supabase
			.from("case_deadlines")
			.select("*")
			.eq("case_id", caseId)
			.order("deadline_date", { ascending: true });

		if (!error && data) {
			setDeadlines(data);
		}
	};

	useEffect(() => {
		if (caseId) {
			fetchDeadlines();
		}
	}, [caseId]);

	// 2) 추가/수정 폼 열기
	const openCreateForm = () => {
		setSelectedDeadline(null);
		setDeadlineFormOpen(true);
	};
	const openEditForm = (dl) => {
		setSelectedDeadline(dl);
		setDeadlineFormOpen(true);
	};

	// 3) 삭제
	const handleDelete = async (id) => {
		if (!window.confirm("기일을 삭제하시겠습니까?")) return;
		const { error } = await supabase
			.from("case_deadlines")
			.delete()
			.eq("id", id);
		if (!error) {
			fetchDeadlines();
		}
		handleSuccess();
	};

	// 4) 저장 후
	const handleFormSuccess = () => {
		setDeadlineFormOpen(false);
		fetchDeadlines();
		handleSuccess();
	};

	return (
		<Box className="mb-6">
			<Flex justify="between" align="center" className="mb-2">
				<Text as="h3" className="font-semibold text-base">
					기일 목록
				</Text>
				{isAdmin && (
					<Button size="1" variant="soft" onClick={openCreateForm}>
						기일 추가
					</Button>
				)}
			</Flex>

			{deadlines.length === 0 ? (
				<Text color="gray" size="2">
					등록된 기일이 없습니다.
				</Text>
			) : (
				<ul className="flex flex-col gap-2">
					{deadlines.map((dl) => (
						<li
							key={dl.id}
							className="p-2 bg-gray-3 border border-gray-6 rounded flex justify-between items-center"
						>
							<div className="flex flex-col">
								<Text color="gray" size="2">
									{dl.type}
								</Text>
								{dl.location && (
									<Text size="1" color="gray">
										장소: {dl.location}
									</Text>
								)}
							</div>
							<div className="flex gap-1 items-center" >
								<Text size="1" color="gray">
									{dl.deadline_date
										? new Date(new Date(dl.deadline_date).getTime() - 9 * 60 * 60 * 1000).toLocaleString("ko-KR", {
											year: "2-digit",
											month: "2-digit",
											day: "2-digit",
											hour: "2-digit",
											minute: "2-digit",
										})
										: null}
								</Text>
								{isAdmin && (
									<Flex gap="2">
										<Button
											size="1"
											variant="soft"
											onClick={() => openEditForm(dl)}
										>
											수정
										</Button>
										<Button
											size="1"
											variant="soft"
											color="red"
											onClick={() => handleDelete(dl.id)}
										>
											삭제
										</Button>
									</Flex>
								)}
							</div>
						</li>
					))}
				</ul>
			)
			}

			{/* (Dialog) 기일 추가/수정 폼 */}
			{
				deadlineFormOpen && (
					<DeadlineForm
						open={deadlineFormOpen}
						onOpenChange={setDeadlineFormOpen}
						caseId={caseId}
						deadlineData={selectedDeadline}
						onSuccess={handleFormSuccess}
					/>
				)
			}
		</Box >
	);
}

