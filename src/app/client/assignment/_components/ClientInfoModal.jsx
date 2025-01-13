"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";

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
			<Dialog.Overlay className="fixed inset-0 bg-black opacity-50" />
			<Dialog.Content
				className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg"
				style={{ maxWidth: "500px", width: "100%" }}
			>
				<div className="flex justify-between items-center mb-4">
					<Dialog.Title className="text-xl font-bold">의뢰인 정보</Dialog.Title>
					<Dialog.Close asChild>
						<button>
							<Cross2Icon width={20} height={20} />
						</button>
					</Dialog.Close>
				</div>
				<div className="mb-4">
					<p>이름: {client.name}</p>
					<p>생년월일: {client.birth_date || "미입력"}</p>
					<p>이메일: {client.email}</p>
					<p>전화번호: {client.phone_number || "미입력"}</p>
				</div>
				<div>
					<p>직위:</p>
					{isEditing ? (
						<input
							value={clientType}
							onChange={(e) => setClientType(e.target.value)}
							className="border rounded w-full p-2"
						/>
					) : (
						<p>{clientType}</p>
					)}
					{isEditing ? (
						<button
							onClick={updateClientType}
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
			</Dialog.Content>
		</Dialog.Root>
	);
};

export default ClientInfoModal;

