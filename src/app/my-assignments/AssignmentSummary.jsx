"use client";

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Text } from "@radix-ui/themes";
import { useUser } from "@/hooks/useUser";
import AssignmentsTable from "@/components/Assignment/AssignmentsTable";
import AssignmentsOverview from "@/components/Assignment/AssignmentsOverview";
import FilterBar from "@/components/Assignment/FilterBar";

export default function AssignmentSummary({ clientId }) {
	const [assignments, setAssignments] = useState([]);
	const [filteredAssignments, setFilteredAssignments] = useState([]);
	const [loading, setLoading] = useState(true);
	const { user } = useUser();
	const isAdmin = user?.role === "admin" || user?.role === "staff";

	useEffect(() => {
		if (clientId) {
			fetchAssignments();
		}
	}, [clientId]);

	const fetchAssignments = async () => {
		setLoading(true);

		try {
			// ✅ 1) 개인 사건 조회
			const { data: personalAssignments, error: personalError } = await supabase
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
          enforcements ( id, status, amount, type )
        `)
				.eq("assignment_clients.client_id", clientId);

			if (personalError) throw personalError;

			// ✅ 2) 그룹 사건 조회
			const { data: groupMembers, error: groupMemberError } = await supabase
				.from("group_members")
				.select("group_id")
				.eq("user_id", clientId);

			if (groupMemberError) throw groupMemberError;

			const groupIds = (groupMembers ?? []).map((g) => g.group_id);

			let formattedGroupAssignments = [];
			if (groupIds.length > 0) {
				const { data: groupAssignments, error: groupError } = await supabase
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
            assignment_groups!inner(group_id, groups(name)),
            assignment_debtors ( id, name, phone_number ),
            assignment_timelines ( description ),
            bonds (
              id, principal, interest_1_rate, interest_1_start_date, interest_1_end_date,
              interest_2_rate, interest_2_start_date, interest_2_end_date, expenses
            ),
            enforcements ( id, status, amount, type )
          `)
					.in("assignment_groups.group_id", groupIds);

				if (groupError) throw groupError;

				// 그룹 사건 데이터 가공
				formattedGroupAssignments = (groupAssignments ?? []).map((assignment) => ({
					...assignment,
					type: "그룹",
					name: assignment.assignment_groups?.groups?.name || "알 수 없는 그룹",
				}));
			}

			// ✅ 3) 개인 + 그룹 사건 합치기
			const formattedPersonalAssignments = (personalAssignments ?? []).map((assignment) => ({
				...assignment,
				type: "개인",
				name: assignment.assignment_clients?.users?.name || "알 수 없는 사용자",
			}));

			const all = [...formattedPersonalAssignments, ...formattedGroupAssignments];
			setAssignments(all);
			setFilteredAssignments(all); // 초기에는 전체
		} catch (error) {
			console.error("의뢰 정보 불러오기 오류:", error);
		}

		setLoading(false);
	};

	if (loading) {
		return <Text>로딩 중...</Text>;
	}

	return (
		<Box className="w-full py-4">
			{/* (1) 의뢰 요약 섹션 */}
			<AssignmentsOverview assignments={assignments} />

			{/* (2) 검색/필터 바 */}
			<FilterBar assignments={assignments} setFilteredAssignments={setFilteredAssignments} />

			{/* (3) 테이블 */}
			<AssignmentsTable assignments={filteredAssignments} isAdmin={isAdmin} />
		</Box>
	);
}

