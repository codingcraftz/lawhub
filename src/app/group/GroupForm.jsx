"use client";

import React, { useState } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Flex, Button, Text } from "@radix-ui/themes";

export default function GroupForm({ onCancel, onSuccess }) {
	const [groupName, setGroupName] = useState("");
	const [error, setError] = useState("");

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!groupName.trim()) {
			setError("그룹 이름을 입력해주세요.");
			return;
		}
		const { data, error: insertError } = await supabase
			.from("groups")
			.insert({ name: groupName })
			.select("*")
			.single();

		if (insertError) {
			console.error("그룹 추가 오류:", insertError);
			alert("그룹 추가 중 오류가 발생했습니다.");
			return;
		}
		alert(`그룹 "${data.name}"이(가) 추가되었습니다.`);
		onSuccess && onSuccess();
	};

	return (
		<Box mt="3" mb="3">
			<form onSubmit={handleSubmit}>
				<Flex gap="2" mb="2">
					<input
						type="text"
						placeholder="그룹 이름"
						value={groupName}
						onChange={(e) => {
							setGroupName(e.target.value);
							setError("");
						}}
						style={{
							flex: 1,
							padding: "0.5rem",
							border: "1px solid var(--gray-6)",
							borderRadius: "var(--radius-1)",
						}}
					/>
					<Button type="submit">추가</Button>
					<Button variant="outline" onClick={onCancel}>
						취소
					</Button>
				</Flex>
				{error && (
					<Text color="red" size="2">
						{error}
					</Text>
				)}
			</form>
		</Box>
	);
}

