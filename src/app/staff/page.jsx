"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { useRouter } from "next/navigation";
import { Box, Flex, Text } from "@radix-ui/themes";
import DebtorCard from "@/app/client/_components/DebtorCard";
import CardList from "@/app/client/_components/CardList";
import useRoleRedirect from "@/hooks/userRoleRedirect";
import { useUser } from "@/hooks/useUser";

const StaffAssignmentsPage = () => {
	useRoleRedirect(["staff", "admin"], "/"); // Only staff can access this page

	const router = useRouter();
	const { user } = useUser();
	const [assignments, setAssignments] = useState([]);
	const [loading, setLoading] = useState(true);

	// Fetch assignments assigned to the logged-in staff user
	const fetchAssignments = async () => {
		setLoading(true);

		try {
			const { data, error } = await supabase
				.from("assignment_assignees")
				.select(`
          assignment_id,
          role,
          assignments (
            id,
            description,
            created_at,
            status,
            assignment_debtors!left (name),
						assignment_assignees!left (user_id, users(name)),
            assignment_creditors!left (name),
						assignment_clients!left (client_id, users(name))
          )
        `)
				.eq("user_id", user.id);

			if (error) {
				console.error("Error fetching assignments:", error);
				return;
			}

			// Flatten assignments and exclude null entries
			const validAssignments = (data || [])
				.map((item) => item.assignments)
				.filter(Boolean);

			// Sort by ongoing first, then by creation date
			const sortedAssignments = validAssignments.sort((a, b) => {
				const statusOrder = a.status === "ongoing" ? 0 : 1;
				const otherStatusOrder = b.status === "ongoing" ? 0 : 1;

				if (statusOrder !== otherStatusOrder) {
					return statusOrder - otherStatusOrder;
				}
				return new Date(a.created_at) - new Date(b.created_at);
			});

			setAssignments(sortedAssignments);
		} catch (err) {
			console.error("Unexpected error fetching assignments:", err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (user) fetchAssignments();
	}, [user]);

	console.log(assignments)

	return (
		<div className="py-4 w-full px-4 sm:px-6 md:px-12">
			<header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
				<div className="flex items-center gap-2">
					<h1 className="text-2xl font-bold">할당된 사건 목록</h1>
				</div>
			</header>

			<main>
				{loading ? (
					<Text size="4">로딩 중...</Text>
				) : assignments.length === 0 ? (
					<Text size="4">할당된 사건이 없습니다.</Text>
				) : (
					<CardList>
						{assignments.map((assignment) => (
							<div
								key={assignment.id}
								onClick={() => router.push(`/client/assignment/${assignment.id}`)}
							>
								<DebtorCard
									name={assignment.assignment_clients?.map(d => d?.users?.name)}
									type="개인"
									description={assignment.description}
									createdAt={assignment.created_at}
									assignees={assignment.assignment_assignees.map((d) => d?.users?.name)}
									debtors={assignment.assignment_debtors?.map((debtor) => debtor.name)}
									creditors={assignment.assignment_creditors?.map((creditor) => creditor.name)}
									status={assignment.status}
								/>
							</div>
						))}
					</CardList>
				)}
			</main>
		</div>
	);
};

export default StaffAssignmentsPage;

