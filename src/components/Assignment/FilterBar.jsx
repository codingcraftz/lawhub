"use client";

import React, { useState } from "react";
import * as Select from "@radix-ui/react-select";
import { Flex, Button } from "@radix-ui/themes";
import { CheckIcon, ChevronDownIcon } from "@radix-ui/react-icons";

/**
 * @param {Array} assignments - 전체 의뢰 목록
 * @param {Function} setFilteredAssignments - 필터링된 데이터 업데이트 함수
 */
export default function FilterBar({ assignments, setFilteredAssignments }) {
	const [searchText, setSearchText] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");

	// 검색 및 상태 필터 적용
	const handleFilter = () => {
		let filtered = [...assignments];

		// (1) 검색 필터: 채권자, 채무자, 내용(description) 검색
		if (searchText.trim()) {
			const searchTerm = searchText.toLowerCase();
			filtered = filtered.filter((a) => {
				const creditorNames = a.assignment_creditors
					?.map((c) => c.name?.toLowerCase())
					.join(" ");
				const debtorNames = a.assignment_debtors
					?.map((d) => d.name?.toLowerCase())
					.join(" ");
				const desc = a.description?.toLowerCase() || "";

				return (
					creditorNames?.includes(searchTerm) ||
					debtorNames?.includes(searchTerm) ||
					desc.includes(searchTerm)
				);
			});
		}

		// (2) 상태 필터: 전체("all")이 아니면 적용
		if (statusFilter !== "all") {
			filtered = filtered.filter((a) => a.status === statusFilter);
		}

		setFilteredAssignments(filtered);
	};

	return (
		<Flex
			// 모바일에서는 세로 배치, sm(640px)부터는 가로 배치
			className="my-4 flex flex-col sm:flex-row gap-3 w-full"
			wrap="wrap"
			align="start"
		>
			{/* 🔍 검색 입력창 (채권자, 채무자, 내용 검색) */}
			<input
				type="text"
				placeholder="채권자, 채무자, 내용 검색..."
				value={searchText}
				onChange={(e) => setSearchText(e.target.value)}
				className="border border-gray-300 px-3 py-2 rounded-md w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>

			{/* ⬇️ 상태 선택 드롭다운 */}
			<Select.Root value={statusFilter} onValueChange={setStatusFilter}>
				<Select.Trigger
					className="inline-flex h-[40px] items-center justify-center gap-2 rounded-md px-4 text-[14px] shadow-sm border border-gray-300 focus:ring-2 focus:ring-blue-500 hover:bg-gray-100 w-full sm:w-auto"
					aria-label="Status"
				>
					<Select.Value />
					<Select.Icon>
						<ChevronDownIcon className="text-gray-500" />
					</Select.Icon>
				</Select.Trigger>

				<Select.Portal>
					<Select.Content className="overflow-hidden rounded-md bg-white shadow-md border border-gray-300">
						<Select.Viewport className="p-2">
							<SelectItem value="all">전체</SelectItem>
							<SelectItem value="ongoing">진행중</SelectItem>
							<SelectItem value="closed">완료</SelectItem>
						</Select.Viewport>
					</Select.Content>
				</Select.Portal>
			</Select.Root>

			{/* ✅ 필터 적용 버튼 */}
			<Button
				onClick={handleFilter}
				className="bg-blue-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-blue-600 w-full sm:w-auto"
			>
				필터 적용
			</Button>
		</Flex>
	);
}

/**
 * Radix UI Select의 `Item` 컴포넌트 (색상 조정)
 */
const SelectItem = React.forwardRef(({ children, ...props }, forwardedRef) => {
	return (
		<Select.Item
			className="relative flex h-[36px] select-none items-center rounded-md px-3 text-[14px] leading-none hover:bg-gray-100 focus:bg-blue-100"
			{...props}
			ref={forwardedRef}
		>
			<Select.ItemText>{children}</Select.ItemText>
			<Select.ItemIndicator className="absolute right-2 inline-flex items-center">
				<CheckIcon className="text-blue-500" />
			</Select.ItemIndicator>
		</Select.Item>
	);
});

SelectItem.displayName = "SelectItem";

