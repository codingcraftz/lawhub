"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Button, Flex, Text } from "@radix-ui/themes";
import { motion } from "framer-motion";

import EnforcementForm from "../_components/dialogs/EnforcementForm";
import EnforcementComments from "./EnforcementComments";

const EnforcementList = ({ assignmentId, user }) => {
	const [enforcements, setEnforcements] = useState([]);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [currentEnforcement, setCurrentEnforcement] = useState(null);
	const [expandedMap, setExpandedMap] = useState({}); // 상세보기 펼침 여부

	const isAdmin = user?.role === "staff" || user?.role === "admin";
	const kor_status = { ongoing: "진행중", scheduled: "대기", closed: "종결" };

	// 1) 목록 조회
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
		if (assignmentId) {
			fetchEnforcements();
		}
	}, [assignmentId]);

	// 2) 등록/수정 Form
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

	// 3) 상세보기 펼침/접힘
	const toggleExpand = (id) => {
		setExpandedMap((prev) => ({ ...prev, [id]: !prev[id] }));
	};

	return (
		<section className="mb-6 p-4 rounded shadow-md shadow-gray-7 bg-gray-2 text-gray-12">
			<Flex justify="between" align="center" className="mb-3">
				<Text as="h2" className="font-semibold text-lg">
					회수 활동 목록
				</Text>
				{isAdmin && (
					<Button onClick={openCreate}>
						등록
					</Button>
				)}
			</Flex>

			{enforcements?.length === 0 ? (
				<Text>등록된 회수활동이 없습니다.</Text>
			) : (
				<ul className="space-y-3">
					{enforcements.map((item) => (
						<li
							key={item.id}
							className="flex flex-col bg-gray-3 border border-gray-6 p-3 rounded gap-2"
						>
							{/* 상단부: 기본 정보 표시 */}
							<Flex justify="between" align="center">
								<div className="flex flex-col">
									<Text className="font-medium">{item.type}</Text>
									<Text size="2" color="gray">
										상태: {kor_status[item?.status] || "알 수 없음"} / 금액:{" "}
										{item?.amount?.toLocaleString()}원
									</Text>
								</div>
								<Flex gap="2">
									{isAdmin && (
										<Button variant="soft" onClick={() => openEdit(item)}>
											수정
										</Button>
									)}
									<Button
										variant="soft"
										onClick={() => toggleExpand(item.id)}
									>
										{expandedMap[item.id] ? "닫기" : "상세"}
									</Button>
								</Flex>
							</Flex>

							{/* 펼쳐지는 댓글(코멘트) 영역 */}
							{expandedMap[item.id] && (
								<motion.div
									initial={{ height: 0, opacity: 0 }}
									animate={{ height: "auto", opacity: 1 }}
									transition={{ duration: 0.3 }}
									className="overflow-hidden p-2 bg-gray-2 border border-gray-6 rounded"
								>
									<EnforcementComments
										enforcementId={item.id}
										user={user}
									/>
								</motion.div>
							)}
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

