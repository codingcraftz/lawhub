"use client";

import React, { useState } from "react";
import { Box, Flex, Button, Text } from "@radix-ui/themes";

const DebtorForm = ({ onOpenChange, onSubmit }) => {
	const [formData, setFormData] = useState({
		name: "",
		registration_number: "",
		phone_number: "",
		address: "",
	});
	const [errors, setErrors] = useState({});

	// 간단한 예시 검증
	const validate = () => {
		const newErrors = {};
		if (!formData.name.trim()) {
			newErrors.name = "이름은 필수입니다.";
		}
		if (!/^\d{13}$/.test(formData.registration_number)) {
			newErrors.registration_number = "주민등록번호는 13자리 숫자여야 합니다.";
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

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!validate()) return;
		await onSubmit(formData);
	};

	return (
		<form onSubmit={handleSubmit} style={{ marginTop: "1rem" }}>
			<Text size="4" weight="bold" mb="2">
				채무자 신규 추가
			</Text>
			<Box mb="2">
				<input
					name="name"
					placeholder="이름"
					value={formData.name}
					onChange={handleChange}
					style={{
						width: "100%",
						padding: "0.6rem",
						marginBottom: "0.3rem",
						border: "1px solid var(--gray-6)",
						borderRadius: "var(--radius-1)",
					}}
				/>
				{errors.name && <Text color="red">{errors.name}</Text>}
			</Box>
			<Box mb="2">
				<input
					name="registration_number"
					placeholder="주민등록번호 (13자리 숫자)"
					value={formData.registration_number}
					onChange={handleChange}
					style={{
						width: "100%",
						padding: "0.6rem",
						marginBottom: "0.3rem",
						border: "1px solid var(--gray-6)",
						borderRadius: "var(--radius-1)",
					}}
				/>
				{errors.registration_number && (
					<Text color="red">{errors.registration_number}</Text>
				)}
			</Box>
			<Box mb="2">
				<input
					name="phone_number"
					placeholder="전화번호 (10~11자리 숫자)"
					value={formData.phone_number}
					onChange={handleChange}
					style={{
						width: "100%",
						padding: "0.6rem",
						marginBottom: "0.3rem",
						border: "1px solid var(--gray-6)",
						borderRadius: "var(--radius-1)",
					}}
				/>
				{errors.phone_number && (
					<Text color="red">{errors.phone_number}</Text>
				)}
			</Box>
			<Box mb="2">
				<input
					name="address"
					placeholder="주소"
					value={formData.address}
					onChange={handleChange}
					style={{
						width: "100%",
						padding: "0.6rem",
						marginBottom: "0.3rem",
						border: "1px solid var(--gray-6)",
						borderRadius: "var(--radius-1)",
					}}
				/>
				{errors.address && <Text color="red">{errors.address}</Text>}
			</Box>

			<Flex justify="end" gap="2">
				<Button variant="outline" onClick={() => onOpenChange(false)}>
					취소
				</Button>
				<Button type="submit">등록</Button>
			</Flex>
		</form>
	);
};

export default DebtorForm;

