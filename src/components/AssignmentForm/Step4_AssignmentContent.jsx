"use client";

import React from "react";
import { Box, Flex, Button, Text } from "@radix-ui/themes";

export default function Step4_AssignmentContent({
	register,
	goToPrevStep,
	handleSubmit,
	onSubmit,
	errors,
}) {
	return (
		<form onSubmit={handleSubmit(onSubmit)}>
			<Box>
				<textarea
					{...register("description")}
					placeholder="예) 사건의 배경, 의뢰 진행 요청사항 등 의뢰내용을 입력해주세요."
					rows={5}
					className="
            w-full
            p-3
            border border-gray-6
            rounded text-gray-12
            focus:outline-none focus:border-gray-8
          "
					style={{ minHeight: "150px", lineHeight: "1.4" }}
				/>
				{errors?.description && (
					<Text color="red" size="2">
						{errors.description.message}
					</Text>
				)}
			</Box>

			<Flex justify="end" gap="2">
				<Button type="button" variant="soft" color="gray" onClick={goToPrevStep}>
					이전
				</Button>
				{/* 여기서도 type="submit" → Enter로 등록 가능 */}
				<Button type="submit" variant="solid">
					등록
				</Button>
			</Flex>
		</form>
	);
}

