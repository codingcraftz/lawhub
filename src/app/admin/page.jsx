"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase"; // 실제 프로젝트에 맞게 경로 수정
import { Box, Text } from "@radix-ui/themes";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@radix-ui/react-tabs";
import useRoleRedirect from "@/hooks/userRoleRedirect";

// 하위 탭 컴포넌트
import StaffManagementTab from "./StaffManagementTab";
import ClientManagementTab from "./ClientManagementTab";

export default function AdminPage() {
	const [users, setUsers] = useState([]);
	const [assignments, setAssignments] = useState([]);
	const [isLoading, setIsLoading] = useState(true);

	useRoleRedirect(["admin"], [], "/");
	const fetchAllData = async () => {
		setIsLoading(true);

		// 1) users
		const { data: usersData, error: usersError } = await supabase
			.from("users")
			.select("*");
		if (usersError) {
			console.error("Error fetching users:", usersError);
		}

		// 2) assignments
		const { data: assignmentsData, error: assignmentsError } = await supabase
			.from("assignments")
			.select("*");
		if (assignmentsError) {
			console.error("Error fetching assignments:", assignmentsError);
		}

		setUsers(usersData || []);
		setAssignments(assignmentsData || []);
		setIsLoading(false);
	};

	useEffect(() => {
		fetchAllData();
	}, []);

	if (isLoading) return <Text>로딩 중...</Text>;

	return (
		<Box className="flex w-full p-4 max-w-screen-lg mx-auto">
			<Tabs className="w-full" defaultValue="staffManagement">
				{/* 
          TabsList와 TabsTrigger에 Tailwind 클래스를 추가해 
          Hover/Active 상태 스타일을 개선한 예시 
        */}
				<TabsList className="flex mb-4 border-b border-gray-6">
					<TabsTrigger
						value="staffManagement"
						className="
              px-4 py-2 
              hover:bg-gray-3 
              text-sm 
              transition-colors 
              [data-state='active']:border-b-2 
              [data-state='active']:border-blue-9 
              [data-state='active']:text-blue-11 
              [data-state='active']:font-semibold
            "
					>
						직원 관리
					</TabsTrigger>
					<TabsTrigger
						value="clientManagement"
						className="
              px-4 py-2 
              hover:bg-gray-3 
              text-sm 
              transition-colors 
              [data-state='active']:border-b-2 
              [data-state='active']:border-blue-9 
              [data-state='active']:text-blue-11 
              [data-state='active']:font-semibold
            "
					>
						고객 관리
					</TabsTrigger>
				</TabsList>

				<TabsContent
					value="staffManagement"
					className="animate-fadeIn w-full"
				>
					<StaffManagementTab users={users} onRefresh={fetchAllData} />
				</TabsContent>

				<TabsContent
					value="clientManagement"
					className="animate-fadeIn w-full"
				>
					<ClientManagementTab users={users} onRefresh={fetchAllData} />
				</TabsContent>
			</Tabs>
		</Box>
	);
}

