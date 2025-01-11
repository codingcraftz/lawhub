"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Button } from "@radix-ui/themes";
import EnforcementComments from "./EnforcementComments";
import EnforcementForm from "../_components/dialogs/EnforcementForm";

const EnforcementList = ({ assignmentId, user }) => {
	const [enforcements, setEnforcements] = useState([]);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [currentEnforcement, setCurrentEnforcement] = useState(null);
	const [detailOpenMap, setDetailOpenMap] = useState({});

	const isAdmin = user?.role === "staff" || user?.role === "admin";
	const kor_status = { ongoing: "진행중", scheduled: "대기", closed: "종결" };

	const fetchEnforcements = async () => {
		const { data, error } = await supabase
			.from("enforcements")
			.select("*")
			.eq("assignment_id", assignmentId);

		if (!error && data) {
			setEnforcements(data);
		}
	};

	useEffect(() => {
		fetchEnforcements();
	}, [assignmentId]);

	const handleFormSuccess = () => {
		setIsFormOpen(false);
		fetchEnforcements();
	};

	const openCreate = () => {
		setCurrentEnforcement(null);
		setIsFormOpen(true);
	};

	const openEdit = (enf) => {
		setCurrentEnforcement(enf);
		setIsFormOpen(true);
	};

	const openDetail = (id) => {
		setDetailOpenMap((prev) => ({ ...prev, [id]: true }));
	};

	const closeDetail = (id) => {
		setDetailOpenMap((prev) => ({ ...prev, [id]: false }));
	};

	return (
		<section className="mb-6 p-4 rounded shadow-md shadow-gray-7 bg-gray-2 text-gray-12">
			<div className="flex justify-between mb-3">
				<h2 className="font-semibold text-lg">강제집행 목록</h2>
				{isAdmin && (
					<Button onClick={openCreate}>
						등록
					</Button>
				)}
			</div>
			{enforcements?.length === 0 ? (
				<p>등록된 강제집행이 없습니다.</p>
			) : (
				<ul className="space-y-3">
					{enforcements.map((item) => (
						<li
							key={item.id}
							className="flex items-center justify-between bg-gray-3 border border-gray-6 p-3 rounded"
						>
							<div>
								<p className="font-medium">{item.type}</p>
								<p className="text-sm text-gray-11">
									상태: {kor_status[item?.status]} / 금액:{" "}
									{item?.amount?.toLocaleString()}원
								</p>
							</div>
							<div className="flex gap-2">
								{isAdmin && (
									<Button variant="soft" onClick={() => openEdit(item)}>
										수정
									</Button>
								)}
								<Button variant="soft" onClick={() => openDetail(item.id)}>
									상세
								</Button>
								<EnforcementComments
									item={item}
									enforcementId={item.id}
									open={detailOpenMap[item.id] || false}
									onOpenChange={(opened) => {
										if (!opened) closeDetail(item.id);
									}}
									user={user}
								/>
							</div>
						</li>
					))}
				</ul>
			)}

			{isFormOpen && (
				<EnforcementForm
					open={isFormOpen}
					onOpenChange={setIsFormOpen}
					assignmentId={assignmentId}
					enforcementData={currentEnforcement}
					onSuccess={handleFormSuccess}
				/>
			)}
		</section>
	);
};

export default EnforcementList;

