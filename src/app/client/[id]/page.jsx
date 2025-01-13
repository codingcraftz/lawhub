// src/app/client/[id]/page.jsx

"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@radix-ui/react-icons";
import { supabase } from "@/utils/supabase";
import DebtorCard from "../_components/DebtorCard";
import Link from "next/link";
import CardList from "../_components/CardList";

const ClientCasePage = () => {
	const router = useRouter();
	const { id: clientId } = useParams();
	const [clientName, setClientName] = useState("");
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
        assignment_clients!inner (client_id, type)
      `)
				.eq("assignment_clients.client_id", clientId);

			if (error) {
				console.error("Error fetching assignments:", error);
				return;
			}

			console.log("Fetched assignments:", data);
			setAssignments(data || []);
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
		<div className="py-4 w-full">
			<header className="flex justify-between items-center mb-4">
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
						<Link
							key={assignment.id}
							href={`/client/assignment/${assignment.id}`}
						>
							<DebtorCard
								description={assignment.description}
								name={clientName}
								clientType={assignment.assignment_clients[0].type}
								createdAt={assignment.created_at}
								debtors={assignment.assignment_debtors?.map(
									(debtor) => debtor?.name,
								)}
								creditors={assignment.assignment_creditors?.map(
									(creditor) => creditor?.name,
								)}

							/>
						</Link>
					))}
				</CardList>
			</main>
		</div>
	);
};

export default ClientCasePage;
