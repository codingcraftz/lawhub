"use client";

import React, { useState } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Flex, Button, Text } from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";

// 개인 의뢰인 + 그룹을 둘 다 골라야 하므로,
// props에 selectedClients, selectedGroups, setSelectedClients, setSelectedGroups 등 추가
export default function Step1_ClientAndGroupSelection({
	noClientSelected,
	selectedClients,
	setSelectedClients,
	removeClient,
	selectedGroups,
	setSelectedGroups,
	removeGroup,
}) {
	// 유저 검색 상태
	const [userSearchTerm, setUserSearchTerm] = useState("");
	const [userSearchResults, setUserSearchResults] = useState([]);
	const [userLoading, setUserLoading] = useState(false);

	// 그룹 검색 상태
	const [groupSearchTerm, setGroupSearchTerm] = useState("");
	const [groupSearchResults, setGroupSearchResults] = useState([]);
	const [groupLoading, setGroupLoading] = useState(false);

	// 1) 유저 검색
	const handleUserSearch = async () => {
		if (!userSearchTerm.trim()) return;
		setUserLoading(true);
		const { data, error } = await supabase
			.from("users")
			.select("id, name, phone_number, birth_date")
			.eq("role", "client") // 필요에 따라 조정
			.ilike("name", `%${userSearchTerm}%`);

		if (error) {
			console.error("유저 검색 오류:", error);
		} else {
			setUserSearchResults(data || []);
		}
		setUserLoading(false);
	};
	const handleUserKeyPress = (e) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleUserSearch();
		}
	};
	const handleAddClient = (client) => {
		if (!selectedClients.some((c) => c.id === client.id)) {
			setSelectedClients([...selectedClients, client]);
		}
	};

	// 2) 그룹 검색
	const handleGroupSearch = async () => {
		if (!groupSearchTerm.trim()) return;
		setGroupLoading(true);
		const { data, error } = await supabase
			.from("groups")
			.select("id, name")
			.ilike("name", `%${groupSearchTerm}%`);

		if (error) {
			console.error("그룹 검색 오류:", error);
		} else {
			setGroupSearchResults(data || []);
		}
		setGroupLoading(false);
	};
	const handleGroupKeyPress = (e) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleGroupSearch();
		}
	};
	const handleAddGroup = (group) => {
		if (!selectedGroups.some((g) => g.id === group.id)) {
			setSelectedGroups([...selectedGroups, group]);
		}
	};

	return (
		<Box>
			{/* 의뢰인 없음 스위치가 꺼져있어야만 (noClientSelected = false) 검색 가능하다고 가정 */}
			{!noClientSelected && (
				<>
					{/* --- 유저 검색영역 --- */}
					<Text size="3" weight="bold" mb="2">
						개인 의뢰인 검색
					</Text>
					<Flex gap="2" mb="2">
						<input
							type="text"
							placeholder="개인 이름 검색"
							value={userSearchTerm}
							onChange={(e) => setUserSearchTerm(e.target.value)}
							onKeyDown={handleUserKeyPress}
							style={{
								flex: 1,
								padding: "0.6rem",
								border: "1px solid var(--gray-6)",
								borderRadius: "var(--radius-1)",
							}}
						/>
						<Button onClick={handleUserSearch} disabled={userLoading}>
							검색
						</Button>
					</Flex>

					<Box style={{ maxHeight: "200px", overflowY: "auto" }} mb="3">
						{userSearchResults.map((client) => (
							<Flex
								key={client.id}
								align="center"
								justify="between"
								style={{
									borderBottom: "1px solid var(--gray-6)",
									paddingBottom: 4,
									marginBottom: 4,
								}}
							>
								<Text>
									{client.name} / {client.phone_number || "전화번호없음"}
								</Text>
								<Button
									variant="soft"
									onClick={() => handleAddClient(client)}
									size="2"
								>
									추가
								</Button>
							</Flex>
						))}
					</Box>

					{/* 선택된 개인 의뢰인 목록 */}
					{selectedClients.length > 0 && (
						<Box mb="4">
							<Text size="3" weight="bold" mb="2">
								선택된 개인 의뢰인
							</Text>
							<Flex gap="2" wrap="wrap">
								{selectedClients.map((c) => (
									<Flex
										key={c.id}
										align="center"
										style={{
											backgroundColor: "var(--gray-2)",
											borderRadius: 4,
											padding: "4px 8px",
										}}
									>
										<Text mr="1">{c.name}</Text>
										<Button
											variant="ghost"
											color="gray"
											size="2"
											onClick={() => removeClient(c.id)}
										>
											<Cross2Icon width={15} height={15} />
										</Button>
									</Flex>
								))}
							</Flex>
						</Box>
					)}

					{/* --- 그룹 검색영역 --- */}
					<Text size="3" weight="bold" mb="2">
						그룹 검색
					</Text>
					<Flex gap="2" mb="2">
						<input
							type="text"
							placeholder="그룹 이름 검색"
							value={groupSearchTerm}
							onChange={(e) => setGroupSearchTerm(e.target.value)}
							onKeyDown={handleGroupKeyPress}
							style={{
								flex: 1,
								padding: "0.6rem",
								border: "1px solid var(--gray-6)",
								borderRadius: "var(--radius-1)",
							}}
						/>
						<Button onClick={handleGroupSearch} disabled={groupLoading}>
							검색
						</Button>
					</Flex>
					<Box style={{ maxHeight: "200px", overflowY: "auto" }}>
						{groupSearchResults.map((group) => (
							<Flex
								key={group.id}
								align="center"
								justify="between"
								style={{
									borderBottom: "1px solid var(--gray-6)",
									paddingBottom: 4,
									marginBottom: 4,
								}}
							>
								<Text>{group.name}</Text>
								<Button variant="soft" onClick={() => handleAddGroup(group)} size="2">
									추가
								</Button>
							</Flex>
						))}
					</Box>

					{/* 선택된 그룹 목록 */}
					{selectedGroups.length > 0 && (
						<Box mt="4">
							<Text size="3" weight="bold" mb="2">
								선택된 그룹
							</Text>
							<Flex wrap="wrap" gap="2">
								{selectedGroups.map((g) => (
									<Flex
										key={g.id}
										align="center"
										style={{
											backgroundColor: "var(--gray-2)",
											borderRadius: 4,
											padding: "4px 8px",
										}}
									>
										<Text mr="1">{g.name}</Text>
										<Button
											variant="ghost"
											color="gray"
											size="2"
											onClick={() => removeGroup(g.id)}
										>
											<Cross2Icon width={15} height={15} />
										</Button>
									</Flex>
								))}
							</Flex>
						</Box>
					)}
				</>
			)}
		</Box>
	);
}

