"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Flex, Text, Button } from "@radix-ui/themes";
import { motion } from "framer-motion";
import TaskComments from "./TaskComments"; // 댓글 컴포넌트
import TaskForm from "../_components/dialogs/TaskForm";

const AssignmentTasks = ({ assignmentId, user }) => {
	const [tasks, setTasks] = useState([]);
	const [expandedTaskId, setExpandedTaskId] = useState(null);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [currentTask, setCurrentTask] = useState(null);
	const [showAll, setShowAll] = useState(false);

	const isAdmin = user?.role === "staff" || user?.role === "admin";

	// 업무 목록 가져오기
	const fetchTasks = async () => {
		const { data, error } = await supabase
			.from("assignment_tasks")
			.select(`
        id,
        title,
        content,
        status,
        created_by,
        created_at,
        users:created_by(name)
      `)
			.eq("assignment_id", assignmentId)
			.order("created_at", { ascending: true });

		if (!error) {
			const sortedData = data.sort((a, b) => {
				if (a.status === "ongoing" && b.status === "closed") return -1;
				if (a.status === "closed" && b.status === "ongoing") return 1;
				return new Date(a.created_at) - new Date(b.created_at);
			});
			setTasks(sortedData || []);
		}
	};

	useEffect(() => {
		fetchTasks();
	}, [assignmentId]);

	const toggleExpand = (taskId) => {
		setExpandedTaskId((prev) => (prev === taskId ? null : taskId));
	};

	const handleDeleteTask = async (taskId) => {
		if (!window.confirm("정말 이 업무를 삭제하시겠습니까?")) return;

		const { error } = await supabase.from("assignment_tasks").delete().eq("id", taskId);
		if (!error) fetchTasks();
	};

	const openCreateForm = () => {
		setCurrentTask(null);
		setIsFormOpen(true);
	};

	const openEditForm = (task) => {
		setCurrentTask(task);
		setIsFormOpen(true);
	};

	const handleFormSuccess = () => {
		fetchTasks();
		setIsFormOpen(false);
		setCurrentTask(null);
	};

	const ongoingCount = tasks.filter((task) => task.status === "ongoing").length;
	const visibleTasks = showAll ? tasks : tasks.slice(0, 3);

	return (
		<section className="flex flex-col mb-6 p-4 rounded shadow-md shadow-gray-7 bg-gray-2 text-gray-12">
			<Flex justify="between" align="center" className="mb-3 flex-wrap gap-2">
				<Text className="text-lg font-semibold flex-1">
					업무 목록 <span className="text-md text-gray-10">({ongoingCount}개 진행중)</span>
				</Text>
				{isAdmin && (
					<Button onClick={openCreateForm}>
						등록
					</Button>
				)}
			</Flex>

			{tasks.length === 0 ? (
				<Text>등록된 업무가 없습니다.</Text>
			) : (
				<ul className="space-y-3">
					{visibleTasks.map((task) => (
						<li
							key={task.id}
							className={`bg-gray-3 border border-gray-6 p-3 rounded ${task.status === "closed" ? "opacity-80" : ""
								}`}
						>
							<Flex justify="between" align="center" className="flex-wrap gap-2">
								<Box className="flex-1">
									<Text className="font-medium text-sm md:text-base">
										{task.title}{" "}
										{task.status === "ongoing" && (
											<span className="text-green-9 text-xs md:text-sm ml-1">[진행 중]</span>
										)}
										{task.status === "closed" && (
											<span className="text-red-9 text-xs md:text-sm ml-1">[완료]</span>
										)}
									</Text>
									<Text size="2" color="gray" className="text-xs md:text-sm">
										작성자: {task.users?.name || "알 수 없음"} /{" "}
										{new Date(task.created_at).toLocaleDateString("ko-KR")}
									</Text>
								</Box>
								<Flex className="items-center gap-2">
									{isAdmin && user.id === task.created_by && (
										<div className="flex gap-1">
											<Button variant="soft" onClick={() => openEditForm(task)}>
												수정
											</Button>
											<Button variant="soft" color="red" onClick={() => handleDeleteTask(task.id)}>
												삭제
											</Button>
										</div>
									)}
									<Button variant="ghost" size="1" onClick={() => toggleExpand(task.id)}>
										{expandedTaskId === task.id ? "닫기" : "상세보기"}
									</Button>
								</Flex>
							</Flex>

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
										<TaskComments taskId={task.id} user={user} />
									</Box>
								)}
							</motion.div>
						</li>
					))}
				</ul>
			)}

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

			{isFormOpen && (
				<TaskForm
					open={isFormOpen}
					onOpenChange={setIsFormOpen}
					assignmentId={assignmentId}
					taskData={currentTask}
					onSuccess={handleFormSuccess}
					user={user}
				/>
			)}
		</section>
	);
};

export default AssignmentTasks;

