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
			.single();

		if (!error && data) {
			setAssignment(data);
		} else {
			console.error("Failed to fetch assignment:", error);
		}
	};

	useEffect(() => {
		fetchAssignments();
	}, [assignmentId]);

	return (
		<div className="p-4 max-w-5xl mx-auto flex flex-col w-full text-gray-12">
			<div className="flex items-center gap-2 mb-4">
				<ArrowLeftIcon
					className="w-8 h-8 cursor-pointer"
					onClick={() => router.back()}
				/>
				<h1 className="text-2xl font-bold">의뢰 페이지</h1>
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
				<Inquiry assignmentId={assignmentId} user={user} />
			</div>
		</div>
	);
};

export default AssignmentPage;

