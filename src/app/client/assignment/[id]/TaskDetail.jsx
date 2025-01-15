"use client";

import React, { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { supabase } from "@/utils/supabase";
import {
	Box,
	Flex,
	Text,
	Button,
	TextArea,
} from "@radix-ui/themes";
import { Cross2Icon, FaceIcon, Pencil1Icon, TrashIcon } from "@radix-ui/react-icons";
import { motion } from "framer-motion";

// 이모지
const reactionEmojis = [
	{ type: "check", emoji: "✔️" },
	{ type: "thumb", emoji: "👍" },
	{ type: "heart", emoji: "❤️" },
];
const emojiMap = {
	check: "✔️",
	thumb: "👍",
	heart: "❤️",
};

export default function TaskDetail({
	open,
	onOpenChange,
	task,
	user,
}) {
	const [comments, setComments] = useState([]);
	const [reactions, setReactions] = useState([]);
	const [newComment, setNewComment] = useState("");
	const [editingCommentId, setEditingCommentId] = useState(null);
	const [editedContent, setEditedContent] = useState("");

	const isAdmin = user?.role === "staff" || user?.role === "admin";

	// 1) 댓글 목록
	const fetchComments = async () => {
		const { data, error } = await supabase
			.from("task_comments")
			.select("*, user:users(name)")
			.eq("task_id", task.id)
			.order("created_at", { ascending: true });

		if (!error && data) {
			setComments(data);
			// 각 댓글 ID로부터 reactions 불러옴
			fetchReactions(data.map((c) => c.id));
		}
	};

	// 1-1) 반응 불러오기
	const fetchReactions = async (commentIds) => {
		if (commentIds.length === 0) return;
		const { data, error } = await supabase
			.from("task_comment_reactions")
			.select("id, comment_id, user_id, reaction_type, user:users(name)")
			.in("comment_id", commentIds);
		if (!error && data) {
			setReactions(data);
		}
	};

	useEffect(() => {
		if (open && task?.id) {
			fetchComments();
		}
	}, [open, task]);

	// 2) 댓글 추가
	const handleAddComment = async () => {
		if (!newComment.trim()) return;
		const { error } = await supabase
			.from("task_comments")
			.insert({
				task_id: task.id,
				user_id: user.id,
				content: newComment,
			});
		if (error) {
			console.error("Error adding comment:", error);
			alert("댓글 추가 중 오류가 발생했습니다.");
		} else {
			setNewComment("");
			fetchComments();
		}
	};

	// 3) 댓글 수정
	const startEditComment = (comment) => {
		setEditingCommentId(comment.id);
		setEditedContent(comment.content);
	};
	const handleSaveEdit = async () => {
		if (!editedContent.trim()) return;
		const { error } = await supabase
			.from("task_comments")
			.update({ content: editedContent })
			.eq("id", editingCommentId);
		if (!error) {
			setEditingCommentId(null);
			setEditedContent("");
			fetchComments();
		}
	};

	// 4) 댓글 삭제
	const handleDeleteComment = async (id) => {
		if (!window.confirm("정말 이 댓글을 삭제하시겠습니까?")) return;
		const { error } = await supabase
			.from("task_comments")
			.delete()
			.eq("id", id);
		if (!error) {
			fetchComments();
		}
	};

	// 5) 이모지 반응
	const handleReaction = async (commentId, reactionType) => {
		try {
			// 내가 이미 해당 이모지를 눌렀는지 확인
			const { data: existing, error } = await supabase
				.from("task_comment_reactions")
				.select("*")
				.eq("comment_id", commentId)
				.eq("reaction_type", reactionType)
				.eq("user_id", user.id)
				.maybeSingle();

			if (error) {
				console.error("Error checking reaction:", error);
				return;
			}

			if (existing) {
				// 이미 눌렀다면 삭제(토글)
				const { error: delErr } = await supabase
					.from("task_comment_reactions")
					.delete()
					.eq("id", existing.id);
				if (delErr) {
					console.error("Error removing reaction:", delErr);
				}
			} else {
				// 없으면 추가
				const { error: insErr } = await supabase
					.from("task_comment_reactions")
					.insert({
						comment_id: commentId,
						user_id: user.id,
						reaction_type: reactionType,
					});
				if (insErr) {
					console.error("Error inserting reaction:", insErr);
				}
			}
			fetchComments(); // 다시 fetch
		} catch (err) {
			console.error("Error handling reaction:", err);
		}
	};

	// 현재 유저가 해당 댓글에 해당 이모지를 눌렀는지 여부
	const userHasReaction = (commentId, reactionType) => {
		return reactions.some(
			(r) =>
				r.comment_id === commentId &&
				r.reaction_type === reactionType &&
				r.user_id === user.id
		);
	};

	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Overlay className="fixed inset-0 bg-black opacity-50 z-40" />
			<Dialog.Content
				className="
          fixed 
          left-1/2 top-1/2 
          max-h-[85vh] w-full max-w-[600px]
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
				<Flex justify="between" align="center" className="mb-4">
					<Dialog.Title className="font-bold text-xl">
						{task?.title} {task?.status === "closed" && <span className="text-red-9">[완결]</span>}
					</Dialog.Title>
					<Dialog.Close asChild>
						<Button variant="ghost" color="gray">
							<Cross2Icon />
						</Button>
					</Dialog.Close>
				</Flex>

				{/* 업무 내용 */}
				{task?.content && (
					<Box className="mb-4 p-2 bg-gray-3 rounded border border-gray-6">
						<Text size="2" color="gray">
							{task.content}
						</Text>
					</Box>
				)}

				{/* 댓글 목록 */}
				<Box>
					<Text className="font-semibold mb-2">댓글</Text>
					{comments.length === 0 ? (
						<Text size="2">등록된 댓글이 없습니다.</Text>
					) : (
						<Box className="space-y-4 mb-4">
							{comments.map((comment) => {
								// 이 댓글에 달린 이모지 reactions
								const cReactions = reactions.filter((r) => r.comment_id === comment.id);
								return (
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
											<Box>
												<TextArea
													value={editedContent}
													onChange={(e) => setEditedContent(e.target.value)}
													className="border border-gray-6 p-2 rounded w-full"
												/>
												<Flex justify="end" gap="2" className="mt-2">
													<Button
														variant="soft"
														color="gray"
														onClick={() => {
															setEditingCommentId(null);
															setEditedContent("");
														}}
													>
														취소
													</Button>
													<Button onClick={handleSaveEdit}>저장</Button>
												</Flex>
											</Box>
										) : (
											<Box>
												<Text size="2">{comment.content}</Text>
											</Box>
										)}

										{/* 이모지 영역 */}
										<Flex gap="2" className="mt-2 items-center">
											{/* 이모지 버튼 (staff/admin만 노출 가능) */}
											{isAdmin && editingCommentId !== comment.id && (
												<Flex gap="1">
													{reactionEmojis.map(({ type, emoji }) => {
														const hasReacted = userHasReaction(comment.id, type);
														return (
															<Button
																key={type}
																size="1"
																variant="ghost"
																className={hasReacted ? "bg-blue-3" : ""}
																onClick={() => handleReaction(comment.id, type)}
															>
																{emoji}
															</Button>
														);
													})}
												</Flex>
											)}

											{/* 이 댓글에 달린 reaction들 */}
											{cReactions.map((react) => {
												const isMine = react.user_id === user.id;
												return (
													<Box
														key={react.id}
														className={`
                              inline-block px-1 rounded-lg border
                              ${isMine ? "border-blue-400 bg-blue-100" : "border-gray-7"}
                              cursor-pointer
                            `}
														onClick={() =>
															isMine
																? handleReaction(react.comment_id, react.reaction_type)
																: null
														}
													>
														<Text size="2">{emojiMap[react.reaction_type]}</Text>
													</Box>
												);
											})}
										</Flex>

										{/* 수정/삭제 버튼 (본인 or admin) */}
										{editingCommentId !== comment.id &&
											(comment.user_id === user.id || isAdmin) && (
												<Flex gap="2" className="mt-2 justify-end">
													<Button
														variant="ghost"
														size="1"
														onClick={() => {
															setEditingCommentId(comment.id);
															setEditedContent(comment.content);
														}}
													>
														<Pencil1Icon />
													</Button>
													<Button
														variant="ghost"
														size="1"
														onClick={() => handleDeleteComment(comment.id)}
													>
														<TrashIcon />
													</Button>
												</Flex>
											)}
									</Box>
								);
							})}
						</Box>
					)}
				</Box>

				{/* 댓글 작성 (ongoing일 때만) */}
				{task?.status === "ongoing" && (isAdmin || user?.id) && (
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
			</Dialog.Content>
		</Dialog.Root>
	);
}

