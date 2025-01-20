"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
	Flex,
	Box,
	Text,
	Badge,
	Button
} from "@radix-ui/themes";
import {
	ArrowTopRightIcon,
	CheckIcon,
	EyeOpenIcon,
	EyeClosedIcon
} from "@radix-ui/react-icons"; // Radix UI 아이콘 예시
import TaskComments from "@/app/client/assignment/[id]/TaskComments";

// 단일 업무 카드를 표시
const TaskItem = ({ task, user, onComplete, onToggleExpand, expanded }) => {
	const router = useRouter();

	// 권한/상태 관련
	const isAdmin = user?.role === "staff" || user?.role === "admin";
	const isReceiver = task.receiver_id === user?.id;
	const isOngoing = task.status === "ongoing";

	// (1) 상태 배지
	const StatusBadge = ({ status }) => {
		switch (status) {
			case "ongoing":
				return <Badge color="green">진행 중</Badge>;
			case "closed":
				return <Badge color="red">완료</Badge>;
			default:
				return <Badge>알 수 없음</Badge>;
		}
	};

	// (2) 의뢰인/그룹 이름 정리
	const getAssignmentNames = (assignment) => {
		const { assignment_clients = [], assignment_groups = [] } = assignment || {};
		if (assignment_groups.length > 0) {
			const groupNames = assignment_groups.map((g) => g.group?.name).filter(Boolean);
			return groupNames.length
				? `그룹: ${groupNames.join(", ")}`
				: "그룹: (이름 없음)";
		} else {
			const clientNames = assignment_clients.map((c) => c.client?.name).filter(Boolean);
			return clientNames.length
				? `의뢰인: ${clientNames.join(", ")}`
				: "의뢰인: (이름 없음)";
		}
	};

	const assignmentNames = getAssignmentNames(task.assignment);
	const assignmentDesc = task.assignment?.description;

	return (
		<Box
			key={task.id}
			// 카드 스타일 + hover 효과
			className={`
        relative mb-4 p-4 rounded-lg border border-gray-6 
        shadow 
        hover:shadow-lg 
        transition-shadow
        ${task.status === "closed" ? "opacity-80" : ""}
      `}
		>
			{/* 상단 라인: 상태, 사건설명(있다면), 업무제목 */}
			<Flex justify="between" align="start" className="flex-wrap gap-3">
				<Box className="flex-1">
					{/* 첫 줄: 상태 배지 + 사건 설명 */}
					<Flex align="center" gap="2" className="mb-2 flex-wrap">
						<StatusBadge status={task.status} />
						<Text size="4" weight="bold">
							{assignmentDesc || "사건 설명 없음"}
						</Text>
					</Flex>

					{/* 업무 제목 (조금 더 강조) */}
					<Text size="3" weight="medium" className="mb-1 text-gray-12">
						{task.title}
					</Text>
					{/* 의뢰인/그룹, 요청자, 수신자 등 */}
					<Text as="p" size="2" color="gray" className="mb-1">
						{assignmentNames}
					</Text>
					<Flex justify="between" >
						<Text size="2" color="gray" className="mb-1">
							요청자: {task.requester?.name || "-"} / 수신자:{" "}
							{task.receiver?.name || "-"}
						</Text>
					</Flex>

				</Box>

				{/* 오른쪽 상단 행동 버튼들 (사건 이동, 완료 처리) */}
				<Flex direction="column" gap="2" align="end">
					<Button
						variant="soft"
						size="2"
						onClick={() =>
							router.push(`/client/assignment/${task.assignment_id}`)
						}
					>
						<ArrowTopRightIcon className="mr-1" />
						의뢰 페이지
					</Button>

					{/* 진행 중 + 권한 → "완료" 버튼 */}
					{isOngoing && (isAdmin || isReceiver) && (
						<Button
							variant="soft"
							color="green"
							size="2"
							onClick={() => onComplete(task.id)}
						>
							<CheckIcon className="mr-1" />
							완료
						</Button>
					)}

					<Button className="mt-auto" variant="ghost" size="2" onClick={() => onToggleExpand(task.id)}>
						{expanded ? (
							<>
								<EyeClosedIcon className="mr-1" />
								닫기
							</>
						) : (
							<>
								<EyeOpenIcon className="mr-1" />
								세부 사항
							</>
						)}
					</Button>

				</Flex>
			</Flex>

			{/* 하단 (펼치기/닫기) 버튼 */}

			{/* 펼침 영역: 생성일 + 업무 내용 + 댓글 */}
			{expanded && (
				<Box
					className="
            mt-4 pt-4 border-t border-gray-6 
            bg-gray-1/50 
            rounded-sm
          "
				>
					{/* 생성일 */}
					<Text size="2" color="gray" className="mb-2">
						생성일:{" "}
						{new Date(task.created_at).toLocaleDateString("ko-KR", {
							hour: "2-digit",
							minute: "2-digit",
						})}
					</Text>

					{/* 업무 내용 */}
					<Text size="3" className="mb-3 whitespace-pre-wrap text-gray-12">
						<strong>업무 내용:</strong> {task.content || "내용 없음"}
					</Text>

					{/* 댓글 섹션 */}
					<TaskComments taskId={task.id} user={user} />
				</Box>
			)}
		</Box>
	);
};

export default TaskItem;

