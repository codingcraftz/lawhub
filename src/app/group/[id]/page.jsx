"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@radix-ui/react-icons";
import { supabase } from "@/utils/supabase";
import Link from "next/link";
import CardList from "@/app/client/_components/CardList";
import DebtorCard from "@/app/client/_components/DebtorCard";
import useRoleRedirect from "@/hooks/userRoleRedirect";

const GroupCasePage = () => {
	useRoleRedirect(["staff", "admin", "client"], "/");
	const router = useRouter();
	const { id: groupId } = useParams();
	const [groupName, setGroupName] = useState("");
	const [assignments, setAssignments] = useState([]);

	const fetchAssignments = async () => {
		try {
			const { data, error } = await supabase
				.from("assignments")
				.select(`
          id,
          description,
          created_at,
          assignment_debtors!left (name),
          assignment_creditors!left (name),
          assignment_groups!inner (group_id, type)
        `)
				.eq("assignment_groups.group_id", groupId);

			if (error) {
				console.error("Error fetching assignments:", error);
				return;
			}

			setAssignments(data || []);
		} catch (err) {
			console.error("Unexpected error:", err);
		}
	};

	const fetchGroup = useCallback(async () => {
		if (!groupId) return;
		const { data: groupData, error } = await supabase
			.from("groups")
			.select("name")
			.eq("id", groupId)
			.single();

		if (error || !groupData) {
			console.log("그룹 정보를 불러오는데 실패했습니다.");
		} else {
			setGroupName(groupData.name);
		}
	}, [groupId]);

	useEffect(() => {
		fetchAssignments();
		fetchGroup();
	}, [groupId]);

	return (
		<div className="py-4 w-full">
			<header className="flex justify-between items-center mb-4">
				<div className="flex items-center gap-2">
					<ArrowLeftIcon
						className="w-8 h-8 cursor-pointer"
						onClick={() => router.back()}
					/>
					<h1 className="text-2xl font-bold">{groupName} 의뢰 목록</h1>
				</div>
			</header>
			<main>
				<CardList>
					{assignments.map((assignment) => (
						<Link
							key={assignment.id}
							href={`/client/assignment/${assignment.id}`}
						>
							<DebtorCard
								name={groupName}
								type={groupName}
								clientType={assignment.assignment_groups[0].type}
								description={assignment.description}
								createdAt={assignment.created_at}
								debtors={assignment.assignment_debtors?.map(
									(debtor) => debtor?.name
								)}
								creditors={assignment.assignment_creditors?.map(
									(creditor) => creditor?.name
								)}
							/>
						</Link>
					))}
				</CardList>
			</main>
		</div>
	);
};

export default GroupCasePage;

