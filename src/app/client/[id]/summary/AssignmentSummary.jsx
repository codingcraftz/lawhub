"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { useParams } from "next/navigation";
import { Box, Text } from "@radix-ui/themes";
import AssignmentsTable from "@/components/Assignment/AssignmentsTable";
import { useUser } from "@/hooks/useUser";


export default function AssignmentSummary() {
	const { id: clientId } = useParams();
	const [assignments, setAssignments] = useState([]);
	const [loading, setLoading] = useState(true);
	const { user } = useUser()
	const isAdmin = user?.role === "admin" || user?.role === "staff"





	useEffect(() => {
		if (clientId) {
			fetchAssignments();
		}
	}, [clientId]);

	const fetchAssignments = async () => {
		setLoading(true);

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
        assignment_clients!inner(client_id),
        assignment_debtors ( id, name, phone_number ),
        assignment_timelines ( description ),
        bonds (
          id,
          principal,
          interest_1_rate,
          interest_1_start_date,
          interest_1_end_date,
          interest_2_rate,
          interest_2_start_date,
          interest_2_end_date,
          expenses
        ),
        enforcements ( id, status, amount, type )
      `)
			.eq("assignment_clients.client_id", clientId);

		if (error) {
			console.error("의뢰 정보 불러오기 오류:", error);
		} else {
			setAssignments(data || []);
		}
		setLoading(false);
	};

	if (loading) {
		return <Text>로딩 중...</Text>;
	}

	return (
		<Box className="w-full py-4">
			<AssignmentsTable assignments={assignments} isAdmin={isAdmin} />
		</Box>
	);
}

