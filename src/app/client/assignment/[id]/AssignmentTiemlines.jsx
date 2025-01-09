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

	// 2. Handle form submission for adding/editing a timeline
	const handleSaveTimeline = async (timelineData) => {
		let response;
		if (currentTimeline) {
			// Update existing timeline
			response = await supabase
				.from("assignment_timelines")
				.update(timelineData)
				.eq("id", currentTimeline.id);
		} else {
			// Add new timeline
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
			fetchTimelines(); // Refresh list
		}
	};

	// 3. Handle delete button click
	const handleDeleteTimeline = async (timelineId) => {
		const { error } = await supabase
			.from("assignment_timelines")
			.delete()
			.eq("id", timelineId);

		if (error) {
			console.error("Failed to delete timeline:", error);
			alert("목표 삭제 중 오류가 발생했습니다.");
		} else {
			fetchTimelines(); // Refresh list
		}
	};

	return (
		<section className="mb-6 p-4 rounded shadow shadow-gray-5">
			<div className="flex justify-between">
				<h2 className="font-semibold text-lg mb-3">사건 진행 상황</h2>
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
			</div>
			{timelines.length === 0 ? (
				<p>등록된 목표가 없습니다.</p>
			) : (
				<>
					<div className="mb-3 flex justify-between">
						<Text className="flex gap-4">
							<span className="font-semibold">{`현재 진행 상황: ${timelines[timelines.length - 1]?.description || "정보 없음"}`}
							</span>
							<Text size="2" color="gray">
								{new Date(
									timelines[timelines.length - 1]?.created_at
								).toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }) || "정보 없음"}
							</Text>

						</Text>
						<Button
							variant="ghost"
							onClick={() => setIsExpanded(!isExpanded)}
						>
							{isExpanded ? "닫기" : "상세 보기"}
						</Button>

					</div>

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
							.slice(0, -1) // 제외된 마지막 항목은 "현재 진행 상황"에 표시되었으므로
							.reverse() // 최근 항목부터 표시
							.map((timeline) => (
								<div key={timeline.id} className="mb-4">
									<div className="flex justify-between items-center">
										<div>
											<p>
												<span className="font-semibold">목표: </span>
												{timeline.description}
											</p>
											<p>
												<span className="font-semibold">등록 날짜: </span>
												{new Date(timeline.created_at).toLocaleString()}
											</p>
										</div>
										{isAdmin && (
											<div className="flex gap-2">
												<Button
													variant="soft"
													size="small"
													onClick={() => {
														setCurrentTimeline(timeline);
														setIsFormOpen(true);
													}}
												>
													수정
												</Button>
												<Button
													variant="outline"
													size="small"
													onClick={() => handleDeleteTimeline(timeline.id)}
												>
													삭제
												</Button>
											</div>
										)}
									</div>
								</div>
							))}
					</motion.div>
				</>
			)}

			{/* Timeline Form Dialog */}
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

