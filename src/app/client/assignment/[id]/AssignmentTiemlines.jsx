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

	// Fetch timelines
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

	// Handle form submission
	const handleSaveTimeline = async (timelineData) => {
		let response;
		if (currentTimeline) {
			response = await supabase
				.from("assignment_timelines")
				.update(timelineData)
				.eq("id", currentTimeline.id);
		} else {
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
			await fetchTimelines(); // Reload timelines after save
		}
	};

	// Handle delete
	const handleDeleteTimeline = async (timelineId) => {
		const { error } = await supabase
			.from("assignment_timelines")
			.delete()
			.eq("id", timelineId);

		if (error) {
			console.error("Failed to delete timeline:", error);
			alert("목표 삭제 중 오류가 발생했습니다.");
		} else {
			await fetchTimelines(); // Reload timelines after delete
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
						<Box className="flex gap-4 items-center justify-between w-full px-2">
							<Text className="font-semibold">
								현재 진행 상황:{" "}
								{timelines[timelines.length - 1]?.description || "정보 없음"}
							</Text>
							<div className="flex gap-4">
								<Text size="2" color="gray">
									{new Date(
										timelines[timelines.length - 1]?.created_at
									).toLocaleString("ko-KR", {
										year: "numeric",
										month: "2-digit",
										day: "2-digit",
									}) || "정보 없음"}
								</Text>
								{isAdmin && (
									<Flex gap="2">
										<Button
											variant="soft"
											size="2"
											onClick={() => {
												setCurrentTimeline(timelines[timelines.length - 1]);
												setIsFormOpen(true);
											}}
										>
											수정
										</Button>
										<Button
											variant="soft"
											color="red"
											size="2"
											onClick={() => handleDeleteTimeline(timelines[timelines.length - 1].id)}
										>
											삭제
										</Button>
									</Flex>
								)}
							</div>
						</Box>
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
										<Box className="flex justify-between w-full">
											<Text>
												{timeline.description}
											</Text>
											<Text size="2" color="gray">
												{new Date(timeline.created_at).toLocaleString("ko-KR", {
													year: "numeric",
													month: "2-digit",
													day: "2-digit",
												})}
											</Text>
										</Box>
										{isAdmin && (
											<Flex gap="2" className="px-4">
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
					{timelines.length > 1 && (
						<Button
							className="ml-auto w-full"
							variant="ghost"
							onClick={() => setIsExpanded(!isExpanded)}
						>
							{isExpanded ? "닫기" : "더보기"}
						</Button>
					)}
				</>
			)}
			{isFormOpen && (
				<TimelineForm
					open={isFormOpen}
					assignmentId={assignmentId}
					timelineData={currentTimeline}
					onOpenChange={setIsFormOpen}
					onSuccess={fetchTimelines} // Refresh after save
				/>
			)}
		</section>
	);
};

export default AssignmentTimelines;

