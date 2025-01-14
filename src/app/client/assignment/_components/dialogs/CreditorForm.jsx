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

	const handleChange = (e) => {
		setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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
          text-gray-12
          focus:outline-none
          z-50
          overflow-y-auto
        "
			>
				<Flex justify="between" align="center" className="mb-3">
					<Dialog.Title className="font-bold text-xl">
						채권자 {initialData ? "수정" : "등록"}
					</Dialog.Title>
					<Dialog.Close asChild>
						<Button variant="ghost" color="gray">
							<Cross2Icon width={20} height={20} />
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
							onChange={handleChange}
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

					{/* 생년월일 (YYYY-MM-DD) - 마스킹 */}
					<Box mb="3">
						<Text size="2" color="gray" className="mb-1">
							생년월일
						</Text>
						<InputMask
							mask="9999-99-99"
							maskChar={null}
							placeholder="예) 1990-05-11"
							value={formData.birth_date}
							onChange={(e) =>
								setFormData({ ...formData, birth_date: e.target.value })
							}
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
							onChange={(e) =>
								setFormData({ ...formData, phone_number: e.target.value })
							}
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
							placeholder="예) 서울특별시 강남구 ... "
							value={formData.address}
							onChange={handleChange}
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

					<Flex justify="end" gap="2">
						<Button variant="soft" color="gray" onClick={() => onOpenChange(false)}>
							닫기
						</Button>
						<Button variant="solid" type="submit">
							{initialData ? "수정" : "등록"}
						</Button>
					</Flex>
				</form>
			</Dialog.Content>
		</Dialog.Root>
	);
}

