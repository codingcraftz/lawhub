"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { Button } from "@radix-ui/themes";
import Timeline from "@/components/Timeline";
import CaseForm from "../_components/dialogs/CaseForm";
import StatusForm from "../_components/dialogs/StatusForm";

const CaseList = ({ assignmentId, user }) => {
	const [cases, setCases] = useState([]);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [currentCase, setCurrentCase] = useState(null);

	// 타임라인(상세보기) state
	const [timelineOpenMap, setTimelineOpenMap] = useState({});
	// 상태 수정 폼 state
	const [statusFormOpenMap, setStatusFormOpenMap] = useState({});

	const isAdmin = user?.role === "staff" || user?.role === "admin";

	const fetchCases = async () => {
		const { data, error } = await supabase
			.from("cases")
			.select("*")
			.eq("assignment_id", assignmentId);
		if (!error && data) {
			setCases(data);
		}
	};

	useEffect(() => {
		fetchCases();
	}, [assignmentId]);

	const handleFormSuccess = () => {
		setIsFormOpen(false);
		fetchCases();
	};

	const openCreateForm = () => {
		setCurrentCase(null);
		setIsFormOpen(true);
	};
	const openEditForm = (c) => {
		setCurrentCase(c);
		setIsFormOpen(true);
	};

	const openTimeline = (caseId) => {
		setTimelineOpenMap((prev) => ({ ...prev, [caseId]: true }));
	};
	const closeTimeline = (caseId) => {
		setTimelineOpenMap((prev) => ({ ...prev, [caseId]: false }));
	};

	const openStatusForm = (caseId) => {
		setStatusFormOpenMap((prev) => ({ ...prev, [caseId]: true }));
	};
	const closeStatusForm = (caseId) => {
		setStatusFormOpenMap((prev) => ({ ...prev, [caseId]: false }));
	};

	return (
		<section className="mb-6 p-4 rounded shadow-md shadow-gray-7 bg-gray-2 text-gray-12">
			<div className="flex justify-between mb-3">
				<h2 className="font-semibold text-lg">소송 목록</h2>
				{isAdmin && <Button variant="soft" onClick={openCreateForm}>등록</Button>}
			</div>

			{cases.length === 0 ? (
				<p>등록된 소송이 없습니다.</p>
			) : (
				<ul className="space-y-3">
					{cases.map((item) => (
						<li
							key={item.id}
							className="flex justify-between p-3 bg-gray-3 border border-gray-6 rounded items-center"
						>
							<div>
								<p className="font-medium">
									{item.court_name} {item.case_year} {item.case_type}{" "}
									{item.case_number} {item.case_subject}
								</p>
								<div className="flex gap-2 items-center">
									<p className="text-sm text-gray-11">
										상태: {item?.status || "알 수 없음"}
									</p>
									{isAdmin && (
										<Button
											size="1"
											variant="soft"
											onClick={() => openStatusForm(item.id)}
										>
											수정
										</Button>
									)}
								</div>
							</div>
							<div className="flex gap-2">
								{isAdmin && (
									<Button variant="soft" onClick={() => openEditForm(item)}>
										수정
									</Button>
								)}
								{/* 상세보기 버튼 */}
								<Button variant="soft" onClick={() => openTimeline(item.id)}>
									상세
								</Button>

								{/* Timeline (상세보기) */}
								{timelineOpenMap[item.id] && (
									<Timeline
										caseId={item.id}
										caseStatus={item.status}
										description={item.description}
										open={timelineOpenMap[item.id] || false}
										onOpenChange={(opened) => {
											if (!opened) closeTimeline(item.id);
										}}
									/>
								)}

								{/* StatusForm 다이얼로그 */}
								{statusFormOpenMap[item.id] && (
									<StatusForm
										open={statusFormOpenMap[item.id]}
										caseId={item.id}
										currentStatus={item.status}
										onSuccess={fetchCases}
										onClose={() => closeStatusForm(item.id)}
									/>
								)}
							</div>
						</li>
					))}
				</ul>
			)}

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
};

export default CaseList;

