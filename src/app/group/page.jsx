"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Flex, Button, Text, Card } from "@radix-ui/themes";
import GroupForm from "./GroupForm";
import GroupMembersEditor from "./GroupMembersEditor";
import useRoleRedirect from "@/hooks/userRoleRedirect";

export default function GroupManagementPage() {
	useRoleRedirect(["staff", "admin", "client"], "/");
	const [groups, setGroups] = useState([]);
	const [selectedGroup, setSelectedGroup] = useState(null);
	const [isAddingGroup, setIsAddingGroup] = useState(false);

	// Fetch groups
	const fetchGroups = async () => {
		const { data, error } = await supabase.from("groups").select("*");
		if (error) {
			console.error("그룹 목록 불러오기 오류:", error);
		} else {
			setGroups(data || []);
		}
	};

	useEffect(() => {
		fetchGroups();
	}, []);

	// Handle adding a new group
	const handleGroupAdded = () => {
		setIsAddingGroup(false);
		fetchGroups();
	};

	// Handle updating a group's name
	const handleUpdateGroup = async (groupId, newName) => {
		const { error } = await supabase
			.from("groups")
			.update({ name: newName })
			.eq("id", groupId);
		if (error) {
			console.error("그룹 수정 오류:", error);
			alert("수정 중 오류가 발생했습니다.");
		} else {
			alert("그룹 이름이 수정되었습니다.");
			fetchGroups();
		}
	};

	// Handle deleting a group
	const handleDeleteGroup = async (groupId) => {
		if (!confirm("정말 삭제하시겠습니까?")) return;
		const { error } = await supabase.from("groups").delete().eq("id", groupId);
		if (error) {
			console.error("그룹 삭제 오류:", error);
			alert("삭제 중 오류가 발생했습니다.");
		} else {
			alert("그룹이 삭제되었습니다.");
			setSelectedGroup(null);
			fetchGroups();
		}
	};

	return (
		<Box p="4" className="w-full max-w-screen-lg mx-auto">
			{/* Header */}
			<Flex justify="between" align="center" mb="4">
				<Text size="5" weight="bold">
					그룹 관리
				</Text>
				{isAddingGroup ? (
					<GroupForm
						onCancel={() => setIsAddingGroup(false)}
						onSuccess={handleGroupAdded}
					/>
				) : (
					<Button variant="solid" onClick={() => setIsAddingGroup(true)}>
						+ 새 그룹 추가
					</Button>
				)}
			</Flex>

			<Flex gap="6" mt="4">
				{/* Sidebar: Group List */}
				<Card
					p="3"
					className="w-1/4 min-w-[250px] max-h-[500px] overflow-auto shadow-md"
				>
					<Text weight="bold" size="4" mb="3">
						그룹 목록
					</Text>
					{groups.map((group) => (
						<Box
							key={group.id}
							p="2"
							className={`cursor-pointer rounded-md ${selectedGroup?.id === group.id
								? "bg-primary-3 text-primary-11"
								: "hover:bg-gray-3"
								}`}
							onClick={() => setSelectedGroup(group)}
						>
							{group.name}
						</Box>
					))}
				</Card>

				{/* Main Content: Group Details */}
				<Card p="4" className="flex-1 shadow-md">
					{selectedGroup ? (
						<>
							<Flex justify="between" align="center" mb="4">
								<Text size="4" weight="bold">
									{selectedGroup.name}
								</Text>
								<Button
									variant="soft"
									color="red"
									onClick={() => handleDeleteGroup(selectedGroup.id)}
								>
									삭제
								</Button>
							</Flex>

							{/* Group Name Editor */}
							<GroupNameEditor
								group={selectedGroup}
								onUpdateGroup={handleUpdateGroup}
							/>

							{/* Group Members Editor */}
							<Box mt="6">
								<GroupMembersEditor group={selectedGroup} />
							</Box>
						</>
					) : (
						<Flex justify="center" align="center" className="h-full">
							<Text>좌측에서 그룹을 선택해주세요.</Text>
						</Flex>
					)}
				</Card>
			</Flex>
		</Box>
	);
}

function GroupNameEditor({ group, onUpdateGroup }) {
	const [newName, setNewName] = useState(group.name);

	const handleSave = () => {
		onUpdateGroup(group.id, newName);
	};

	return (
		<Flex gap="3" align="center" className="mt-2">
			<input
				value={newName}
				onChange={(e) => setNewName(e.target.value)}
				placeholder="그룹 이름 입력"
				style={{
					flex: 1,
					padding: "0.6rem",
					border: "1px solid var(--gray-6)",
					borderRadius: "var(--radius-2)",
				}}
			/>
			<Button onClick={handleSave}>저장</Button>
		</Flex>
	);
}

