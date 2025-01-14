// src/app/clients/page.jsx

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
	//useRoleRedirect(["staff", "admin"], "/login");

	const [clients, setClients] = useState([]);
	const [filteredClients, setFilteredClients] = useState([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [searchQuery, setSearchQuery] = useState("");
	const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false);
	const [showOngoingOnly, setShowOngoingOnly] = useState(true);

	const router = useRouter();
	const { user } = useUser();

	const fetchClientsAndGroups = async () => {
		try {
			// 개인 의뢰인 가져오기
			const { data: allClients, error: clientsError } = await supabase
				.from("users")
				.select("id, name, role")
				.eq("role", "client");

			if (clientsError) throw clientsError;

			// 그룹 가져오기
			const { data: allGroups, error: groupsError } = await supabase
				.from("groups")
				.select("id, name");

			if (groupsError) throw groupsError;

			// 개인 진행 중 사건 가져오기
			const { data: clientAssignments, error: clientAssignmentsError } = await supabase
				.from("assignment_clients")
				.select("client_id, assignments(status)")
				.eq("assignments.status", "ongoing");

			if (clientAssignmentsError) throw clientAssignmentsError;

			// 그룹 진행 중 사건 가져오기
			const { data: groupAssignments, error: groupAssignmentsError } = await supabase
				.from("assignment_groups")
				.select("group_id, assignments(status)")
				.eq("assignments.status", "ongoing");

			if (groupAssignmentsError) throw groupAssignmentsError;

			// 개인 진행 중 사건 수 계산
			const clientCaseCounts = clientAssignments.reduce((acc, item) => {
				acc[item.client_id] = (acc[item.client_id] || 0) + 1;
				return acc;
			}, {});

			// 그룹 진행 중 사건 수 계산
			const groupCaseCounts = groupAssignments.reduce((acc, item) => {
				acc[item.group_id] = (acc[item.group_id] || 0) + 1;
				return acc;
			}, {});

			// 개인 데이터에 진행 중 사건 수 추가
			const clientsWithCounts = allClients.map((client) => ({
				id: client.id,
				name: client.name,
				type: "client", // 데이터 구분용
				ongoing_case_count: clientCaseCounts[client.id] || 0,
			}));

			// 그룹 데이터에 진행 중 사건 수 추가
			const groupsWithCounts = allGroups.map((group) => ({
				id: group.id,
				name: group.name,
				type: "group", // 데이터 구분용
				ongoing_case_count: groupCaseCounts[group.id] || 0,
			}));

			// 개인과 그룹 데이터를 병합
			const combinedData = [...clientsWithCounts, ...groupsWithCounts];
			setClients(combinedData);
		} catch (error) {
			console.error("Error fetching clients and groups:", error);
		}
	};


	useEffect(() => {
		fetchClientsAndGroups();
	}, [user]);

	useEffect(() => {
		const ongoingFiltered = showOngoingOnly
			? clients.filter((item) => item.ongoing_case_count > 0)
			: clients;

		const searchFiltered = ongoingFiltered.filter((item) =>
			item.name.toLowerCase().includes(searchQuery.toLowerCase())
		);

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
		fetchClientsAndGroups();
	};

	return (
		<Box className="py-4 w-full">
			<Flex direction="column" gap="4">
				<header className="flex justify-between items-center">
					<Text className="text-2xl font-bold">
						의뢰인 목록
					</Text>
					<Button
						onClick={() => setIsNewCaseModalOpen(true)}
						color="green"
						className="px-4 py-2 text-white rounded-md"
					>
						새 의뢰 등록
					</Button>
				</header>
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
								setCurrentPage(1); // 페이지를 첫 번째로 초기화
							}}
						/>
					</Flex>
				</Flex>

				<Flex className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{filteredClients.map((client) => (
						<Card
							key={client.id}
							className="cursor-pointer p-4 shadow-sm flex items-center gap-1"
							onClick={() =>
								router.push(
									client.type === "client"
										? `/client/${client.id}` // 개인 클라이언트 경로
										: `/group/${client.id}` // 단체 클라이언트 경로
								)
							}
						>
							<Text size="2" color={client.type === "client" ? "blue" : "green"}>
								{client.type === "client" ? "[개인]" : "[단체]"}
							</Text>

							<Text className="mr-3" size="4" weight="bold">
								{client.name}
							</Text>
							<Text size="3" color="gray">
								진행 중 사건: {client.ongoing_case_count}건
							</Text>
						</Card>
					))}
				</Flex>

				{totalPages > 1 && (
					<Pagination
						currentPage={currentPage}
						totalPages={totalPages}
						onPageChange={handlePageChange}
					/>
				)}
			</Flex>

			<AssignmentForm
				open={isNewCaseModalOpen}
				onOpenChange={setIsNewCaseModalOpen}
				onSuccess={handleCaseSuccess}
			/>
		</Box>
	);
};

export default ClientManagementPage;

