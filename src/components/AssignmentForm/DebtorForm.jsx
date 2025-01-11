"use client";

import React, { useState } from "react";
import { Box, Flex, Button, Text } from "@radix-ui/themes";
import InputMask from "react-input-mask";

export default function DebtorForm({ onOpenChange, onSubmit }) {
	const [formData, setFormData] = useState({
		name: "",
		birth_date: "",
		phone_number: "",
		address: "",
	});
	const [errors, setErrors] = useState({});

	const validate = () => {
		const newErrors = {};
		if (!formData.name.trim()) {
			newErrors.name = "이름은 필수입니다.";
		}
		// 날짜: YYYY-MM-DD
		const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
		if (!dateRegex.test(formData.birth_date)) {
			newErrors.birth_date = "생년월일을 YYYY-MM-DD 형식으로 입력해주세요.";
		}
		// 전화번호(010-XXXX-XXXX)
		const phoneRegex = /^\d{3}-\d{3,4}-\d{4}$/;
		if (!phoneRegex.test(formData.phone_number)) {
			newErrors.phone_number = "전화번호를 010-XXXX-XXXX 형식으로 입력해주세요.";
		}
		if (!formData.address.trim()) {
			newErrors.address = "주소는 필수입니다.";
		}
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleChange = (fieldName, value) => {
		setFormData((prev) => ({ ...prev, [fieldName]: value }));
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		if (!validate()) return;
		onSubmit(formData);
	};

	return (
		<form onSubmit={handleSubmit} style={{ marginTop: "1rem" }}>
			<Text size="4" weight="bold" mb="2">
				채무자 추가
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

			{/* 생년월일 (마스킹) */}
			<Box mb="2">
				<InputMask
					mask="9999-99-99"
					maskChar={null}
					placeholder="YYYY-MM-DD (예: 1992-05-11)"
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

			{/* 전화번호 (마스킹) */}
			<Box mb="2">
				<InputMask
					mask="999-9999-9999"
					maskChar={null}
					placeholder="전화번호 (예: 010-2345-9600)"
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
					placeholder="예) 부산광역시 해운대구 ..."
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
				{/* 추가 버튼: type="submit" → Enter로 제출 가능 */}
				<Button type="submit">추가</Button>
			</Flex>
		</form>
	);
}

