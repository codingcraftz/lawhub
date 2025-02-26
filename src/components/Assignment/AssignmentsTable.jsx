"use client";

import React, { useState, Fragment } from "react";
import { Table, Button, Flex, Text, Popover } from "@radix-ui/themes";
import StatusSelector from "./StatusSelector";
import BondDetail from "./BondDetail";
import EnforcementsDetail from "./EnforcementsDetail";
import Link from "next/link";
import Pagination from "@/components/Pagination"; // ✅ 페이지네이션 컴포넌트 import

// 페이지당 표시할 항목 수
const ITEMS_PER_PAGE = 10;

/**
 * 다수의 채권자/채무자 처리 (Popover 활용)
 */
const NamesWithPopover = ({ names, label }) => {
	if (!names || names.length === 0) return "-";

	if (names.length === 1) {
		return <Text>{names[0]}</Text>;
	}

	const displayText = `${names[0]} 외 ${names.length - 1}인`;

	return (
		<Popover.Root>
			<Popover.Trigger asChild>
				<Button variant="ghost" color="sky" size="1" className="transition-colors">
					{displayText}
				</Button>
			</Popover.Trigger>
			<Popover.Content className="bg-white p-3 shadow-lg border border-gray-300 rounded-lg max-w-[220px]">
				<Text className="font-semibold text-sm">{label} 목록</Text>
				<ul className="mt-2 space-y-1">
					{names.map((name, index) => (
						<li key={index} className="text-sm">{name}</li>
					))}
				</ul>
			</Popover.Content>
		</Popover.Root>
	);
};

