"use client";

import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Box, Flex, Button, Text } from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";
import InputMask from "react-input-mask"; // ★ react-input-mask

export default function DebtorForm({ onOpenChange, onSubmit, initialData = null }) {
	const [formData, setFormData] = useState({
		name: "",
		birth_date: "",
		phone_number: "",
		address: "",
	});

	const [errors, setErrors] = useState({});

	// 수정 모드 초기 데이터 로드
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

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleChangeRaw = (name, value) => {
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		if (!validate()) return;
		onSubmit(formData);
	};

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
          focus:outline-none
          z-50
          overflow-y-auto
          text-gray-12
        "
			>
				<Flex justify="between" align="center" className="mb-3">
					<Dialog.Title className="font-bold text-xl">
						{initialData ? "채무자 수정" : "채무자 추가"}
					</Dialog.Title>
					<Dialog.Close asChild>
						<Button variant="ghost" color="gray">
							<Cross2Icon width={25} height={25} />
						</Button>
					</Dialog.Close>
				</Flex>

				<form onSubmit={handleSubmit}>
					{/* 이름 */}
					<Box mb="3">
						<Text size="2" color="gray" className="mb-1">
							이름
						</Text>
						<input
							name="name"
							placeholder="홍길동"
							value={formData.name}
							onChange={(e) => handleChangeRaw("name", e.target.value)}
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
					<Box mb="3">
						<Text size="2" color="gray" className="mb-1">
							생년월일
						</Text>
						<InputMask
							mask="9999-99-99"
							maskChar={null}
							placeholder="예) 1995-03-22"
							value={formData.birth_date}
							onChange={(e) => handleChangeRaw("birth_date", e.target.value)}
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
					<Box mb="3">
						<Text size="2" color="gray" className="mb-1">
							전화번호
						</Text>
						<InputMask
							mask="999-9999-9999"
							maskChar={null}
							placeholder="예) 010-2345-9600"
							value={formData.phone_number}
							onChange={(e) => handleChangeRaw("phone_number", e.target.value)}
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
					<Box mb="4">
						<Text size="2" color="gray" className="mb-1">
							주소
						</Text>
						<input
							name="address"
							placeholder="예) 부산광역시 해운대구 ... "
							value={formData.address}
							onChange={(e) => handleChangeRaw("address", e.target.value)}
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

					{/* 버튼 */}
					<Flex justify="end" gap="2">
						<Button type="button" variant="soft" color="gray" onClick={() => onOpenChange(false)}>
							닫기
						</Button>
						<Button variant="solid" type="submit">
							{initialData ? "수정" : "추가"}
						</Button>
					</Flex>
				</form>
			</Dialog.Content>
		</Dialog.Root>
	);
}

