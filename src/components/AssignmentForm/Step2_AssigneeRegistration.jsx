"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Flex, Button, Text, Checkbox } from "@radix-ui/themes";

export default function Step2_AssigneeRegistration({
	selectedAssignees,
	setSelectedAssignees,
}) {
	const [internalStaff, setInternalStaff] = useState([]);
	const [externalStaff, setExternalStaff] = useState([]);

	useEffect(() => {
		fetchStaff();
	}, []);

	const fetchStaff = async () => {
		try {
			// Fetch internal staff
			const { data: internalData, error: internalError } = await supabase
				.from("users")
				.select("id, name, position, employee_type")
				.or("role.eq.staff,role.eq.admin")
				.eq("employee_type", "internal");

			if (internalError) throw internalError;

			// Sort internal staff alphabetically by name
			const sortedInternalStaff = (internalData || []).sort((a, b) =>
				a.name.localeCompare(b.name)
			);

			// Fetch external staff
			const { data: externalData, error: externalError } = await supabase
				.from("users")
				.select("id, name, position, employee_type")
				.eq("role", "staff")
				.eq("employee_type", "external");

			if (externalError) throw externalError;

			// Sort external staff alphabetically by name
			const sortedExternalStaff = (externalData || []).sort((a, b) =>
				a.name.localeCompare(b.name)
			);

			// Set sorted staff lists
			setInternalStaff(sortedInternalStaff);
			setExternalStaff(sortedExternalStaff);
		} catch (error) {
			console.error("직원 목록 가져오기 오류:", error);
		}
	};


	const handleToggleAssignee = (staff) => {
		const exists = selectedAssignees.some((a) => a.id === staff.id);
		if (exists) {
			setSelectedAssignees(selectedAssignees.filter((a) => a.id !== staff.id));
		} else {
			setSelectedAssignees([...selectedAssignees, staff]);
		}
	};

	const isChecked = (id) => selectedAssignees.some((a) => a.id === id);

	return (
		<Box>
			{/* 내부 직원 */}
			<Box mb="4">
				<Text size="3" weight="bold" mb="2">
					내부 직원
				</Text>
				<Flex direction="column" gap="2">
					{internalStaff.map((staff) => (
						<Flex
							key={staff.id}
							align="center"
							style={{
								backgroundColor: "var(--gray-2)",
								borderRadius: 4,
								padding: "8px",
							}}
						>
							<Checkbox
								checked={isChecked(staff.id)}
								onCheckedChange={() => handleToggleAssignee(staff)}
							/>
							<Text ml="2">
								{staff.name} ({staff.position || "직위 없음"})
							</Text>
						</Flex>
					))}
				</Flex>
			</Box>

			{/* 외부 직원 */}
			<Box mb="4">
				<Text size="3" weight="bold" mb="2">
					외부 직원
				</Text>
				<Flex direction="column" gap="2">
					{externalStaff.map((staff) => (
						<Flex
							key={staff.id}
							align="center"
							style={{
								backgroundColor: "var(--gray-2)",
								borderRadius: 4,
								padding: "8px",
							}}
						>
							<Checkbox
								checked={isChecked(staff.id)}
								onCheckedChange={() => handleToggleAssignee(staff)}
							/>
							<Text ml="2">
								{staff.name} ({staff.position || "직위 없음"})
							</Text>
						</Flex>
					))}
				</Flex>
			</Box>

			{/* 선택된 담당자 미리보기 */}
			<Box mt="4">
				<Text size="3" weight="bold" mb="2">
					선택된 담당자
				</Text>
				{selectedAssignees.length === 0 ? (
					<Text as="p">선택된 담당자가 없습니다.</Text>
				) : (
					<Flex direction="column" gap="2">
						{selectedAssignees.map((assignee) => (
							<Flex
								key={assignee.id}
								align="center"
								style={{
									backgroundColor: "var(--blue-2)",
									borderRadius: 4,
									padding: "8px",
								}}
							>
								<Text>
									{assignee.name} ({assignee.position || "직위 없음"})
								</Text>
								<Button
									variant="ghost"
									color="red"
									size="2"
									style={{ marginLeft: "auto" }}
									onClick={() =>
										setSelectedAssignees(
											selectedAssignees.filter((a) => a.id !== assignee.id)
										)
									}
								>
									제거
								</Button>
							</Flex>
						))}
					</Flex>
				)}
			</Box>
		</Box>
	);
}

