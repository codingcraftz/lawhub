"use client";

import React, { useEffect, useState } from "react";
import { Box, Flex, Text, TextArea, Button } from "@radix-ui/themes";
import { useForm } from "react-hook-form";
import { supabase } from "@/utils/supabase";

export default function InquiryComments({ inquiryId, user }) {
	const [comments, setComments] = useState([]);
	const { register, handleSubmit, reset } = useForm();

	const fetchComments = async () => {
		try {
			const { data, error } = await supabase
				.from("assignment_inquiry_comments")
				.select(
					`
            id,
            inquiry_id,
            user_id,
            comment,
            created_at,
            user:user_id(name)
          `
				)
				.eq("inquiry_id", inquiryId)
				.order("created_at", { ascending: true });

			if (error) throw error;
			setComments(data || []);
		} catch (err) {
			console.error(err);
		}
	};

	// 문의 댓글 목록 가져오기
	useEffect(() => {
		if (inquiryId) {
			fetchComments();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [inquiryId]);

	// 댓글 등록
	const onSubmit = async (formData) => {
		if (!user?.id) {
			alert("로그인이 필요합니다.");
			return;
		}

		const commentText = formData.comment?.trim();
		if (!commentText) return;

		try {
			const { error } = await supabase.from("assignment_inquiry_comments").insert({
				inquiry_id: inquiryId,
				user_id: user.id,
				comment: commentText,
				created_at: new Date().toISOString(),
			});
			if (error) throw error;

			reset(); // 폼 리셋
			fetchComments(); // 새로고침
		} catch (err) {
			console.error(err);
			alert("댓글 등록 오류가 발생했습니다.");
		}
	};

	return (
		<Box>
			<Text size="2" color="gray" className="mb-2">
				문의 댓글
			</Text>

			{/* 댓글 목록 */}
			<Box className="mb-4">
				{comments.length > 0 ? (
					comments.map((c) => (
						<Box key={c.id} className="mb-2 p-2 border border-gray-6 rounded">
							<Text size="2" color="gray">
								{c.user?.name || "이름 없음"} /{" "}
								{new Date(c.created_at).toLocaleString("ko-KR")}
							</Text>
							<Text size="3" className="mt-1 text-gray-12 whitespace-pre-wrap">
								{c.comment}
							</Text>
						</Box>
					))
				) : (
					<Text>아직 댓글이 없습니다. 첫 댓글을 작성해주세요!</Text>
				)}
			</Box>

			{/* 댓글 작성 폼 */}
			<form onSubmit={handleSubmit(onSubmit)}>
				<Flex direction="column" gap="2">
					<TextArea
						{...register("comment")}
						placeholder="댓글 입력"
						className="border border-gray-6 p-2 rounded"
					/>
					<Flex justify="end">
						<Button type="submit" variant="solid">
							등록
						</Button>
					</Flex>
				</Flex>
			</form>
		</Box>
	);
}

