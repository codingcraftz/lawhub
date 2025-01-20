"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";

export default function SendNotificationPage() {
	const [users, setUsers] = useState([]);
	const [selectedUserId, setSelectedUserId] = useState("");
	const [message, setMessage] = useState("");

	useEffect(() => {
		fetchUsers();
	}, []);

	const fetchUsers = async () => {
		const { data, error } = await supabase.from("users").select("id, name");
		if (error) console.error("사용자 목록 불러오기 오류:", error);
		else setUsers(data);
	};

	const sendNotification = async () => {
		if (!selectedUserId || !message) return;

		await fetch("/api/sendNotification", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				user_id: selectedUserId,
				title: "새로운 알림",
				message,
			}),
		});

		alert("알림이 전송되었습니다.");
		setMessage("");
	};

	return (
		<div>
			<h1>사용자에게 알림 보내기</h1>
			<select onChange={(e) => setSelectedUserId(e.target.value)}>
				<option value="">사용자를 선택하세요</option>
				{users.map((user) => (
					<option key={user.id} value={user.id}>
						{user.name}
					</option>
				))}
			</select>
			<input
				type="text"
				placeholder="메시지 내용"
				value={message}
				onChange={(e) => setMessage(e.target.value)}
			/>
			<button onClick={sendNotification}>알림 보내기</button>
		</div>
	);
}
