"use client";

import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Box, Flex, Button, Text } from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";
import InputMask from "react-input-mask";

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
			setFormData(initialData);
		}
	}, [initialData]);

	const validate = () => {
		const newErrors = {};

		if (!formData.name.trim()) {
			newErrors.name = "이름은 필수입니다.";
		}
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		if (!validate()) return;
		onSubmit(formData);
	};

	const handleChange = (fieldName, value) => {
		setFormData((prev) => ({ ...prev, [fieldName]: value }));
	};

	return (
		<form onSubmit={handleSubmit} style={{ marginTop: "1rem" }}>
			<Text size="4" weight="bold" mb="2">
				채권자 {initialData ? "수정" : "추가"}
			</Text>

			{/* 이름 */}
			<Box mb="2">
				<input
					name="name"
					placeholder="홍길동"
					value={formData.name}
					onChange={(e) => handleChange("name", e.target.value)}
					className="
            w-full p-2
            border border-gray-6
            rounded text-gray-12
            focus:outline-none focus:border-gray-8
          "
				/>
				{errors.name && (
					<Text color="red" size="2">
						{errors.name}
					</Text>
				)}
			</Box>

			{/* 생년월일 (마스킹: YYYY-MM-DD) */}
			<Box mb="2">
				<InputMask
					mask="9999-99-99"
					maskChar={null}
					placeholder="예) 1990-12-25"
					value={formData.birth_date}
					onChange={(e) => handleChange("birth_date", e.target.value)}
				>
					{(inputProps) => (
						<input
							{...inputProps}
							name="birth_date"
							className="
                w-full p-2
                border border-gray-6
                rounded text-gray-12
                focus:outline-none focus:border-gray-8
              "
						/>
					)}
				</InputMask>
				{errors.birth_date && (
					<Text color="red" size="2">
						{errors.birth_date}
					</Text>
				)}
			</Box>

			{/* 전화번호 (마스킹: 010-9999-9999) */}
			<Box mb="2">
				<InputMask
					mask="999-9999-9999"
					maskChar={null}
					placeholder="예) 010-2345-9600"
					value={formData.phone_number}
					onChange={(e) => handleChange("phone_number", e.target.value)}
				>
					{(inputProps) => (
						<input
							{...inputProps}
							name="phone_number"
							className="
                w-full p-2
                border border-gray-6
                rounded text-gray-12
                focus:outline-none focus:border-gray-8
              "
						/>
					)}
				</InputMask>
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
					placeholder="예) 서울특별시 강남구 ..."
					value={formData.address}
					onChange={(e) => handleChange("address", e.target.value)}
					className="
            w-full p-2
            border border-gray-6
            rounded text-gray-12
            focus:outline-none focus:border-gray-8
          "
				/>
				{errors.address && (
					<Text color="red" size="2">
						{errors.address}
					</Text>
				)}
			</Box>

			<Flex justify="end" gap="2" mt="3">
				<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
					닫기
				</Button>
				<Button type="submit" variant="solid">
					{initialData ? "수정" : "추가"}
				</Button>
			</Flex>
		</form>
	);
}

