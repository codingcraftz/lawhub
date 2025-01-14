"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import { Button } from "@radix-ui/themes";

const ClientInfoModal = ({ open, onOpenChange, clientId, type }) => {
	const [client, setClient] = useState(null);
	const [clientType, setClientType] = useState(type);
	const [isEditing, setIsEditing] = useState(false);

	const fetchClient = async () => {
		const { data, error } = await supabase
			.from("users")
			.select("id, name, email, phone_number, birth_date")
			.eq("id", clientId)
			.single();

		if (error) {
			console.error("Failed to fetch client:", error);
			return;
		}
		setClient(data);
	};

	const updateClientType = async () => {
		const { error } = await supabase
			.from("assignment_clients")
			.update({ type: clientType })
			.eq("client_id", clientId);

		if (error) {
			console.error("Failed to update client type:", error);
			return;
		}
		setIsEditing(false);
	};

	useEffect(() => {
		fetchClient();
	}, [clientId]);

	if (!client) return null;

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
					<Dialog.Title className="text-xl font-bold">의뢰인 정보</Dialog.Title>
					<Dialog.Close asChild>
						<Button variant="ghost" color="gray">
							<Cross2Icon width={20} height={20} />
						</Button>
					</Dialog.Close>
				</div>
				<div className="mb-4">
					<p>이름: {client.name}</p>
					<p>생년월일: {client.birth_date || "미입력"}</p>
					<p>이메일: {client.email}</p>
					<p>전화번호: {client.phone_number || "미입력"}</p>
				</div>
				<div className="flex items-center gap-1">
					<p>직위:</p>
					{isEditing ? (
						<input
							value={clientType || ""}
							placeholder="예)채권자, 채무자 등"
							onChange={(e) => setClientType(e.target.value)}
							className="border rounded p-1 border-gray-6"
						/>
					) : (
						<p>{clientType || "미등록"}</p>
					)}
					{isEditing ? (
						<Button
							onClick={updateClientType}
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
			</Dialog.Content>
		</Dialog.Root>
	);
};

export default ClientInfoModal;

