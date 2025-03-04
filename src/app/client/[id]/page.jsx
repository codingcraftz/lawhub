"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@radix-ui/react-icons";
import { supabase } from "@/utils/supabase";
import useRoleRedirect from "@/hooks/userRoleRedirect";
import { Box, Text } from "@radix-ui/themes";
import AssignmentsOverview from "@/components/Assignment/AssignmentsOverview";
import FilterBar from "@/components/Assignment/FilterBar";
import AssignmentsTable from "@/components/Assignment/AssignmentsTable";

const ClientCasePage = () => {
	const router = useRouter();
	const { id: clientId } = useParams();
	const [clientName, setClientName] = useState("");
	const [assignments, setAssignments] = useState([]);
	const [filteredAssignments, setFilteredAssignments] = useState([]);
	useRoleRedirect(["staff", "admin", "client"], [], "/");

	// 의뢰인 이름 불러오기
	const fetchUser = useCallback(async () => {
		if (!clientId) return;
		const { data: clientData, error } = await supabase
			.from("users")
			.select("name")
			.eq("id", clientId)
			.single();

		if (error || !clientData) {
			console.log("의뢰인 정보를 불러오는데 실패했습니다.");
		} else {
			setClientName(clientData.name);
		}
	}, [clientId]);

	// 의뢰 목록 불러오기
	const fetchAssignments = async () => {
		if (!clientId) return;

		const { data, error } = await supabase
			.from("assignments")
			.select(`
				id,
				description,
				status,
				created_at,
				civil_litigation_status,
				asset_declaration_status,
				creditor_attachment_status,
				assignment_creditors ( name ),
				assignment_clients!inner(client_id, users(name)),
				assignment_debtors ( id, name, phone_number ),
				assignment_timelines ( description ),
				bonds (
					id, principal, interest_1_rate, interest_1_start_date, interest_1_end_date,
					interest_2_rate, interest_2_start_date, interest_2_end_date, expenses
				),
				cases ( id, court_name, case_number, case_subject, status ),
				enforcements ( id, status, amount, type )
			`)
			.eq("assignment_clients.client_id", clientId);

		if (error) {
			console.error("Error fetching assignments:", error);
			return;
		}

		setAssignments(data);
		setFilteredAssignments(data);
	};

	useEffect(() => {
		fetchUser();
		fetchAssignments();
	}, [clientId]);

	return (
		<Box className="w-full py-4 px-4 sm:px-6 md:px-12">
			<header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
				<div className="flex items-center gap-2">
					<ArrowLeftIcon className="w-8 h-8 cursor-pointer" onClick={() => router.back()} />
					<h1 className="text-2xl font-bold">{clientName}님의 의뢰 목록</h1>
				</div>
			</header>

			{/* (1) 의뢰 개요 */}
			<AssignmentsOverview assignments={assignments} />

			{/* (2) 필터 바 */}
			<FilterBar assignments={assignments} setFilteredAssignments={setFilteredAssignments} />

			{/* (3) 의뢰 테이블 */}
			<AssignmentsTable assignments={filteredAssignments} isAdmin={true} />
		</Box>
	);
};

export default ClientCasePage;

