"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import DebtorInfo from "./DebtorInfo";
import CreditorInfo from "./CreditorInfo";
import BondDetails from "./BondDetails";
import CaseList from "./CaseList";
import EnforcementList from "./EnforcementList";
import AssignmentTimelines from "./AssignmentTiemlines";
import Inquiry from "./Inquiry";
import { ArrowLeftIcon } from "@radix-ui/react-icons";

const AssignmentPage = () => {
	const { id: assignmentId } = useParams();
	const { user } = useUser();
	const [assignment, setAssignment] = useState();
	const router = useRouter();

	const fetchAssignments = async () => {
		const { data, error } = await supabase
			.from("assignments")
			.select("*")
			.eq("id", assignmentId)
			.single()

		if (!error && data) {
			setAssignment(data)

		} else {
			console.error("Failed to fetch timelines:", error);
		}
	};

	useEffect(() => {
		fetchAssignments();
	}, [assignmentId]);


	return (
		<div className="p-4 max-w-5xl mx-auto flex flex-col w-full">
			<div className="flex justify-start">
				<ArrowLeftIcon
					className="w-8 h-8 cursor-pointer mr-3"
					onClick={() => router.back()}
				/>
				<h1 className="text-2xl font-bold">의뢰 페이지</h1>
			</div>
			<div className="p-2 text-gray-10">
				<p>{assignment?.description}</p>
			</div>
			<AssignmentTimelines assignmentId={assignmentId} user={user} />
			<div className="grid grid-cols-2 gap-4">
				<CreditorInfo assignmentId={assignmentId} user={user} />
				{/* 채무자 정보 */}
				<DebtorInfo assignmentId={assignmentId} user={user} />

				{/* 채권 정보 */}
				<BondDetails assignmentId={assignmentId} user={user} />

				{/* 소송 목록 */}
				<CaseList assignmentId={assignmentId} user={user} />

				{/* 강제집행 목록 */}
				<EnforcementList assignmentId={assignmentId} user={user} />

				<Inquiry assignmentId={assignmentId} user={user} />
			</div>
		</div>
	);
};

export default AssignmentPage;

