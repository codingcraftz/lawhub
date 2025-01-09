"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import DebtorInfo from "./DebtorInfo";
import CreditorInfo from "./CreditorInfo";
import BondDetails from "./BondDetails";
import CaseList from "./CaseList";
import EnforcementList from "./EnforcementList";
import AssignmentTimelines from "./AssignmentTiemlines";

const AssignmentPage = () => {
	const { id: assignmentId } = useParams();
	const { user } = useUser();

	return (
		<div className="p-4 max-w-5xl mx-auto flex flex-col w-full">
			<h1 className="text-2xl font-bold mb-6">의뢰 페이지</h1>
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
			</div>
		</div>
	);
};

export default AssignmentPage;

