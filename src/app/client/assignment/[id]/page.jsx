"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@radix-ui/react-icons";
import { useUser } from "@/hooks/useUser";
import Inquiry from "./Inquiry";
import AssignmentTimelines from "./AssignmentTiemlines";
import CreditorInfo from "./CreditorInfo";
import DebtorInfo from "./DebtorInfo";
import BondDetails from "./BondDetails";
import CaseList from "./CaseList";
import EnforcementList from "./EnforcementList";
import AssignmentTasks from "./AssignmentTasks";
import FileList from "./FileList";
import ClientInfoModal from "../_components/ClientInfoModal";
import GroupInfoModal from "../_components/GroupInfoModal";
import AssignmentEditModal from "./AssignmentEditModal"; // 추가
import { Button } from "@radix-ui/themes";
import useRoleRedirect from "@/hooks/userRoleRedirect";

const AssignmentPage = () => {
	useRoleRedirect(["staff", "admin", "client"], "/");
	const { id: assignmentId } = useParams();
	const { user } = useUser();
	const [assignment, setAssignment] = useState(null);
	const [assignmentType, setAssignmentType] = useState(null);
	const [clientModalOpen, setClientModalOpen] = useState(false);
	const [groupModalOpen, setGroupModalOpen] = useState(false);
	const [editModalOpen, setEditModalOpen] = useState(false); // 의뢰 수정 모달
	const router = useRouter();

	// 관리자 권한 여부
	const isAdmin = user?.role === "staff" || user?.role === "admin";

	const fetchAssignments = async () => {
		try {
			const { data, error } = await supabase
				.from("assignments")
				.select(
					`
					id,
          description,
          created_at,
          status,
          assignment_clients (
            id,
            client_id,
            type,
            client:users (
              id,
              name,
              phone_number
            )
          ),
          assignment_groups (
            id,
            group_id,
            type,
            group:groups (
              id,
              name
            )
          )
        `
				)
				.eq("id", assignmentId)
				.single();

			if (error || !data) {
				console.error("Error fetching assignment:", error);
				return;
			}

			// assignment_clients 또는 assignment_groups 배열 존재 여부 파악
			if (data.assignment_clients?.length > 0) {
				setAssignmentType("client");
			} else if (data.assignment_groups?.length > 0) {
				setAssignmentType("group");
			}
			setAssignment(data);
		} catch (error) {
			console.error("Unexpected error:", error);
		}
	};

	useEffect(() => {
		fetchAssignments();
	}, [assignmentId]);

	// 1) 의뢰 삭제하기
	const handleDeleteAssignment = async () => {
		if (!window.confirm("정말로 이 의뢰를 삭제하시겠습니까?")) return;

		try {
			const { error } = await supabase
				.from("assignments")
				.delete()
				.eq("id", assignmentId);

			if (error) {
				throw new Error("의뢰 삭제 중 오류가 발생했습니다.");
			}
			alert("의뢰가 삭제되었습니다.");
			router.back();
		} catch (err) {
			console.error(err);
			alert("의뢰 삭제 실패");
		}
	};

	// 2) 종결(Closed)로 상태 변경
	const handleCloseAssignment = async () => {
		if (!window.confirm("이 의뢰를 종결 처리하시겠습니까?")) return;

		try {
			const { error } = await supabase
				.from("assignments")
				.update({ status: "closed" })
				.eq("id", assignmentId);

			if (error) {
				throw new Error("종결 처리 중 오류가 발생했습니다.");
			}

			alert("의뢰 상태가 종결 처리되었습니다.");
			fetchAssignments(); // 다시 조회하여 상태 갱신
		} catch (err) {
			console.error(err);
			alert("종결 처리 실패");
		}
	};

	return (
		<div className="p-4 mx-auto flex flex-col w-full text-gray-12">
			<div className="flex mb-4 justify-between">
				<div className="flex items-center gap-2">
					<ArrowLeftIcon
						className="w-8 h-8 cursor-pointer"
						onClick={() => router.back()}
					/>
					<h1 className="text-2xl font-bold">의뢰 상세 페이지</h1>
					{assignmentType === "client" && isAdmin && (
						<>
							<Button onClick={() => setClientModalOpen(true)}>의뢰인 정보보기</Button>
							<ClientInfoModal
								open={clientModalOpen}
								onOpenChange={setClientModalOpen}
								clientId={assignment?.assignment_clients?.[0]?.client_id}
								type={assignment?.assignment_clients?.[0]?.type}
							/>
						</>
					)}
					{assignmentType === "group" && isAdmin && (
						<>
							<Button color="green" onClick={() => setGroupModalOpen(true)}>
								그룹 정보보기
							</Button>
							<GroupInfoModal
								open={groupModalOpen}
								onOpenChange={setGroupModalOpen}
								groupId={assignment?.assignment_groups?.[0]?.group_id}
								type={assignment?.assignment_groups?.[0]?.type}
							/>
						</>
					)}
				</div>

				{/* (예시) 관리자만 "삭제하기", "종결" 버튼 보이기 + "수정" 버튼 추가 */}
				{isAdmin && assignment && (
					<div className="flex gap-2">
						{/* 의뢰 수정 버튼 */}
						<Button variant="soft" onClick={() => setEditModalOpen(true)}>
							의뢰 수정
						</Button>

						<Button variant="soft" color="red" onClick={handleDeleteAssignment}>
							의뢰 삭제
						</Button>
						{/* ongoing 상태일 때만 종결 버튼 */}
						{assignment?.status === "ongoing" && (
							<Button variant="soft" color="green" onClick={handleCloseAssignment}>
								의뢰 종결
							</Button>
						)}
					</div>
				)}
			</div>

			<div className="p-2 text-gray-11 mb-6 bg-gray-2 rounded">
				<p>{assignment?.description}</p>
			</div>

			{/* 기존 컴포넌트들 */}
			<AssignmentTimelines assignmentId={assignmentId} user={user} />
			<div className="grid grid-cols-2 gap-4 mt-4">
				<CreditorInfo assignmentId={assignmentId} user={user} />
				<DebtorInfo assignmentId={assignmentId} user={user} />
				<BondDetails assignmentId={assignmentId} user={user} />
				<CaseList assignmentId={assignmentId} user={user} />
				<EnforcementList assignmentId={assignmentId} user={user} />
				<FileList assignmentId={assignmentId} user={user} />
				<Inquiry assignmentId={assignmentId} user={user} />
				<AssignmentTasks assignmentId={assignmentId} user={user} />
			</div>

			{/* 의뢰 수정 모달 */}
			{assignment && (
				<AssignmentEditModal
					open={editModalOpen}
					onOpenChange={setEditModalOpen}
					assignment={assignment}
					onAssignmentUpdated={fetchAssignments}
				/>
			)}
		</div>
	);
};

export default AssignmentPage;

