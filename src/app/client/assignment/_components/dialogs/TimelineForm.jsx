"use client";

import React, { useState, useEffect } from "react";
import { Box, Flex, Button, Text } from "@radix-ui/themes";

export default function TimelineForm({ initialData, onOpenChange, onSubmit }) {
	const [formData, setFormData] = useState({
		description: "",
	});
	const [errors, setErrors] = useState({});

	useEffect(() => {
		if (initialData) {
			setFormData(initialData); // Load initial data for editing
		}
	}, [initialData]);

	const validate = () => {
		const newErrors = {};
		if (!formData.description.trim()) {
			newErrors.description = "목표를 작성해주세요.";
		}
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		if (!validate()) return;
		onSubmit(formData);
	};

	return (
		<form onSubmit={handleSubmit} style={{ marginTop: "1rem" }}>
			<Text size="4" weight="bold" mb="2">
				목표 {initialData ? "수정" : "등록"}
			</Text>

			{/* 설명 */}
			<Box mb="2">
				<textarea
					name="description"
					placeholder="목표"
					value={formData.description}
					onChange={handleChange}
					style={{
						width: "100%",
						padding: "0.6rem",
						border: "1px solid var(--gray-6)",
						borderRadius: "var(--radius-1)",
					}}
				/>
			</Box>

			<Flex justify="end" gap="2" mt="3">
				<Button variant="outline" onClick={() => onOpenChange(false)}>
					취소
				</Button>
				<Button type="submit">{initialData ? "수정" : "등록"}</Button>
			</Flex>
		</form>
	);
}

