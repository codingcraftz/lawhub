"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Button, Flex, Text, Box } from "@radix-ui/themes";
import { motion } from "framer-motion";
import TimelineForm from "../_components/dialogs/TimelineForm";

const AssignmentTimelines = ({ assignmentId, user }) => {
	const [timelines, setTimelines] = useState([]);
	const [isExpanded, setIsExpanded] = useState(false);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [currentTimeline, setCurrentTimeline] = useState(null);
	const isAdmin = user?.role === "staff" || user?.role === "admin";

	// 1. Fetch timelines
	const fetchTimelines = async () => {
		const { data, error } = await supabase
			.from("assignment_timelines")
			.select("*")
			.eq("assignment_id", assignmentId)
			.order("created_at", { ascending: true });

		if (!error && data) {
			setTimelines(data);
		} else {
			console.error("Failed to fetch timelines:", error);
		}
	};

	useEffect(() => {
		fetchTimelines();
	}, [assignmentId]);

	// 2. Handle form submission
	const handleSaveTimeline = async (timelineData) => {
		let response;
		if (currentTimeline) {
			// Update
			response = await supabase
				.from("assignment_timelines")
				.update(timelineData)
				.eq("id", currentTimeline.id);
		} else {
			// Insert
			response = await supabase
				.from("assignment_timelines")
				.insert({ ...timelineData, assignment_id: assignmentId });
		}

		if (response.error) {
			console.error("Failed to save timeline:", response.error);
			alert("목표 등록/수정 중 오류가 발생했습니다.");
		} else {
			setIsFormOpen(false);
			setCurrentTimeline(null);
			fetchTimelines();
		}
	};

	// 3. Handle delete
	const handleDeleteTimeline = async (timelineId) => {
		const { error } = await supabase
			.from("assignment_timelines")
			.delete()
			.eq("id", timelineId);

		if (error) {
			console.error("Failed to delete timeline:", error);
			alert("목표 삭제 중 오류가 발생했습니다.");
		} else {
			fetchTimelines();
		}
	};

	return (
		<section className="mb-6 p-4 rounded shadow-md shadow-gray-7 bg-gray-2 text-gray-12">
			<Flex justify="between" align="center" className="mb-3">
				<Text as="h2" className="font-semibold text-lg">
					사건 진행 상황
				</Text>
				{isAdmin && (
					<Button
						variant="soft"
						onClick={() => {
							setCurrentTimeline(null);
							setIsFormOpen(true);
						}}
					>
						등록
					</Button>
				)}
			</Flex>

			{timelines.length === 0 ? (
				<Text>등록된 목표가 없습니다.</Text>
			) : (
				<>
					<Flex justify="between" align="center" className="mb-3">
						<Box className="flex gap-4 items-center">
							<Text className="font-semibold">
								현재 진행 상황:{" "}
								{timelines[timelines.length - 1]?.description || "정보 없음"}
							</Text>
							<Text size="2" color="gray">
								{new Date(
									timelines[timelines.length - 1]?.created_at
								).toLocaleString("ko-KR", {
									year: "numeric",
									month: "2-digit",
									day: "2-digit",
								}) || "정보 없음"}
							</Text>
						</Box>
						<Button variant="ghost" onClick={() => setIsExpanded(!isExpanded)}>
							{isExpanded ? "닫기" : "상세 보기"}
						</Button>
					</Flex>

					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{
							height: isExpanded ? "auto" : 0,
							opacity: isExpanded ? 1 : 0,
						}}
						transition={{ duration: 0.3 }}
						className="overflow-hidden"
					>
						{timelines
							.slice(0, -1)
							.reverse()
							.map((timeline) => (
								<Box
									key={timeline.id}
									className="mb-4 p-3 bg-gray-2 rounded border border-gray-6"
								>
									<Flex justify="between" align="center">
										<Box>
											<Text>
												<span className="font-semibold">목표: </span>
												{timeline.description}
											</Text>
											<Text size="2" color="gray">
												<span className="font-semibold">등록 날짜: </span>
												{new Date(timeline.created_at).toLocaleString()}
											</Text>
										</Box>
										{isAdmin && (
											<Flex gap="2">
												<Button
													variant="soft"
													size="2"
													onClick={() => {
														setCurrentTimeline(timeline);
														setIsFormOpen(true);
													}}
												>
													수정
												</Button>
												<Button
													variant="soft"
													color="red"
													size="2"
													onClick={() => handleDeleteTimeline(timeline.id)}
												>
													삭제
												</Button>
											</Flex>
										)}
									</Flex>
								</Box>
							))}
					</motion.div>
				</>
			)}

			{isFormOpen && (
				<TimelineForm
					initialData={currentTimeline}
					onOpenChange={setIsFormOpen}
					onSubmit={handleSaveTimeline}
				/>
			)}
		</section>
	);
};

export default AssignmentTimelines;