export default function AssignmentsTable({ assignments, isAdmin }) {
	const [selectedBond, setSelectedBond] = useState(null);
	const [selectedEnforcements, setSelectedEnforcements] = useState(null);
	const [selectedStatus, setSelectedStatus] = useState(null);

	// ✅ 페이지네이션 상태
	const [currentPage, setCurrentPage] = useState(1);

	// ✅ 한 페이지에 몇 건씩 보여줄지
	const totalItems = assignments.length;
	const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

	// ✅ 현재 페이지에 표시할 데이터
	const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
	const endIndex = startIndex + ITEMS_PER_PAGE;
	const currentPageData = assignments.slice(startIndex, endIndex);

	return (
		<>
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.ColumnHeaderCell className="text-center whitespace-nowrap">수임일</Table.ColumnHeaderCell>
						<Table.ColumnHeaderCell className="text-center whitespace-nowrap">채권자</Table.ColumnHeaderCell>
						<Table.ColumnHeaderCell className="text-center whitespace-nowrap">채무자</Table.ColumnHeaderCell>
						<Table.ColumnHeaderCell className="text-center whitespace-nowrap">현황</Table.ColumnHeaderCell>
						<Table.ColumnHeaderCell className="text-center whitespace-nowrap">수임 원금</Table.ColumnHeaderCell>
						<Table.ColumnHeaderCell className="text-center whitespace-nowrap">회수 금액</Table.ColumnHeaderCell>
						<Table.ColumnHeaderCell className="text-center whitespace-nowrap">회수율</Table.ColumnHeaderCell>
						<Table.ColumnHeaderCell className="text-center whitespace-nowrap">민사 소송</Table.ColumnHeaderCell>
						<Table.ColumnHeaderCell className="text-center whitespace-nowrap">재산 명시</Table.ColumnHeaderCell>
						<Table.ColumnHeaderCell className="text-center whitespace-nowrap">채권 압류</Table.ColumnHeaderCell>
						<Table.ColumnHeaderCell className="text-center whitespace-nowrap">의뢰 상세</Table.ColumnHeaderCell>
					</Table.Row>
				</Table.Header>

				<Table.Body>
					{currentPageData.map((assignment) => {
						const bond = assignment.bonds?.[0];
						const totalPrincipal = bond ? parseFloat(bond.principal ?? 0) : 0;

						const closedEnforcements = assignment.enforcements?.filter((enf) => enf.status === "closed") || [];
						const totalCollected = closedEnforcements.reduce((sum, enf) => sum + parseFloat(enf.amount ?? 0), 0);

						const collectionRate = totalPrincipal > 0 ? (totalCollected / totalPrincipal) * 100 : 0;
						const statusText = assignment.assignment_timelines?.[0]?.description || "진행 상황 없음";

						return (
							<Fragment key={assignment.id}>
								<Table.Row>
									<Table.Cell className="text-center whitespace-nowrap">
										{new Date(assignment.created_at).toLocaleDateString("ko-KR")}
									</Table.Cell>

									<Table.Cell className="text-center whitespace-nowrap">
										<NamesWithPopover
											names={assignment.assignment_creditors?.map((creditor) => creditor.name)}
											label="채권자"
										/>
									</Table.Cell>

									<Table.Cell className="text-center whitespace-nowrap">
										<NamesWithPopover
											names={assignment.assignment_debtors?.map((debtor) => debtor.name)}
											label="채무자"
										/>
									</Table.Cell>

									{/* 현황 칸 */}
									<Table.Cell className="text-center">
										{statusText === "진행 상황 없음" ? (
											<Text className="text-gray-500">{statusText}</Text>
										) : (
											<Popover.Root>
												<Popover.Trigger asChild>
													<Button
														variant="ghost"
														size="1"
														className="truncate max-w-[200px]"
														onClick={() => setSelectedStatus(statusText)}
													>
														{statusText.length > 15
															? `${statusText.substring(0, 15)}...`
															: statusText}
													</Button>
												</Popover.Trigger>
												<Popover.Content className="bg-white p-4 shadow-lg border border-gray-300 rounded-lg max-w-[300px]">
													<Text className="font-semibold text-sm">진행 현황</Text>
													<Text className="mt-2 text-sm">{selectedStatus}</Text>
												</Popover.Content>
											</Popover.Root>
										)}
									</Table.Cell>

									{/* 수임 원금 */}
									<Table.Cell className="text-center whitespace-nowrap">
										<div className="flex flex-col gap-2">
											{Math.round(totalPrincipal).toLocaleString("ko-KR")}원
											<Popover.Root>
												<Popover.Trigger asChild>
													<Button variant="ghost" size="1" onClick={() => setSelectedBond(bond)}>
														상세 보기
													</Button>
												</Popover.Trigger>
												<Popover.Content className="bg-white p-4 shadow-lg border border-gray-300 rounded-lg max-w-[800px] text-sm">
													<BondDetail bond={selectedBond} />
												</Popover.Content>
											</Popover.Root>
										</div>
									</Table.Cell>

									{/* 회수 금액 */}
									<Table.Cell className="text-center whitespace-nowrap">
										<div className="flex flex-col gap-2">
											{Math.round(totalCollected).toLocaleString("ko-KR")}원
											<Popover.Root>
												<Popover.Trigger asChild>
													<Button
														variant="ghost"
														size="1"
														onClick={() => setSelectedEnforcements(assignment.enforcements)}
													>
														상세 보기
													</Button>
												</Popover.Trigger>
												<Popover.Content className="bg-white p-4 shadow-lg border border-gray-300 rounded-lg max-w-[800px] text-sm">
													<EnforcementsDetail enforcements={selectedEnforcements} />
												</Popover.Content>
											</Popover.Root>
										</div>
									</Table.Cell>

									<Table.Cell className="text-center">{Math.round(collectionRate)}%</Table.Cell>

									<Table.Cell className="text-center">
										<StatusSelector
											assignmentId={assignment.id}
											field="civil_litigation_status"
											currentStatus={assignment.civil_litigation_status}
											isAdmin={isAdmin}
										/>
									</Table.Cell>

									<Table.Cell className="text-center">
										<StatusSelector
											assignmentId={assignment.id}
											field="asset_declaration_status"
											currentStatus={assignment.asset_declaration_status}
											isAdmin={isAdmin}
										/>
									</Table.Cell>

									<Table.Cell className="text-center">
										<StatusSelector
											assignmentId={assignment.id}
											field="creditor_attachment_status"
											currentStatus={assignment.creditor_attachment_status}
											isAdmin={isAdmin}
										/>
									</Table.Cell>

									<Table.Cell className="text-center whitespace-nowrap">
										<Link href={`/client/assignment/${assignment.id}`}>
											<Button variant="outline" size="2">이동</Button>
										</Link>
									</Table.Cell>
								</Table.Row>
							</Fragment>
						);
					})}
				</Table.Body>
			</Table.Root>

			{/* 
				✅ 페이지네이션
				Props:
				- currentPage: 현재 페이지
				- totalPages: 총 페이지 수
				- onPageChange: 페이지 변경 시 실행할 함수
			*/}
			<Pagination
				currentPage={currentPage}
				totalPages={totalPages}
				onPageChange={setCurrentPage}
			/>
		</>
	);
}

