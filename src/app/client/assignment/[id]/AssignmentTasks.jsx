"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Flex, Text, Button, Badge } from "@radix-ui/themes";
import { motion } from "framer-motion";
import TaskComments from "./TaskComments"; // 댓글 컴포넌트
import TaskForm from "../_components/dialogs/TaskForm";

const AssignmentTasks = ({ assignmentId, user, assignmentAssignees }) => {
	const [tasks, setTasks] = useState([]);
	const [expandedTaskId, setExpandedTaskId] = useState(null);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [currentTask, setCurrentTask] = useState(null);
	const [showAll, setShowAll] = useState(false);
	const isAdmin = user?.role === "staff" || user?.role === "admin";

	const fetchTasks = async () => {
		const { data, error } = await supabase
			.from("assignment_tasks")
			.select(`
        id,
        title,
        content,
        status,
        type,
        created_by,
        created_at,
        requester:requester_id(name),
        receiver:receiver_id(name),
        users:created_by(name)
      `)
			.eq("assignment_id", assignmentId)
			.order("created_at", { ascending: true });

		if (error) {
			console.error("업무 목록 가져오기 오류:", error);
			return;
		}

		// 진행중 먼저 보이도록 정렬
		const sorted = (data || []).sort((a, b) => {
			if (a.status === "ongoing" && b.status === "closed") return -1;
			if (a.status === "closed" && b.status === "ongoing") return 1;
			return new Date(a.created_at) - new Date(b.created_at);
		});
		setTasks(sorted);
	};

	useEffect(() => {
		fetchTasks();
	}, [assignmentId]);

	// 삭제
	const handleDeleteTask = async (taskId) => {
		if (!window.confirm("정말 이 업무를 삭제하시겠습니까?")) return;
		const { error } = await supabase
			.from("assignment_tasks")
			.delete()
			.eq("id", taskId);

		if (!error) {
			// 성공 시 목록 재조회
			fetchTasks();
		} else {
			console.error("업무 삭제 오류:", error);
		}
	};

	// 폼 열기(신규)
	const openCreateForm = () => {
		setCurrentTask(null);
		setIsFormOpen(true);
	};

	// 폼 열기(수정)
	const openEditForm = (task) => {
		setCurrentTask(task);
		setIsFormOpen(true);
	};

	// 폼 저장 후 성공 콜백
	const handleFormSuccess = () => {
		fetchTasks();
		setIsFormOpen(false);
		setCurrentTask(null);
	};

	// 펼치기/접기
	const toggleExpand = (taskId) => {
		setExpandedTaskId((prev) => (prev === taskId ? null : taskId));
	};

	const ongoingCount = tasks.filter((task) => task.status === "ongoing").length;
	const visibleTasks = showAll ? tasks : tasks.slice(0, 3);

	// --- 상태/유형 배지(Badge) ---
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

	const TypeBadge = ({ type }) => {
		if (type === "request") {
			return (
				<Badge>
					요청
				</Badge>
			);
		}
		return null;
	};

	return (
		<section className="flex flex-col mb-6 p-4 rounded shadow-md shadow-gray-7 bg-gray-2 text-gray-12">
			{/* 헤더 */}
			<Flex justify="between" align="center" className="mb-3 flex-wrap gap-2">
				<Text className="text-lg font-semibold flex-1">
					업무 목록{" "}
					<span className="text-md text-gray-10">({ongoingCount}개 진행중)</span>
				</Text>
				{isAdmin && (
					<Button onClick={openCreateForm} variant="soft">
						등록
					</Button>
				)}
			</Flex>

			{/* 목록 */}
			{tasks.length === 0 ? (
				<Text>등록된 업무가 없습니다.</Text>
			) : (
				<ul className="space-y-3">
					{visibleTasks.map((task) => {
						const isRequest = task.type === "request";
						// 요청이라면 "요청자 -> 수신자", 아니라면 "작성자: [xxx]"
						const displayName = isRequest
							? `${task.requester?.name || "요청자 없음"} → ${task.receiver?.name || "수신자 없음"
							}`
							: `작성자: ${task.users?.name || "알 수 없음"}`;

						return (
							<li
								key={task.id}
								className={`bg-gray-3 border border-gray-6 p-3 rounded ${task.status === "closed" ? "opacity-80" : ""
									}`}
							>
								{/* 상단 영역 (제목, 배지, 이름/날짜 등) */}
								<Flex justify="between" align="start" className="flex-wrap gap-2">
									<Box className="flex-1">
										{/* 제목 + (유형/상태 배지) */}
										<Flex align="center" gap="2" className="mb-1 flex-wrap">
											<StatusBadge status={task.status} />
											<TypeBadge type={task.type} />
											<Text className="font-medium text-sm md:text-base">
												{task.title}
											</Text>
										</Flex>
										<div className="flex gap-2">
											{/* 작성자 or 요청자→수신자 */}
											<Text size="2" color="gray" className="text-xs md:text-sm">
												{displayName}
											</Text>
											<Text size="2" color="gray" className="text-xs md:text-sm">
												({new Date(task.created_at).toLocaleDateString("ko-KR", { hour: "2-digit", minute: "2-digit" })})
											</Text>
										</div>
									</Box>

									{/* 우측 버튼들 */}
									<Flex className="items-center gap-2">
										{isAdmin && user.id === task.created_by && (
											<div className="flex gap-1">
												<Button variant="soft" size="1" onClick={() => openEditForm(task)}>
													수정
												</Button>
												<Button
													variant="soft"
													color="red"
													size="1"
													onClick={() => handleDeleteTask(task.id)}
												>
													삭제
												</Button>
											</div>
										)}
										<Button
											variant="ghost"
											size="1"
											onClick={() => toggleExpand(task.id)}
										>
											{expandedTaskId === task.id ? "닫기" : "상세보기"}
										</Button>
									</Flex>
								</Flex>

								{/* 펼쳐지는 상세내용 */}
								<motion.div
									initial={{ height: 0, opacity: 0 }}
									animate={{
										height: expandedTaskId === task.id ? "auto" : 0,
										opacity: expandedTaskId === task.id ? 1 : 0,
									}}
									transition={{ duration: 0.3 }}
									className="overflow-hidden"
								>
									{expandedTaskId === task.id && (
										<Box className="mt-4 bg-gray-2 p-3 border border-gray-6 rounded">
											<Text>{task.content || "내용 없음"}</Text>
											{/* 댓글 컴포넌트 */}
											<TaskComments taskId={task.id} user={user} />
										</Box>
									)}
								</motion.div>
							</li>
						);
					})}
				</ul>
			)}

			{/* 더보기 / 접기 */}
			{tasks.length > 3 && (
				<Button
					className="mt-4"
					variant="ghost"
					size="1"
					onClick={() => setShowAll((prev) => !prev)}
				>
					{showAll ? "접기" : "더보기"}
				</Button>
			)}

			{/* 폼 다이얼로그 */}
			{isFormOpen && (
				<TaskForm
					open={isFormOpen}
					onOpenChange={setIsFormOpen}
					assignmentId={assignmentId}
					taskData={currentTask}
					onSuccess={handleFormSuccess}
					user={user}
					assignmentAssignees={assignmentAssignees}
				/>
			)}
		</section>
	);
};

export default AssignmentTasks;

