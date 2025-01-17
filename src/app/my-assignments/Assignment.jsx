"use client";

import React, { useCallback, useEffect, useState } from "react";
import { ArrowLeftIcon } from "@radix-ui/react-icons";
import { supabase } from "@/utils/supabase";
import Link from "next/link";
import DebtorCard from "../client/_components/DebtorCard";
import CardList from "../client/_components/CardList";
import { useRouter } from "next/navigation";

const Assignment = ({ clientId }) => {
	const [clientName, setClientName] = useState("");
	const [individualAssignments, setIndividualAssignments] = useState([]);
	const [groupAssignments, setGroupAssignments] = useState([]);
	const router = useRouter();
	const hasAssignments = individualAssignments.length > 0 || groupAssignments.length > 0

	const fetchAssignments = async () => {
		try {
			const { data: myGroups, error: groupError } = await supabase
				.from("group_members")
				.select("group_id")
				.eq("user_id", clientId);

			if (groupError) {
				console.error("Error fetching user's groups:", groupError);
				return;
			}
			const groupIds = (myGroups ?? []).map((g) => g.group_id);

			const { data: directAssignments, error: directError } = await supabase
				.from("assignments")
				.select(`
        id,
        description,
        created_at,
				status,
        assignment_debtors ( name ),
        assignment_creditors ( name ),
        assignment_clients!inner ( client_id )
      `)
				.eq("assignment_clients.client_id", clientId);

			if (directError) {
				console.error("Error fetching direct assignments:", directError);
			}
			setIndividualAssignments(directAssignments ?? []);

			// 그룹 assignments 조회
			if (groupIds.length > 0) {
				const { data: groupData, error: groupAssignError } = await supabase
					.from("assignments")
					.select(`
          id,
          description,
          created_at,
          assignment_debtors ( name ),
          assignment_creditors ( name ),
          assignment_groups!inner ( group_id )
        `)
					.in("assignment_groups.group_id", groupIds);

				if (groupAssignError) {
					console.error("Error fetching group assignments:", groupAssignError);
				}

				// 그룹 이름 조회
				const { data: groupNames, error: groupNameError } = await supabase
					.from("groups")
					.select("id, name")
					.in("id", groupIds);

				if (groupNameError) {
					console.error("Error fetching group names:", groupNameError);
				}

				// 그룹 이름 매핑
				const groupNameMap = (groupNames ?? []).reduce((acc, group) => {
					acc[group.id] = group.name;
					return acc;
				}, {});

				console.log(groupNameMap)
				// 그룹 이름 추가
				const enrichedGroupAssignments = (groupData ?? []).map((assignment) => ({
					...assignment,
					group_name: groupNameMap[assignment.assignment_groups[0].group_id] || "알 수 없는 그룹",
				}));

				setGroupAssignments(enrichedGroupAssignments);
			}
		} catch (err) {
			console.error("Unexpected error:", err);
		}
	};

	const fetchUser = useCallback(async () => {
		if (!clientId) return;

		const { data: clientData, error } = await supabase
			.from("users")
			.select("name")
			.eq("id", clientId)
			.single();

		if (error || !clientData) {
			console.log("의뢰인 정보를 불러오는데 실패했습니다.", error);
		} else {
			setClientName(clientData.name);
		}
	}, [clientId]);

	useEffect(() => {
		fetchUser();
		fetchAssignments();
	}, [clientId, fetchUser]);

	if (!hasAssignments) return <div><p>등록된 의뢰가 없습니다.</p></div>
	console.log(individualAssignments)
	console.log(groupAssignments)
	return (
		<div className="py-4 w-full px-4 sm:px-6 md:px-12">
			<header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
				<div className="flex items-center gap-2">
					<ArrowLeftIcon
						className="w-8 h-8 cursor-pointer"
						onClick={() => router.back()}
					/>
					<h1 className="text-2xl font-bold">{clientName}님의 사건 관리</h1>
				</div>
			</header>

			<main>
				<CardList>
					{individualAssignments.map((assignment) => (
						<Link
							key={assignment.id}
							href={`/client/assignment/${assignment.id}`}
						>
							<DebtorCard
								type="개인"
								status={assignment.status}
								name={assignment.assignment_clients[0].name}
								description={assignment.description}
								createdAt={assignment.created_at}
								debtors={assignment.assignment_debtors?.map((debtor) => debtor.name)}
								creditors={assignment.assignment_creditors?.map((creditor) => creditor.name)}
							/>
						</Link>
					))}
					{groupAssignments.map((assignment) => (
						<Link
							key={assignment.id}
							href={`/client/assignment/${assignment.id}`}
						>
							<DebtorCard
								type="그룹"
								status={assignment.status}
								name={assignment.assignment_groups[0].name}
								description={assignment.description}
								createdAt={assignment.created_at}
								debtors={assignment.assignment_debtors?.map((debtor) => debtor.name)}
								creditors={assignment.assignment_creditors?.map((creditor) => creditor.name)}
							/>
						</Link>
					))}
				</CardList>
			</main>
		</div>
	);
};

export default Assignment;



