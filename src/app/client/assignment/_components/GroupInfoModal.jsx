"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import { Button } from "@radix-ui/themes";

const GroupInfoModal = ({ open, onOpenChange, groupId, type }) => {
	const [group, setGroup] = useState(null);
	const [groupMembers, setGroupMembers] = useState([]);
	const [groupType, setGroupType] = useState(type);
	const [isEditing, setIsEditing] = useState(false);

	const fetchGroup = async () => {
		const { data, error } = await supabase
			.from("groups")
			.select("id, name")
			.eq("id", groupId)
			.single();

		if (error) {
			console.error("Failed to fetch group:", error);
			return;
		}
		setGroup(data);
	};

	const fetchGroupMembers = async () => {
		const { data, error } = await supabase
			.from("group_members")
			.select("user_id, users(name, email)")
			.eq("group_id", groupId);

		if (error) {
			console.error("Failed to fetch group members:", error);
			return;
		}
		setGroupMembers(data);
	};

	const updateGroupType = async () => {
		const { error } = await supabase
			.from("assignment_groups")
			.update({ type: groupType })
			.eq("group_id", groupId);

		if (error) {
			console.error("Failed to update group type:", error);
			return;
		}
		setIsEditing(false);
	};

	useEffect(() => {
		fetchGroup();
		fetchGroupMembers();
	}, [groupId]);

	if (!group) return null;

	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Overlay className="fixed inset-0 bg-black opacity-50 z-40" />
			<Dialog.Content
				className="
          fixed
          left-1/2 top-1/2
          max-h-[85vh] min-w-[450px] max-w-[650px]
          -translate-x-1/2 -translate-y-1/2
          rounded-md p-6
          bg-gray-2 border border-gray-6
          shadow-md shadow-gray-7
          text-gray-12
          focus:outline-none
          z-50
          overflow-y-auto
        "
			>
				<div className="flex justify-between items-center mb-4">
					<Dialog.Title className="text-xl font-bold">그룹 정보</Dialog.Title>
					<Dialog.Close asChild>
						<Button variant="ghost" color="gray">
							<Cross2Icon width={20} height={20} />
						</Button>
					</Dialog.Close>
				</div>
				<div className="mb-2">
					<p>그룹 이름: {group.name}</p>
				</div>
				<div className="flex items-center gap-1">
					<p>직위:</p>
					{isEditing ? (
						<input
							value={groupType || ""}
							placeholder="예)채권자, 채무자 등"
							onChange={(e) => setClientType(e.target.value)}
							className="border rounded p-1 border-gray-6"
						/>
					) : (
						<p>{groupType || "미등록"}</p>
					)}
					{isEditing ? (
						<Button
							onClick={updateGroupType}
						>
							저장
						</Button>
					) : (
						<Button
							size="1"
							onClick={() => setIsEditing(true)}
							variant="soft"
						>
							수정
						</Button>
					)}
				</div>

				<h3 className="text-lg font-semibold my-4">그룹원</h3>
				<ul>
					{groupMembers.map((member) => (
						<li key={member.user_id} className="mb-1">
							{member.users.name} - {member.users.email}
						</li>
					))}
				</ul>
			</Dialog.Content>
		</Dialog.Root>
	);
};

export default GroupInfoModal;

