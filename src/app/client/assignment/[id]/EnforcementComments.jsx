// EnforcementComments.jsx

"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Flex, Text, Button, TextArea } from "@radix-ui/themes";

export default function EnforcementComments({ enforcementId, user }) {
	const [comments, setComments] = useState([]);
	const [newComment, setNewComment] = useState("");
	const [editingCommentId, setEditingCommentId] = useState(null);
	const [editedContent, setEditedContent] = useState("");
	const isAdmin = user?.role === "staff" || user?.role === "admin";

	// 1) 목록 불러오기
	const fetchComments = async () => {
		if (!enforcementId) return;
		const { data, error } = await supabase
			.from("enforcement_comments")
			.select("*, user:users(name)")
			.eq("enforcement_id", enforcementId)
			.order("created_at", { ascending: true });

		if (error) {
			console.error("Error fetching comments:", error);
		} else {
			setComments(data);
		}
	};

	useEffect(() => {
		fetchComments();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [enforcementId]);

	// 2) 추가
	const handleAddComment = async () => {
		if (!newComment.trim()) return;
		const { error } = await supabase.from("enforcement_comments").insert({
			enforcement_id: enforcementId,
			comment: newComment,
			user_id: user?.id,
		});
		if (error) {
			console.error("Error adding comment:", error);
			alert("댓글 등록 중 오류가 발생했습니다.");
		} else {
			setNewComment("");
			fetchComments();
		}
	};

	// 3) 수정
	const handleEditComment = async () => {
		if (!editedContent.trim()) return;
		const { error } = await supabase
			.from("enforcement_comments")
			.update({ comment: editedContent })
			.eq("id", editingCommentId);

		if (error) {
			console.error("Error editing comment:", error);
			alert("댓글 수정 중 오류가 발생했습니다.");
		} else {
			setEditingCommentId(null);
			setEditedContent("");
			fetchComments();
		}
	};

	// 4) 삭제
	const handleDeleteComment = async (id) => {
		if (!window.confirm("정말로 삭제하시겠습니까?")) return;
		const { error } = await supabase
			.from("enforcement_comments")
			.delete()
			.eq("id", id);

		if (error) {
			console.error("Error deleting comment:", error);
			alert("댓글 삭제 중 오류가 발생했습니다.");
		} else {
			fetchComments();
		}
	};

	return (
		<Box>
			{/* 목록 */}
			{comments.length === 0 ? (
				<Text size="2">등록된 댓글이 없습니다.</Text>
			) : (
				<Box className="space-y-4 mb-4">
					{comments.map((comment) => (
						<Box
							key={comment.id}
							className="p-3 bg-gray-3 border border-gray-6 rounded shadow-sm space-y-2"
						>
							<Flex justify="between" align="center">
								<Text size="2" weight="medium">
									{comment.user?.name}
								</Text>
								<Text size="1" color="gray">
									{new Date(comment.created_at).toLocaleString("ko-KR")}
								</Text>
							</Flex>

							{editingCommentId === comment.id ? (
								// 수정중
								<Box>
									<TextArea
										value={editedContent}
										onChange={(e) => setEditedContent(e.target.value)}
									/>
									<Flex gap="2" justify="end" className="mt-2">
										<Button
											variant="soft"
											onClick={() => {
												setEditingCommentId(null);
												setEditedContent("");
											}}
										>
											취소
										</Button>
										<Button onClick={handleEditComment}>저장</Button>
									</Flex>
								</Box>
							) : (
								// 일반 표시
								<Text>{comment.comment}</Text>
							)}

							{/* 수정/삭제 버튼: 작성자(또는 관리자)만 */}
							{(comment.user_id === user?.id || isAdmin) && editingCommentId !== comment.id && (
								<Flex gap="2" className="mt-2 justify-end">
									<Button
										variant="ghost"
										size="1"
										onClick={() => {
											setEditingCommentId(comment.id);
											setEditedContent(comment.comment);
										}}
									>
										수정
									</Button>
									<Button
										variant="ghost"
										size="1"
										onClick={() => handleDeleteComment(comment.id)}
									>
										삭제
									</Button>
								</Flex>
							)}
						</Box>
					))}
				</Box>
			)}

			{/* 새 댓글 등록 */}
			{(isAdmin || user?.id) && (
				<Box className="mt-4">
					<TextArea
						placeholder="댓글을 입력하세요"
						value={newComment}
						onChange={(e) => setNewComment(e.target.value)}
						className="mb-2 border border-gray-6 rounded p-2 w-full"
					/>
					<Flex justify="end">
						<Button onClick={handleAddComment}>등록</Button>
					</Flex>
				</Box>
			)}
		</Box>
	);
}

