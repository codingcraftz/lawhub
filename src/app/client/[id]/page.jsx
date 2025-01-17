"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@radix-ui/react-icons";
import { supabase } from "@/utils/supabase";
import DebtorCard from "../_components/DebtorCard";
import Link from "next/link";
import CardList from "../_components/CardList";
import useRoleRedirect from "@/hooks/userRoleRedirect";

const ClientCasePage = () => {
	const router = useRouter();
	const { id: clientId } = useParams();
	const [clientName, setClientName] = useState("");
	const [assignments, setAssignments] = useState([]);
	useRoleRedirect(["staff", "admin", "client"], [], "/");

	const fetchAssignments = async () => {
		try {
			const { data, error } = await supabase
				.from("assignments")
				.select(`
          id,
          description,
          created_at,
          status,
          assignment_debtors!left (name),
          assignment_creditors!left (name),
					assignment_assignees!left (user_id, users(name)),
          assignment_clients!inner (client_id, type)
        `)
				.eq("assignment_clients.client_id", clientId);

			if (error) {
				console.error("Error fetching assignments:", error);
				return;
			}

			const sorted = (data || []).sort((a, b) => {
				const orderA = a.status === "ongoing" ? 0 : 1;
				const orderB = b.status === "ongoing" ? 0 : 1;
				if (orderA !== orderB) {
					return orderA - orderB;
				}
				return new Date(a.created_at) - new Date(b.created_at);
			});

			setAssignments(sorted);
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
			console.log("의뢰인 정보를 불러오는데 실패했습니다.");
		} else {
			setClientName(clientData.name);
		}
	}, [clientId]);

	useEffect(() => {
		fetchAssignments();
		fetchUser();
	}, [clientId]);

	return (
		<div className="py-4 w-full px-4 sm:px-6 md:px-12">
			<header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
				<div className="flex items-center gap-2">
					<ArrowLeftIcon
						className="w-8 h-8 cursor-pointer"
						onClick={() => router.back()}
					/>
					<h1 className="text-2xl font-bold">{clientName}님의 의뢰 목록</h1>
				</div>
			</header>

			<main>
				<CardList>
					{assignments.map((assignment) => (
						<Link key={assignment.id} href={`/client/assignment/${assignment.id}`}>
							<DebtorCard
								description={assignment.description}
								name={clientName}
								createdAt={assignment.created_at}
								status={assignment.status}
								assignees={assignment.assignment_assignees.map((d) => d?.users?.name)}
								debtors={assignment.assignment_debtors?.map((d) => d?.name)}
								creditors={assignment.assignment_creditors?.map((c) => c?.name)}
							/>
						</Link>
					))}
				</CardList>
			</main>
		</div>
	);
};

export default ClientCasePage;

