"use client";

import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Box, Flex, Button, Text } from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";

export default function DebtorForm({ onOpenChange, onSubmit, initialData = null }) {
	const [formData, setFormData] = useState({
		name: "",
		birth_date: "",
		phone_number: "",
		address: "",
	});

	const [errors, setErrors] = useState({});

	// 수정 모드일 경우 초기 데이터 로드
	useEffect(() => {
		if (initialData) {
			setFormData({
				name: initialData.name || "",
				birth_date: initialData.birth_date || "",
				phone_number: initialData.phone_number || "",
				address: initialData.address || "",
			});
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
		onSubmit(formData); // 부모 컴포넌트에 데이터 전달
	};

	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Overlay className="fixed inset-0 bg-black opacity-75 z-10" />
			<Dialog.Content className="fixed bg-gray-3 left-1/2 top-1/2 max-h-[85vh] min-w-[450px] max-w-[650px] -translate-x-1/2 -translate-y-1/2 rounded-md p-[25px] shadow focus:outline-none data-[state=open]:animate-contentShow z-20 overflow-y-auto">
				<Dialog.Title className="font-bold text-xl">채권 정보</Dialog.Title>
				<Dialog.Close asChild>
					<Button
						variant="ghost"
						color="gray"
						style={{ position: "absolute", top: 24, right: 24 }}
					>
						<Cross2Icon width={25} height={25} />
					</Button>
				</Dialog.Close>

				<form onSubmit={handleSubmit} style={{ marginTop: "1rem" }}>
					<Text size="4" weight="bold" mb="2">
						{initialData ? "채무자 수정" : "채무자 추가"}
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

					{/* 버튼 */}
					<Flex justify="end" gap="2" mt="3">
						<Button variant="outline" onClick={() => onOpenChange(false)}>
							취소
						</Button>
						<Button type="submit">
							{initialData ? "수정" : "추가"}
						</Button>
					</Flex>
				</form>
			</Dialog.Content>
		</Dialog.Root>
	);
}

