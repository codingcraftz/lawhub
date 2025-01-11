"use client";

import React, { useState, useEffect } from "react";
import { Box, Flex, Button, Text } from "@radix-ui/themes";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";

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
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			{/* 오버레이 */}
			<Dialog.Overlay className="fixed inset-0 bg-black opacity-50 z-40" />

			{/* 컨텐츠 */}
			<Dialog.Content
				className="
          fixed 
          left-1/2 top-1/2 
          w-full max-w-[600px] 
          max-h-[85vh]
          -translate-x-1/2 -translate-y-1/2 
          rounded-md 
          p-[25px] 
          bg-gray-2 
          border border-gray-6 
          shadow-md shadow-gray-7 
          focus:outline-none 
          z-50 
          overflow-y-auto
        "
			>
				{/* 헤더 */}
				<Flex justify="between" align="center" className="mb-3">
					<Dialog.Title className="font-bold text-xl text-gray-12">
						{initialData ? "목표 수정" : "목표 등록"}
					</Dialog.Title>
					<Dialog.Close asChild>
						<Button variant="ghost" color="gray">
							<Cross2Icon width={25} height={25} />
						</Button>
					</Dialog.Close>
				</Flex>

				{/* 폼 본문 */}
				<form onSubmit={handleSubmit}>
					<Box mb="2">
						<Text size="2" color="gray" className="mb-1">
							목표를 작성하세요.
						</Text>
						<textarea
							name="description"
							placeholder="예) 채권 회수를 위한 책임추궁대상의 확장"
							value={formData.description}
							onChange={handleChange}
							className="
                w-full 
                p-2 
                border border-gray-6 
                rounded 
                text-gray-12
                focus:outline-none 
                focus:border-gray-8
              "
							rows={4}
						/>
						{errors.description && (
							<Text color="red" size="2" className="mt-1">
								{errors.description}
							</Text>
						)}
					</Box>

					<Flex justify="end" gap="2" mt="3">
						<Button
							variant="soft"
							color="gray"
							onClick={() => onOpenChange(false)}
						>
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

