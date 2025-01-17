"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Flex, Button, Text } from "@radix-ui/themes";
import EnforcementDeadlineForm from "../_components/dialogs/EnforcementDeadlineForm";

export default function EnforcementDeadlines({ enforcementId, isAdmin, handleSuccess }) {
	const [deadlines, setDeadlines] = useState([]);
	const [selectedDeadline, setSelectedDeadline] = useState(null);
	const [formOpen, setFormOpen] = useState(false);

	// 1) 기일 목록
	const fetchDeadlines = async () => {
		try {
			const { data, error } = await supabase
				.from("enforcement_deadlines")
				.select("*")
				.eq("enforcement_id", enforcementId)
				.order("deadline_date", { ascending: true });

			if (error) throw error;
			setDeadlines(data || []);
		} catch (err) {
			console.error("Failed to fetch enforcement deadlines:", err);
		}
	};

	useEffect(() => {
		if (enforcementId) fetchDeadlines();
	}, [enforcementId]);

	// 2) 추가/수정
	const openCreateForm = () => {
		setSelectedDeadline(null);
		setFormOpen(true);
	};
	const openEditForm = (dl) => {
		setSelectedDeadline(dl);
		setFormOpen(true);
	};
	const handleFormSuccess = () => {
		setFormOpen(false);
		fetchDeadlines();
		handleSuccess();
	};

	// 3) 삭제
	const handleDelete = async (id) => {
		if (!window.confirm("기일을 삭제하시겠습니까?")) return;
		try {
			const { error } = await supabase
				.from("enforcement_deadlines")
				.delete()
				.eq("id", id);
			if (error) throw error;
			fetchDeadlines();
			handleSuccess();
		} catch (err) {
			console.error("Error deleting enforcement deadline:", err);
		}
	};

	return (
		<Box className="mb-4">
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
							<Box className="flex flex-col gap-1">
								<Text color="gray" size="2">
									{dl.type}
								</Text>
								{dl.location && (
									<Text size="1" color="gray">
										장소: {dl.location}
									</Text>
								)}
							</Box>
							<Flex gap="2" align="center">
								<Text size="1" color="gray">
									{dl.deadline_date
										? new Date(dl.deadline_date).toLocaleString("ko-KR")
										: ""}
								</Text>
								{isAdmin && (
									<>
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
									</>
								)}
							</Flex>
						</li>
					))}
				</ul>
			)}

			{/* 기일 등록/수정 폼 */}
			{formOpen && (
				<EnforcementDeadlineForm
					open={formOpen}
					onOpenChange={setFormOpen}
					enforcementId={enforcementId}
					deadlineData={selectedDeadline}
					onSuccess={handleFormSuccess}
				/>
			)}
		</Box>
	);
}

