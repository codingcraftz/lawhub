// src/app/client/assignment/[id]/EnforcementTimelines.jsx

"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Flex, Button, Text } from "@radix-ui/themes";
import EnforcementTimelineForm from "../_components/dialogs/EnforcementTimelineForm";

export default function EnforcementTimelines({ enforcementId, isAdmin, handleSuccess }) {
	const [timelines, setTimelines] = useState([]);
	const [selectedTl, setSelectedTl] = useState(null);
	const [formOpen, setFormOpen] = useState(false);

	// 1) 목록
	const fetchTimelines = async () => {
		try {
			const { data, error } = await supabase
				.from("enforcement_timelines")
				.select("*")
				.eq("enforcement_id", enforcementId)
				.order("created_at", { ascending: false });

			if (error) throw error;
			setTimelines(data || []);
		} catch (err) {
			console.error("Failed to fetch enforcement timelines:", err);
		}
	};

	useEffect(() => {
		if (enforcementId) {
			fetchTimelines();
		}
	}, [enforcementId]);

	// 2) 추가/수정
	const openCreateForm = () => {
		setSelectedTl(null);
		setFormOpen(true);
	};
	const openEditForm = (tl) => {
		setSelectedTl(tl);
		setFormOpen(true);
	};
	const handleFormSuccess = () => {
		setFormOpen(false);
		fetchTimelines();
		handleSuccess();
	};

	// 3) 삭제
	const handleDelete = async (id) => {
		if (!window.confirm("이 진행기록을 삭제하시겠습니까?")) return;
		try {
			const { error } = await supabase
				.from("enforcement_timelines")
				.delete()
				.eq("id", id);

			if (error) throw error;
			fetchTimelines();
			handleSuccess();
		} catch (err) {
			console.error("Error deleting enforcement timeline:", err);
		}
	};

	return (
		<Box className="mb-4">
			<Flex justify="between" align="center" className="mb-2">
				<Text as="h3" className="font-semibold text-base">
					진행 상황
				</Text>
				{isAdmin && (
					<Button size="1" variant="soft" onClick={openCreateForm}>
						진행 추가
					</Button>
				)}
			</Flex>

			{timelines.length === 0 ? (
				<Text color="gray" size="2">
					등록된 진행 상황이 없습니다.
				</Text>
			) : (
				<ul className="flex flex-col gap-2">
					{timelines.map((tl) => (
						<li
							key={tl.id}
							className="p-2 bg-gray-3 border border-gray-6 rounded flex justify-between items-center"
						>
							<div className="flex justify-between items-center w-full">
								<Text size="2" color="gray">
									{tl.text}
								</Text>
								<div className="flex items-center gap-1">
									<Text size="1" color="gray">
										{new Date(tl.created_at).toLocaleString("ko-KR", { year: "2-digit", month: "2-digit", day: "2-digit", hour: "2-digit", month: "2-digit", minute: "2-digit" })}
									</Text>

									{isAdmin && (
										<Flex gap="2">
											<Button
												size="1"
												variant="soft"
												onClick={() => openEditForm(tl)}
											>
												수정
											</Button>
											<Button
												size="1"
												variant="soft"
												color="red"
												onClick={() => handleDelete(tl.id)}
											>
												삭제
											</Button>
										</Flex>
									)}
								</div>

							</div>
						</li>
					))}
				</ul>
			)}

			{formOpen && (
				<EnforcementTimelineForm
					open={formOpen}
					onOpenChange={setFormOpen}
					enforcementId={enforcementId}
					timelineData={selectedTl}
					onSuccess={handleFormSuccess}
				/>
			)}
		</Box>
	);
}

