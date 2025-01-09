"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Flex, Button, Text } from "@radix-ui/themes";
import GroupForm from "./GroupForm";
import GroupMembersEditor from "./GroupMembersEditor";

export default function GroupManagementPage() {
	const [groups, setGroups] = useState([]);
	const [selectedGroup, setSelectedGroup] = useState(null);
	const [isAddingGroup, setIsAddingGroup] = useState(false);

	// 1) 그룹 목록 불러오기
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

	// 새 그룹 추가 완료 시
	const handleGroupAdded = () => {
		setIsAddingGroup(false);
		fetchGroups();
	};

	// 그룹 삭제
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

	// 그룹 수정
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

	return (
		<Box p="4">
			<Text size="5" weight="bold" mb="3">
				그룹 관리
			</Text>

			{/* 새 그룹 추가 버튼 / 폼 */}
			{isAddingGroup ? (
				<GroupForm
					onCancel={() => setIsAddingGroup(false)}
					onSuccess={handleGroupAdded}
				/>
			) : (
				<Button onClick={() => setIsAddingGroup(true)}>새 그룹 추가</Button>
			)}

			<Flex gap="2" mt="4">
				{/* 그룹 목록 */}
				<Box style={{ width: "200px", borderRight: "1px solid var(--gray-6)" }}>
					{groups.map((group) => (
						<Box
							key={group.id}
							p="2"
							style={{
								cursor: "pointer",
								backgroundColor:
									selectedGroup?.id === group.id ? "var(--gray-3)" : "transparent",
							}}
							onClick={() => setSelectedGroup(group)}
						>
							{group.name}
						</Box>
					))}
				</Box>

				{/* 우측 영역: 특정 그룹 선택 시 상세(이름 수정, 삭제, 멤버 관리) */}
				<Box flex="1" p="3">
					{selectedGroup ? (
						<>
							<Text size="4" weight="bold">
								그룹: {selectedGroup.name}
							</Text>
							<Button
								color="red"
								variant="soft"
								onClick={() => handleDeleteGroup(selectedGroup.id)}
							>
								그룹 삭제
							</Button>

							<Box mt="3">
								<GroupNameEditor
									group={selectedGroup}
									onUpdateGroup={handleUpdateGroup}
								/>
							</Box>

							<Box mt="4">
								<GroupMembersEditor group={selectedGroup} />
							</Box>
						</>
					) : (
						<Text>좌측에서 그룹을 선택해주세요.</Text>
					)}
				</Box>
			</Flex>
		</Box>
	);
}

// 그룹 이름 수정용 간단 컴포넌트
function GroupNameEditor({ group, onUpdateGroup }) {
	const [newName, setNewName] = useState(group.name);

	const handleSave = () => {
		onUpdateGroup(group.id, newName);
	};

	return (
		<Flex gap="2" align="center">
			<input
				value={newName}
				onChange={(e) => setNewName(e.target.value)}
				style={{
					padding: "0.4rem",
					border: "1px solid var(--gray-6)",
					borderRadius: "var(--radius-1)",
				}}
			/>
			<Button onClick={handleSave}>이름 수정</Button>
		</Flex>
	);
}

