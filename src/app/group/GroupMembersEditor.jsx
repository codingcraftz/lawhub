"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Flex, Button, Text } from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";

export default function GroupMembersEditor({ group }) {
	const [members, setMembers] = useState([]); // 현재 그룹에 속한 유저 목록
	const [searchTerm, setSearchTerm] = useState("");
	const [searchResults, setSearchResults] = useState([]);

	// 1) 그룹 멤버 목록 fetch
	const fetchMembers = async () => {
		// group_members JOIN users
		const { data, error } = await supabase
			.from("group_members")
			.select("id, user_id, users(name, phone_number)")
			.eq("group_id", group.id);

		if (error) {
			console.error("그룹 멤버 불러오기 오류:", error);
		} else {
			setMembers(data || []);
		}
	};

	useEffect(() => {
		if (group) {
			fetchMembers();
		}
	}, [group]);

	// 2) 유저 검색
	const handleSearch = async () => {
		if (!searchTerm.trim()) return;
		const { data, error } = await supabase
			.from("users")
			.select("id, name, phone_number, birth_date")
			.ilike("name", `%${searchTerm}%`);

		if (error) {
			console.error("유저 검색 오류:", error);
		} else {
			setSearchResults(data || []);
		}
	};

	// Enter키 검색
	const handleKeyPress = (e) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleSearch();
		}
	};

	// 3) 그룹에 유저 추가
	const handleAddUserToGroup = async (user) => {
		const { error } = await supabase
			.from("group_members")
			.insert({ group_id: group.id, user_id: user.id });
		if (error) {
			console.error("그룹 멤버 추가 오류:", error);
			alert("추가 중 오류가 발생했습니다.");
		} else {
			alert(`${user.name} 님이 그룹에 추가되었습니다.`);
			fetchMembers();
		}
	};

	// 4) 그룹에서 유저 제거
	const handleRemoveMember = async (memberId) => {
		const { error } = await supabase
			.from("group_members")
			.delete()
			.eq("id", memberId);
		if (error) {
			console.error("그룹 멤버 제거 오류:", error);
			alert("제거 중 오류가 발생했습니다.");
		} else {
			alert("멤버가 그룹에서 제거되었습니다.");
			fetchMembers();
		}
	};

	return (
		<Box className="py-2 flex flex-col gap-4">
			<Text size="4" weight="bold" mb="2">
				그룹 멤버 관리
			</Text>
			{/* 유저 검색 & 추가 */}
			<Flex gap="2" mb="2">
				<input
					type="text"
					placeholder="유저 이름 검색"
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					onKeyDown={handleKeyPress}
					style={{
						flex: 1,
						padding: "0.5rem",
						border: "1px solid var(--gray-6)",
						borderRadius: "var(--radius-1)",
					}}
				/>
				<Button onClick={handleSearch}>검색</Button>
			</Flex>


			<Box style={{ maxHeight: "200px", overflowY: "auto" }}>
				{searchResults.map((user) => (
					<Flex
						key={user.id}
						align="center"
						justify="between"
						style={{
							borderBottom: "1px solid var(--gray-6)",
							paddingBottom: 4,
							marginBottom: 4,
						}}
					>
						<Text>{user.name} {user.birth_date}</Text>
						<Button variant="soft" onClick={() => handleAddUserToGroup(user)}>
							추가
						</Button>
					</Flex>
				))}
			</Box>


			{/* 현재 그룹 멤버 목록 */}


			<Text size="4" weight="bold">멤버 목록</Text>

			<Box mb="4">
				{members.map((m) => (
					<Flex
						key={m.id}
						align="center"
						justify="between"
						style={{
							borderBottom: "1px solid var(--gray-6)",
							padding: "4px",
							marginBottom: "4px",
						}}
					>
						<Text>{m.users.name} {m.users.phone_number} {m.users.birth_date}</Text>

						<Button
							variant="ghost"
							color="red"
							size="2"
							onClick={() => handleRemoveMember(m.id)}
						>
							<Cross2Icon width={20} height={20} />
						</Button>
					</Flex>
				))}
			</Box>

		</Box>
	);
}

