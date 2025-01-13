"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";

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
          fixed left-1/2 top-1/2
          -translate-x-1/2 -translate-y-1/2
          bg-white p-6 rounded-lg shadow-lg
          max-w-lg w-full
          text-gray-12
        "
			>
				<div className="flex justify-between items-center mb-4">
					<Dialog.Title className="text-xl font-bold">그룹 정보</Dialog.Title>
					<Dialog.Close asChild>
						<button>
							<Cross2Icon width={20} height={20} />
						</button>
					</Dialog.Close>
				</div>

				<div className="mb-4">
					<p>그룹 이름: {group.name}</p>
				</div>

				<div className="mb-4">
					<p>직위:</p>
					{isEditing ? (
						<input
							value={groupType}
							onChange={(e) => setGroupType(e.target.value)}
							className="border rounded p-2 w-full"
						/>
					) : (
						<p>{groupType}</p>
					)}
					{isEditing ? (
						<button
							onClick={updateGroupType}
							className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
						>
							저장
						</button>
					) : (
						<button
							onClick={() => setIsEditing(true)}
							className="mt-2 bg-gray-300 px-4 py-2 rounded"
						>
							수정
						</button>
					)}
				</div>

				<h3 className="text-lg font-semibold mb-2">그룹원</h3>
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

