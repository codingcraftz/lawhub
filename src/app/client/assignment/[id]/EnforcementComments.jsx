import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { supabase } from "@/utils/supabase";
import { TextArea, Box, Button, Flex, Text } from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";

const EnforcementComments = ({ enforcementId, open, onOpenChange, user }) => {
	const [comments, setComments] = useState([]);
	const [newComment, setNewComment] = useState("");
	const [editingCommentId, setEditingCommentId] = useState(null);
	const [editedContent, setEditedContent] = useState("");
	const isAdmin = user?.role === "staff" || user?.role === "admin";


	useEffect(() => {
		if (enforcementId) fetchComments(enforcementId);
	}, [enforcementId]);

	const fetchComments = async (id) => {
		const { data, error } = await supabase
			.from("enforcement_comments")
			.select("*, user:users(name)")
			.eq("enforcement_id", id)
			.order("created_at", { ascending: true });

		if (error) {
			console.error("Error fetching comments:", error);
		} else {
			setComments(data);
		}
	};

	// Add a new comment
	const handleAddComment = async () => {
		if (!newComment.trim()) return;

		const { error } = await supabase.from("enforcement_comments").insert({
			enforcement_id: enforcementId,
			comment: newComment,
			user_id: user?.id,
		});

		if (error) {
			console.error("Error adding comment:", error);
		} else {
			setNewComment("");
			fetchComments(enforcementId);
		}
	};

	// Edit an existing comment
	const handleEditComment = async () => {
		if (!editedContent.trim()) return;

		const { error } = await supabase
			.from("enforcement_comments")
			.update({ comment: editedContent })
			.eq("id", editingCommentId);

		if (error) {
			console.error("Error editing comment:", error);
		} else {
			setEditingCommentId(null);
			setEditedContent("");
			fetchComments(enforcementId);
		}
	};

	// Delete a comment
	const handleDeleteComment = async (id) => {
		if (window.confirm("정말로 삭제하시겠습니까?")) {
			const { error } = await supabase
				.from("enforcement_comments")
				.delete()
				.eq("id", id);

			if (error) {
				console.error("Error deleting comment:", error);
			} else {
				fetchComments(enforcementId);
			}
		}
	};

	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Overlay className="fixed inset-0 bg-black opacity-50 z-30" />
			<Dialog.Content className="fixed bg-white left-1/2 top-1/2 max-h-[85vh] min-w-[650px] max-w-[1024px] -translate-x-1/2 -translate-y-1/2 rounded-md p-[25px] shadow z-40">
				<Dialog.Title className="font-bold text-xl">소송 상세보기</Dialog.Title>
				<Dialog.Close asChild>
					<Button
						variant="ghost"
						color="gray"
						style={{ position: "absolute", top: 24, right: 24 }}
					>
						<Cross2Icon width={25} height={25} />
					</Button>
				</Dialog.Close>

				<Box>
					<Text weight="bold" size="4" className="mb-4">
						진행 경로
					</Text>
					<Box className="space-y-4">
						{comments.map((comment) => (
							<Box
								key={comment.id}
								className="p-3 bg-gray-2 rounded shadow-sm space-y-2"
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
									<Box>
										<TextArea
											value={editedContent}
											onChange={(e) => setEditedContent(e.target.value)}
										/>
										<Flex gap="2" justify="end" className="mt-2">
											<Button
												variant="soft"
												onClick={() => setEditingCommentId(null)}
											>
												취소
											</Button>
											<Button onClick={handleEditComment}>저장</Button>
										</Flex>
									</Box>
								) : (
									<Text>{comment.comment}</Text>
								)}
								{comment.user_id === user?.id && (
									<Flex gap="2" className="mt-2">
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

					{isAdmin && (
						<Box className="mt-4">
							<TextArea
								placeholder="댓글을 입력하세요"
								value={newComment}
								onChange={(e) => setNewComment(e.target.value)}
							/>
							<Flex justify="end" className="mt-2">
								<Button onClick={handleAddComment}>등록</Button>
							</Flex>
						</Box>
					)}
				</Box>
			</Dialog.Content>
		</Dialog.Root>
	);
};

export default EnforcementComments;
