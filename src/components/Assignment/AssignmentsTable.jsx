"use client";

import React, { useState, Fragment } from "react";
import { Table, Button, Text, Popover, Badge } from "@radix-ui/themes";
import Link from "next/link";
import BondDetail from "./BondDetail";
import EnforcementsDetail from "./EnforcementsDetail";
import Pagination from "@/components/Pagination";
import CombinedProceduresStatus from "./CombinedProceduresStatus"; // 새로 만든 컴포넌트 임포트
import FavoriteStar from "./FavoriteStar";
import { useUser } from "@/hooks/useUser";

const ITEMS_PER_PAGE = 8;

// 다수의 채권자/채무자를 툴팁으로 보여주는 예시
const NamesWithPopover = ({ names, label }) => {
	if (!names || names.length === 0) return "-";
	if (names.length === 1) return <Text>{names[0]}</Text>;

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
						<li key={index} className="text-sm">
							{name}
						</li>
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
	const {user} = useUser()

	// 페이지네이션
	const [currentPage, setCurrentPage] = useState(1);
	const totalItems = assignments.length;
	const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

	// 진행 상태에 따라 assignments 정렬
	const sortedAssignments = [...assignments].sort((a, b) => {
		// ongoing이 먼저, closed가 나중에
		if (a.status === "ongoing" && b.status === "closed") return -1;
		if (a.status === "closed" && b.status === "ongoing") return 1;
		// 같은 상태면 생성일 기준 내림차순
		return new Date(b.created_at) - new Date(a.created_at);
	});

	// 페이지네이션 로직 수정
	const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
	const endIndex = startIndex + ITEMS_PER_PAGE;
	const currentPageData = sortedAssignments.slice(startIndex, endIndex);

	return (
		<>
			<div className="w-full overflow-x-auto">
				<Table.Root className="min-w-[900px]">
					<Table.Header>
						<Table.Row>
							<Table.ColumnHeaderCell className="text-center">관심</Table.ColumnHeaderCell>
							<Table.ColumnHeaderCell className="text-center">상태</Table.ColumnHeaderCell>
							<Table.ColumnHeaderCell className="text-center">분류</Table.ColumnHeaderCell>
							<Table.ColumnHeaderCell className="text-center">채권자</Table.ColumnHeaderCell>
							<Table.ColumnHeaderCell className="text-center">채무자</Table.ColumnHeaderCell>
							<Table.ColumnHeaderCell className="text-center">현황</Table.ColumnHeaderCell>
							<Table.ColumnHeaderCell className="text-center">수임 원금</Table.ColumnHeaderCell>
							<Table.ColumnHeaderCell className="text-center">회수 금액</Table.ColumnHeaderCell>
							<Table.ColumnHeaderCell className="text-center">회수율</Table.ColumnHeaderCell>

							{/* 변경: 민사소송/재산명시/채권압류 3개 컬럼 제거하고, 하나로 통합 */}
							<Table.ColumnHeaderCell className="text-center">절차 진행</Table.ColumnHeaderCell>

							<Table.ColumnHeaderCell className="text-center">이동</Table.ColumnHeaderCell>
						</Table.Row>
					</Table.Header>

					<Table.Body>
						{currentPageData.map((assignment) => {
							const bond = assignment.bonds?.[0];
							const totalPrincipal = bond ? parseFloat(bond.principal ?? 0) : 0;
							const closedEnforcements =
								assignment.enforcements?.filter((enf) => enf.status === "closed") || [];
							const totalCollected = closedEnforcements.reduce(
								(sum, enf) => sum + parseFloat(enf.amount ?? 0),
								0
							);
							const collectionRate = totalPrincipal > 0 ? (totalCollected / totalPrincipal) * 100 : 0;
							const statusText =
								assignment.assignment_timelines?.[0]?.description || "진행 상황 없음";

							return (
								<Fragment key={assignment.id}>
									<Table.Row
										className={
											assignment.status === "closed" 
												? "bg-gray-3/50" // 완료된 사건은 배경색 다르게
												: ""
										}
									>
										<Table.Cell className="text-center whitespace-nowrap">
                      <FavoriteStar
                        assignmentId={assignment.id}
												userId={user?.id}    
                      />
                    </Table.Cell>
										{/* 상태 컬럼 */}
										<Table.Cell className="text-center whitespace-nowrap">
											<Badge color={assignment.status === "ongoing" ? "green" : "red"}>
												{assignment.status === "ongoing" ? "진행중" : "완료"}
											</Badge>
										</Table.Cell>

										{/* 분류 컬럼 */}
										<Table.Cell className="text-center whitespace-nowrap">
											<Badge color={assignment.type === "소송" ? "indigo" : "orange"}>
												{assignment.type === "소송" ? "소송" : "채권"}
											</Badge>
										</Table.Cell>

										{/* 채권자 */}
										<Table.Cell className="text-center whitespace-nowrap">
											<NamesWithPopover
												names={assignment.assignment_creditors?.map((c) => c.name)}
												label="채권자"
											/>
										</Table.Cell>

										{/* 채무자 */}
										<Table.Cell className="text-center whitespace-nowrap">
											<NamesWithPopover
												names={assignment.assignment_debtors?.map((d) => d.name)}
												label="채무자"
											/>
										</Table.Cell>

										{/* 현황 (assignment_timelines 첫 기록) */}
										<Table.Cell className="text-center whitespace-nowrap">
											{statusText === "진행 상황 없음" ? (
												<Text>{statusText}</Text>
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

										{/* 회수율 */}
										<Table.Cell className="text-center whitespace-nowrap">
											{Math.round(collectionRate)}%
										</Table.Cell>

										{/* 절차 진행 (민사소송 / 재산명시 / 채권압류 통합) */}
										<Table.Cell className="text-center whitespace-nowrap">
											<CombinedProceduresStatus
												assignmentId={assignment.id}
												civil_litigation_status={assignment.civil_litigation_status}
												asset_declaration_status={assignment.asset_declaration_status}
												creditor_attachment_status={assignment.creditor_attachment_status}
												isSosong={assignment.type ==="소송"}
												isAdmin={isAdmin}
											/>
										</Table.Cell>

										{/* 이동 버튼 */}
										<Table.Cell className="text-center whitespace-nowrap">
											<Link href={`/client/assignment/${assignment.id}`}>
												<Button variant="outline" size="2">
													이동
												</Button>
											</Link>
										</Table.Cell>
									</Table.Row>
								</Fragment>
							);
						})}
					</Table.Body>
				</Table.Root>
			</div>

			<div className="mt-4 text-sm text-gray-500">
				총 {sortedAssignments.length}건 중
				&nbsp;진행중: {sortedAssignments.filter((a) => a.status === "ongoing").length}건,
				&nbsp;완료: {sortedAssignments.filter((a) => a.status === "closed").length}건
			</div>

			<Pagination
				currentPage={currentPage}
				totalPages={totalPages}
				onPageChange={setCurrentPage}
				className="mt-6"
			/>
		</>
	);
}
