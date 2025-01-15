"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { useRouter } from "next/navigation";
import { Box, Flex, Text, Card, Button, Switch } from "@radix-ui/themes";
import { useUser } from "@/hooks/useUser";
import Pagination from "@/components/Pagination";
import AssignmentForm from "@/components/AssignmentForm";
import useRoleRedirect from "@/hooks/userRoleRedirect";

const PAGE_SIZE = 12;

const ClientManagementPage = () => {
	useRoleRedirect(["staff", "admin"], "/");

	const [clients, setClients] = useState([]);
	const [filteredClients, setFilteredClients] = useState([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [searchQuery, setSearchQuery] = useState("");
	const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false);
	const [showOngoingOnly, setShowOngoingOnly] = useState(true);

	const router = useRouter();
	const { user } = useUser();

	// 1) Fetch all clients + all groups
	// 2) Then fetch assignment_clients + assignment_groups (no status filter)
	//    We'll see status in the sub-relation, and count how many are "ongoing"
	const fetchClientsAndGroups = async () => {
		try {
			// (A) All users with role=client
			const { data: allClients, error: clientsError } = await supabase
				.from("users")
				.select("id, name, role")
				.eq("role", "client");

			if (clientsError) throw clientsError;

			// (B) All groups
			const { data: allGroups, error: groupsError } = await supabase
				.from("groups")
				.select("id, name");

			if (groupsError) throw groupsError;

			// (C) assignment_clients with sub-relation for the assignments' status
			//  .select("client_id, assignments!inner(status)")
			// means we fetch all relations, no filter on status
			const { data: clientAssignments, error: clientAssignmentsError } = await supabase
				.from("assignment_clients")
				.select("client_id, assignments(status)");

			if (clientAssignmentsError) throw clientAssignmentsError;

			// (D) assignment_groups with sub-relation
			const { data: groupAssignments, error: groupAssignmentsError } = await supabase
				.from("assignment_groups")
				.select("group_id, assignments(status)");

			if (groupAssignmentsError) throw groupAssignmentsError;

			// Now let's count how many ongoing assignments each client/group has
			// We'll do an object: ongoingCaseCounts[client_id] = number
			const clientCaseCounts = clientAssignments.reduce((acc, item) => {
				// item.assignments is an array or single object if 1:1
				// But in Supabase, .select("client_id, assignments(status)") typically
				// returns 'assignments' as an array if there's a 1..n relation
				// or a single object if there's a 1..1. 
				// We must handle carefully:
				const assignmentStatus = item.assignments?.status;
				if (assignmentStatus === "ongoing") {
					acc[item.client_id] = (acc[item.client_id] || 0) + 1;
				}
				return acc;
			}, {});

			const groupCaseCounts = groupAssignments.reduce((acc, item) => {
				const assignmentStatus = item.assignments?.status;
				if (assignmentStatus === "ongoing") {
					acc[item.group_id] = (acc[item.group_id] || 0) + 1;
				}
				return acc;
			}, {});

			// Build final arrays
			const clientsWithCounts = allClients.map((c) => ({
				id: c.id,
				name: c.name,
				type: "client",
				ongoing_case_count: clientCaseCounts[c.id] || 0,
			}));

			const groupsWithCounts = allGroups.map((g) => ({
				id: g.id,
				name: g.name,
				type: "group",
				ongoing_case_count: groupCaseCounts[g.id] || 0,
			}));

			const combinedData = [...clientsWithCounts, ...groupsWithCounts];
			setClients(combinedData);
		} catch (error) {
			console.error("Error fetching clients and groups:", error);
		}
	};

	useEffect(() => {
		if (user) {
			fetchClientsAndGroups();
		}
	}, [user]);

	// Re-filter whenever "clients" or toggles/pagination change
	useEffect(() => {
		// (1) If showOngoingOnly, we filter out items with ongoing_case_count===0
		const ongoingFiltered = showOngoingOnly
			? clients.filter((item) => item.ongoing_case_count > 0)
			: clients;

		// (2) Search filter by name
		const searchFiltered = ongoingFiltered.filter((item) =>
			item.name.toLowerCase().includes(searchQuery.toLowerCase())
		);

		// (3) Pagination
		const startIndex = (currentPage - 1) * PAGE_SIZE;
		const endIndex = startIndex + PAGE_SIZE;

		setFilteredClients(searchFiltered.slice(startIndex, endIndex));
		setTotalPages(Math.ceil(searchFiltered.length / PAGE_SIZE));
	}, [clients, currentPage, showOngoingOnly, searchQuery]);

	const handlePageChange = (page) => {
		setCurrentPage(page);
	};

	const handleCaseSuccess = () => {
		setIsNewCaseModalOpen(false);
		// Re-fetch to reflect newly added assignment
		fetchClientsAndGroups();
	};

	return (
		<Box className="py-4 w-full">
			<Flex direction="column" gap="4">
				{/* Header */}
				<header className="flex justify-between items-center">
					<Text className="text-2xl font-bold">의뢰인 목록</Text>
					<Button color="green" onClick={() => setIsNewCaseModalOpen(true)}>
						새 의뢰 등록
					</Button>
				</header>

				{/* Search + Toggle */}
				<Flex align="center" justify="between">
					<input
						className="rounded-lg"
						type="text"
						placeholder="이름으로 검색"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						style={{
							padding: "0.5rem 1rem",
							border: "1px solid var(--gray-6)",
						}}
					/>
					<Flex align="center" gap="2">
						<Text size="3">진행 중 사건만 보기</Text>
						<Switch
							checked={showOngoingOnly}
							onCheckedChange={(checked) => {
								setShowOngoingOnly(checked);
								setCurrentPage(1);
							}}
						/>
					</Flex>
				</Flex>

				{/* List */}
				<Flex className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{filteredClients.map((item) => (
						<div
							key={item.id}
							className="
                cursor-pointer p-4 shadow-sm 
                flex flex-col border border-gray-6 rounded
              "
							onClick={() =>
								router.push(
									item.type === "client"
										? `/client/${item.id}` // 개인 클라이언트 경로
										: `/group/${item.id}`  // 단체 클라이언트 경로
								)
							}
						>
							<Flex gap="2">
								<Text size="2" color={item.type === "client" ? "blue" : "green"}>
									{item.type === "client" ? "[개인]" : "[단체]"}
								</Text>
								<Text className="mr-3" size="4" weight="bold">
									{item.name}
								</Text>
							</Flex>
							<Text size="3" color="gray">
								진행 중 사건: {item.ongoing_case_count}건
							</Text>
						</div>
					))}
				</Flex>

				{/* Pagination */}
				{totalPages > 1 && (
					<Pagination
						currentPage={currentPage}
						totalPages={totalPages}
						onPageChange={handlePageChange}
					/>
				)}
			</Flex>

			{/* 의뢰 등록 폼 (모달) */}
			<AssignmentForm
				open={isNewCaseModalOpen}
				onOpenChange={setIsNewCaseModalOpen}
				onSuccess={handleCaseSuccess}
			/>
		</Box>
	);
};

export default ClientManagementPage;

