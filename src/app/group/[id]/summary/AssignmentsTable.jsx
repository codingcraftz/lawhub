"use client";

import React, { useState, Fragment } from "react";
import { Table, Button, Flex, Text } from "@radix-ui/themes";
import * as Progress from "@radix-ui/react-progress";

import BondDetail from "./BondDetail";
import EnforcementsDetail from "./EnforcementDetails";
import StatusSelector from './StatusSelector'
import { calculateBondTotal } from "./bondUtils";
import { supabase } from "@/utils/supabase"; // DB 업데이트를 위해 추가
import Link from "next/link";

export default function AssignmentsTable({ assignments, isAdmin }) {
	// 채권 상세보기 토글
	const [expandedRows, setExpandedRows] = useState({});
	// 회수 상세보기 토글
	const [expandedEnfRows, setExpandedEnfRows] = useState({});
	// 수정 모드 상태

	const toggleRow = (assignmentId) => {
		setExpandedRows((prev) => ({
			...prev,
			[assignmentId]: !prev[assignmentId],
		}));
	};

	const toggleEnfRow = (assignmentId) => {
		setExpandedEnfRows((prev) => ({
			...prev,
			[assignmentId]: !prev[assignmentId],
		}));
	};

	const [currentPage, setCurrentPage] = useState(1);


	return (
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.ColumnHeaderCell className="whitespace-nowrap text-center">수임일</Table.ColumnHeaderCell>
					<Table.ColumnHeaderCell className="whitespace-nowrap text-center">채무자</Table.ColumnHeaderCell>
					<Table.ColumnHeaderCell className="w-full break-words text-center">현황</Table.ColumnHeaderCell>
					<Table.ColumnHeaderCell className="whitespace-nowrap text-center">채권 원금</Table.ColumnHeaderCell>
					<Table.ColumnHeaderCell className="whitespace-nowrap text-center">회수 금액</Table.ColumnHeaderCell>
					<Table.ColumnHeaderCell className="whitespace-nowrap text-center">회수율</Table.ColumnHeaderCell>
					<Table.ColumnHeaderCell className="whitespace-nowrap text-center">민사 소송</Table.ColumnHeaderCell>
					<Table.ColumnHeaderCell className="whitespace-nowrap text-center">재산 명시</Table.ColumnHeaderCell>
					<Table.ColumnHeaderCell className="whitespace-nowrap text-center">채권 압류</Table.ColumnHeaderCell>
					<Table.ColumnHeaderCell className="whitespace-nowrap text-center">의뢰 상세</Table.ColumnHeaderCell>
				</Table.Row>
			</Table.Header>

			<Table.Body>
				{assignments.map((assignment) => {
					const bond = assignment.bonds?.[0];
					const totalBond = calculateBondTotal(bond) || 0;

					const closedEnforcements = assignment.enforcements?.filter(
						(enf) => enf.status === "closed"
					) || [];
					const totalCollected = closedEnforcements.reduce(
						(sum, enf) => sum + parseFloat(enf.amount ?? 0),
						0
					);

					const collectionRate = totalBond > 0 ? (totalCollected / totalBond) * 100 : 0;

					return (
						<Fragment key={assignment.id}>
							<Table.Row>
								<Table.Cell className="whitespace-nowrap align-middle">
									{new Date(assignment.created_at).toLocaleString("ko-KR", {
										year: "2-digit",
										month: "2-digit",
										day: "2-digit",
									})}
								</Table.Cell>

								<Table.Cell className="whitespace-nowrap align-middle">
									{assignment.assignment_debtors?.map((debtor) => debtor.name).join(", ") || "-"}
								</Table.Cell>

								<Table.Cell className="w-full break-words align-middle">
									{assignment.assignment_timelines?.[0]?.description || "-"}
								</Table.Cell>

								<Table.Cell className="whitespace-nowrap align-middle">
									<div className="flex flex-col items-center gap-1">
										<p>{Math.round(totalBond).toLocaleString("ko-KR")}원</p>
										<Button variant="ghost" size="1" onClick={() => toggleRow(assignment.id)}>
											{expandedRows[assignment.id] ? "닫기" : "상세 보기"}
										</Button>
									</div>
								</Table.Cell>

								<Table.Cell className="whitespace-nowrap align-middle">
									<div className="flex flex-col items-center gap-1">
										<p>{Math.round(totalCollected).toLocaleString("ko-KR")}원</p>
										<Button variant="ghost" size="1" onClick={() => toggleEnfRow(assignment.id)}>
											{expandedEnfRows[assignment.id] ? "닫기" : "상세 보기"}
										</Button>
									</div>
								</Table.Cell>

								<Table.Cell className="whitespace-nowrap align-middle" style={{ minWidth: 120 }}>
									<Flex direction="column" gap="1" align="center">
										<Text size="2" as="span">
											{Math.round(collectionRate)}%
										</Text>
										<Progress.Root
											value={collectionRate}
											max={100}
											className="relative bg-gray-6 rounded overflow-hidden w-full h-[8px]"
											style={{ width: "80px" }}
										>
											<Progress.Indicator
												className="bg-blue-9 h-full transition-all duration-300"
												style={{ width: `${collectionRate}%` }}
											/>
										</Progress.Root>
									</Flex>
								</Table.Cell>
								<Table.Cell className="whitespace-nowrap align-middle text-center">
									<StatusSelector assignmentId={assignment.id} field="civil_litigation_status" currentStatus={assignment.civil_litigation_status} isAdmin={isAdmin} />
								</Table.Cell>

								<Table.Cell className="whitespace-nowrap align-middle text-center">
									<StatusSelector assignmentId={assignment.id} field="asset_declaration_status" currentStatus={assignment.asset_declaration_status} isAdmin={isAdmin} />
								</Table.Cell>

								<Table.Cell className="whitespace-nowrap align-middle text-center">
									<StatusSelector assignmentId={assignment.id} field="creditor_attachment_status" currentStatus={assignment.creditor_attachment_status} isAdmin={isAdmin} />
								</Table.Cell>

								<Table.Cell className="whitespace-nowrap align-middle">
									<Button variant="outline">
										<Link href={`/client/assignment/${assignment.id}`}>
											의뢰 상세
										</Link>
									</Button>
								</Table.Cell>



							</Table.Row>

							{expandedRows[assignment.id] && (
								<Table.Row>
									<Table.Cell colSpan={7} className="bg-gray-2">
										<BondDetail bond={bond} />
									</Table.Cell>
								</Table.Row>
							)}

							{expandedEnfRows[assignment.id] && (
								<Table.Row>
									<Table.Cell colSpan={7} className="bg-gray-2">
										<EnforcementsDetail enforcements={assignment.enforcements} />
									</Table.Cell>
								</Table.Row>
							)}
						</Fragment>
					);
				})}
			</Table.Body>
		</Table.Root>
	);
}

