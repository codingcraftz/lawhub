// src/app/client/assignment/[id]/CaseList.jsx

"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { Button, Flex, Text, Box, Badge } from "@radix-ui/themes";
import { motion } from "framer-motion";

import CaseForm from "../_components/dialogs/CaseForm";
import CaseDeadlines from "./CaseDeadlines";
import CaseTimelines from "./CaseTimelines";

export default function CaseList({ assignmentId, user }) {
	const [cases, setCases] = useState([]);
	const [expandedCaseId, setExpandedCaseId] = useState(null);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [currentCase, setCurrentCase] = useState(null);

	const isAdmin = user?.role === "staff" || user?.role === "admin";

	// 1) Fetch cases and deadlines
	const fetchCases = async () => {
		const { data: rawCases, error } = await supabase
			.from("cases")
			.select("*")
			.eq("assignment_id", assignmentId)
			.order("created_at", { ascending: false });

		if (error || !rawCases) {
			console.error("Failed to fetch cases:", error);
			return;
		}

		const updatedCases = [];
		for (const c of rawCases) {
			// Fetch the latest timeline for each case
			const { data: latestT } = await supabase
				.from("case_timelines")
				.select("text, created_at")
				.eq("case_id", c.id)
				.order("created_at", { ascending: false })
				.limit(1)
				.maybeSingle();

			// Fetch the next closest deadline
			const { data: nextD } = await supabase
				.from("case_deadlines")
				.select("type, deadline_date, location")
				.eq("case_id", c.id)
				.order("deadline_date", { ascending: true })
				.limit(1)
				.maybeSingle();
			console.log(nextD)

			updatedCases.push({
				...c,
				latestTimeline: latestT?.text || "진행상황 없음",
				nextDeadline: nextD
					? `${nextD.type} (${new Date(new Date(nextD.deadline_date).getTime() - 9 * 60 * 60 * 1000).toLocaleString("ko-KR", { year: "2-digit", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", })} @ ${nextD.location || "위치 정보 없음"})`
					: "예정된 기일 없음",
			});
		}

		setCases(updatedCases);
	};

	useEffect(() => {
		if (assignmentId) fetchCases();
	}, [assignmentId]);

	// 2) 소송 등록/수정
	const openCreateForm = () => {
		setCurrentCase(null);
		setIsFormOpen(true);
	};
	const openEditForm = (c) => {
		setCurrentCase(c);
		setIsFormOpen(true);
	};

	const handleFormSuccess = () => {
		setIsFormOpen(false);
		fetchCases();
	};

	// 3) 펼침/접힘
	const toggleExpand = (caseId) => {
		setExpandedCaseId((prev) => (prev === caseId ? null : caseId));
	};

	const StatusBadge = ({ status }) => {
		if (status === "ongoing") {
			return (
				<Badge color="green">
					진행
				</Badge>

			);
		}
		if (status === "closed") {
			return (
				<Badge color="red">
					완료
				</Badge>

			);
		}
		return null;
	};



	return (
		<section className="flex flex-col mb-6 p-4 rounded shadow-md shadow-gray-7 bg-gray-2 text-gray-12">
			<Flex justify="between" align="center" className="mb-3">
				<Text as="h2" className="font-semibold text-lg">
					소송 목록
				</Text>
				{isAdmin && (
					<Button onClick={openCreateForm}>
						등록
					</Button>
				)}
			</Flex>

			{cases.length === 0 ? (
				<Text>등록된 소송이 없습니다.</Text>
			) : (
				<ul className="flex flex-col gap-3 w-full">
					{cases.map((item) => (
						<li
							key={item.id}
							className="p-3 bg-gray-3 border border-gray-6 rounded flex flex-col gap-2"
						>
							<Flex justify="between" align="center">
								<Box className="flex flex-col" style={{ maxWidth: "calc(100% - 70px)" }}>
									<div className="flex items-center gap-2">
										<StatusBadge status={item.status} />
										<Text className="font-medium">
											{item.court_name} {item.case_year} {item.case_type}{" "}
											{item.case_number} {item.case_subject}
										</Text>
									</div>
									<Text size="2" color="gray">
										상태: {item.latestTimeline}
									</Text>
									<Text size="2" color="gray">
										기일: {item.nextDeadline}
									</Text>
								</Box>
								<Flex gap="2" className="items-center flex-col">
									{isAdmin && (
										<Button variant="soft" onClick={() => openEditForm(item)}>
											수정
										</Button>
									)}
									<Button
										variant="ghost"
										onClick={() => toggleExpand(item.id)}
									>
										{expandedCaseId === item.id ? "닫기" : "상세보기"}
									</Button>
								</Flex>
							</Flex>

							{/* 펼쳐진 상세 */}
							{expandedCaseId === item.id && (
								<motion.div
									initial={{ height: 0, opacity: 0 }}
									animate={{ height: "auto", opacity: 1 }}
									transition={{ duration: 0.3 }}
									className="overflow-hidden p-2 bg-gray-2 border border-gray-6 rounded"
								>
									<CaseDeadlines caseId={item.id} isAdmin={isAdmin} handleSuccess={fetchCases} />
									<CaseTimelines caseId={item.id} isAdmin={isAdmin} assignmentId={assignmentId} handleSuccess={fetchCases} />
								</motion.div>
							)}
						</li>
					))}
				</ul>
			)}

			{/* 소송 등록/수정 폼 (Dialog) */}
			{isFormOpen && (
				<CaseForm
					open={isFormOpen}
					onOpenChange={setIsFormOpen}
					assignmentId={assignmentId}
					caseData={currentCase}
					onSuccess={handleFormSuccess}
					onClose={() => setIsFormOpen(false)}
				/>
			)}
		</section>
	);
}

