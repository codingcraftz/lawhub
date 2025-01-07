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
	useRoleRedirect(["staff", "admin"], "/login");

	const [clients, setClients] = useState([]);
	const [filteredClients, setFilteredClients] = useState([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [searchQuery, setSearchQuery] = useState("");
	const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false);
	const [showOngoingOnly, setShowOngoingOnly] = useState(false);

	const router = useRouter();
	const { user } = useUser();

	const fetchClientsWithCaseCount = async () => {
		if (user?.role && user?.id) {
			// 모든 의뢰인 가져오기
			const { data: allClients, error: allClientsError } = await supabase
				.from("users")
				.select("id, name")
				.eq("role", "client");

			if (allClientsError) {
				console.error("Error fetching all clients:", allClientsError);
				return [];
			}

			// 진행 중 사건 수 가져오기
			const { data: assignments, error: assignmentsError } = await supabase
				.from("assignment_clients")
				.select(
					`
        client_id,
        assignments(status)
      `,
				)
				.eq("assignments.status", "ongoing");

			if (assignmentsError) {
				console.error("Error fetching assignments:", assignmentsError);
				return [];
			}

			// 진행 중 사건 수 계산
			const clientCaseCounts = assignments.reduce((acc, item) => {
				if (!acc[item.client_id]) {
					acc[item.client_id] = 0;
				}
				acc[item.client_id]++;
				return acc;
			}, {});

			// 모든 의뢰인 데이터에 진행 중 사건 수 추가
			const allClientsWithCounts = allClients.map((client) => ({
				id: client.id,
				name: client.name,
				ongoing_case_count: clientCaseCounts[client.id] || 0,
			}));

			setClients(allClientsWithCounts);
		}
	};

	useEffect(() => {
		fetchClientsWithCaseCount();
	}, [user]);

	// 현재 페이지에 해당하는 데이터 계산
	useEffect(() => {
		const ongoingFilteredClients = showOngoingOnly
			? clients.filter((client) => client.ongoing_case_count > 0)
			: clients;

		const searchFilteredClients = ongoingFilteredClients.filter((client) =>
			client.name.toLowerCase().includes(searchQuery.toLowerCase()),
		);

		const startIndex = (currentPage - 1) * PAGE_SIZE;
		const endIndex = startIndex + PAGE_SIZE;
		setFilteredClients(searchFilteredClients.slice(startIndex, endIndex));

		// 총 페이지 수 계산
		setTotalPages(Math.ceil(searchFilteredClients.length / PAGE_SIZE));
	}, [clients, currentPage, showOngoingOnly, searchQuery]);

	const handlePageChange = (page) => {
		setCurrentPage(page);
	};

	const handleCaseSuccess = () => {
		setIsNewCaseModalOpen(false);
		fetchClientsWithCaseCount();
	};

	return (
		<Box className="py-4 w-full">
			<Flex direction="column" gap="4">
				<header className="flex justify-between items-center">
					<Text size="5" weight="bold">
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
							className="cursor-pointer p-4 shadow-sm"
							onClick={() => router.push(`/client/${client.id}`)}
						>
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
