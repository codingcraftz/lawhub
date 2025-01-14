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
import FileList from "./FileList";
import ClientInfoModal from "../_components/ClientInfoModal";
import GroupInfoModal from "../_components/GroupInfoModal";
import { Button } from "@radix-ui/themes";

const AssignmentPage = () => {
	const { id: assignmentId } = useParams();
	const { user } = useUser();
	const [assignment, setAssignment] = useState(null);
	const [assignmentType, setAssignmentType] = useState(null);
	const [clientModalOpen, setClientModalOpen] = useState(false);
	const [groupModalOpen, setGroupModalOpen] = useState(false);
	const router = useRouter();

	const fetchAssignments = async () => {
		try {
			const { data, error } = await supabase
				.from("assignments")
				.select(`
          id,
          description,
          created_at,
          assignment_clients!left (client_id, type),
          assignment_groups!left (group_id, type)
        `)
				.eq("id", assignmentId)
				.single();

			if (error || !data) {
				console.error("Error fetching assignment:", error);
				return;
			}

			if (data.assignment_clients?.length > 0) {
				setAssignmentType("client");
				setAssignment(data);
			} else if (data.assignment_groups?.length > 0) {
				setAssignmentType("group");
				setAssignment(data);
			}
		} catch (error) {
			console.error("Unexpected error:", error);
		}
	};

	useEffect(() => {
		fetchAssignments();
	}, [assignmentId]);

	return (
		<div className="p-4 mx-auto flex flex-col w-full text-gray-12">
			<div className="flex items-center gap-2 mb-4">
				<ArrowLeftIcon
					className="w-8 h-8 cursor-pointer"
					onClick={() => router.back()}
				/>
				<h1 className="text-2xl font-bold">의뢰 상세 페이지</h1>
				{/* "정보보기" 버튼 */}
				{assignmentType === "client" && (
					<>
						<Button
							onClick={() => setClientModalOpen(true)}
						>
							의뢰인 정보보기
						</Button>
						<ClientInfoModal
							open={clientModalOpen}
							onOpenChange={setClientModalOpen}
							clientId={assignment.assignment_clients[0].client_id}
							type={assignment.assignment_clients[0].type}
						/>
					</>
				)}
				{assignmentType === "group" && (
					<>
						<Button
							color="green"
							onClick={() => setGroupModalOpen(true)}
						>
							그룹 정보보기
						</Button>
						<GroupInfoModal
							open={groupModalOpen}
							onOpenChange={setGroupModalOpen}
							groupId={assignment.assignment_groups[0].group_id}
							type={assignment.assignment_groups[0].type}
						/>
					</>
				)}

			</div>
			<div className="p-2 text-gray-11 mb-6 bg-gray-2 rounded">
				<p>{assignment?.description}</p>
			</div>


			<AssignmentTimelines assignmentId={assignmentId} user={user} />

			<div className="grid grid-cols-2 gap-4 mt-4">
				<CreditorInfo assignmentId={assignmentId} user={user} />
				<DebtorInfo assignmentId={assignmentId} user={user} />
				<BondDetails assignmentId={assignmentId} user={user} />
				<CaseList assignmentId={assignmentId} user={user} />
				<EnforcementList assignmentId={assignmentId} user={user} />
				<FileList assignmentId={assignmentId} user={user} />
				<Inquiry assignmentId={assignmentId} user={user} />
			</div>
		</div>
	);
};

export default AssignmentPage;

