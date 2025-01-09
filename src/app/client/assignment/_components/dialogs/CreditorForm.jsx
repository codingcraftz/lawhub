"use client";

import React, { useState, useEffect } from "react";
import { Box, Flex, Button, Text } from "@radix-ui/themes";

export default function CreditorForm({ initialData, onOpenChange, onSubmit }) {
	const [formData, setFormData] = useState({
		name: "",
		birth_date: "",
		phone_number: "",
		address: "",
	});
	const [errors, setErrors] = useState({});

	useEffect(() => {
		if (initialData) {
			setFormData(initialData); // Load initial data for editing
		}
	}, [initialData]);

	const validate = () => {
		const newErrors = {};
		if (!formData.name.trim()) {
			newErrors.name = "이름은 필수입니다.";
		}
		if (!formData.birth_date.trim()) {
			newErrors.birth_date = "생년월일은 필수입니다.";
		}
		if (!/^\d{10,11}$/.test(formData.phone_number)) {
			newErrors.phone_number = "전화번호는 10~11자리 숫자여야 합니다.";
		}
		if (!formData.address.trim()) {
			newErrors.address = "주소는 필수입니다.";
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
				채권자 {initialData ? "수정" : "등록"}
			</Text>

			{/* 이름 */}
			<Box mb="2">
				<input
					name="name"
					placeholder="이름"
					value={formData.name}
					onChange={handleChange}
					style={{
						width: "100%",
						padding: "0.6rem",
						border: "1px solid var(--gray-6)",
						borderRadius: "var(--radius-1)",
					}}
				/>
				{errors.name && (
					<Text color="red" size="2">
						{errors.name}
					</Text>
				)}
			</Box>

			{/* 생년월일 */}
			<Box mb="2">
				<input
					name="birth_date"
					placeholder="생년월일 (YYYY-MM-DD)"
					value={formData.birth_date}
					onChange={handleChange}
					style={{
						width: "100%",
						padding: "0.6rem",
						border: "1px solid var(--gray-6)",
						borderRadius: "var(--radius-1)",
					}}
				/>
				{errors.birth_date && (
					<Text color="red" size="2">
						{errors.birth_date}
					</Text>
				)}
			</Box>

			{/* 전화번호 */}
			<Box mb="2">
				<input
					name="phone_number"
					placeholder="전화번호 (10~11자리 숫자)"
					value={formData.phone_number}
					onChange={handleChange}
					style={{
						width: "100%",
						padding: "0.6rem",
						border: "1px solid var(--gray-6)",
						borderRadius: "var(--radius-1)",
					}}
				/>
				{errors.phone_number && (
					<Text color="red" size="2">
						{errors.phone_number}
					</Text>
				)}
			</Box>

			{/* 주소 */}
			<Box mb="2">
				<input
					name="address"
					placeholder="주소"
					value={formData.address}
					onChange={handleChange}
					style={{
						width: "100%",
						padding: "0.6rem",
						border: "1px solid var(--gray-6)",
						borderRadius: "var(--radius-1)",
					}}
				/>
				{errors.address && (
					<Text color="red" size="2">
						{errors.address}
					</Text>
				)}
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

