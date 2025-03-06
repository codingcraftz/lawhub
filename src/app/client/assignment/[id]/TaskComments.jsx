// src/app/client/assignment/[id]/TaskComments.jsx

"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Text, Button, TextArea, Flex } from "@radix-ui/themes";
import { FaceIcon } from "@radix-ui/react-icons";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"; // Radix UI
import * as Tooltip from "@radix-ui/react-tooltip";

const reactionEmojis = [
  { type: "check", emoji: "✔️" },
  { type: "thumb", emoji: "👍" },
  { type: "heart", emoji: "❤️" },
];

// TaskComments 컴포넌트
export default function TaskComments({ taskId, user }) {
  const [comments, setComments] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedContent, setEditedContent] = useState("");

  const isAdmin = user?.role === "staff" || user?.role === "admin";

  // 1) 댓글 목록 불러오기
  const fetchComments = async () => {
    if (!taskId) return;
    const { data: commentData, error } = await supabase
      .from("task_comments")
      .select("*, user:users(name)")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    if (!error && commentData) {
      setComments(commentData);
      // 댓글 ID 목록 추출 → reactions 조회
      const commentIds = commentData.map((c) => c.id);
      fetchReactions(commentIds);
    }
  };

  // 1-1) 이모지 반응 목록
  const fetchReactions = async (commentIds) => {
    if (commentIds.length === 0) return;
    const { data: reactionData, error } = await supabase
      .from("task_comment_reactions")
      .select("id, comment_id, user_id, reaction_type, user:users(name)")
      .in("comment_id", commentIds);

    if (!error && reactionData) {
      setReactions(reactionData);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [taskId]);

  // 2) 댓글 추가
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    const { error } = await supabase.from("task_comments").insert({
      task_id: taskId,
      user_id: user.id,
      content: newComment,
    });

    if (error) {
      console.error("Error adding comment:", error);
      alert("댓글 등록 중 오류가 발생했습니다.");
    } else {
      setNewComment("");
      fetchComments();
    }
  };

  // 3) 댓글 수정 모드 진입
  const startEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditedContent(comment.content);
  };

  // 3-1) 댓글 수정 저장
  const handleSaveEdit = async () => {
    if (!editedContent.trim()) return;
    const { error } = await supabase
      .from("task_comments")
      .update({ content: editedContent })
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

  // 4) 댓글 삭제
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("정말 이 댓글을 삭제하시겠습니까?")) return;
    const { error } = await supabase
      .from("task_comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      console.error("Error deleting comment:", error);
      alert("댓글 삭제 중 오류가 발생했습니다.");
    } else {
      fetchComments();
    }
  };

  // 5) 이모지 반응 (토글)
  const handleReaction = async (commentId, reactionType) => {
    // 1) 이미 눌렀는지 확인
    const existing = reactions.find(
      (r) =>
        r.comment_id === commentId &&
        r.reaction_type === reactionType &&
        r.user_id === user.id,
    );

    if (existing) {
      // 이미 있으면 삭제
      const { error: delErr } = await supabase
        .from("task_comment_reactions")
        .delete()
        .eq("id", existing.id);
      if (delErr) {
        console.error("Error removing reaction:", delErr);
      }
    } else {
      // 없다면 추가
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
    fetchComments();
  };

  // 사용자(본인)가 해당 댓글에 이모지를 눌렀는지 여부
  const userHasReaction = (commentId, reactionType) => {
    return reactions.some(
      (r) =>
        r.comment_id === commentId &&
        r.reaction_type === reactionType &&
        r.user_id === user.id,
    );
  };

  const renderReactions = (commentId) => {
    const groupedReactions = reactionEmojis.map(({ type, emoji }) => {
      const reactionsOfType = reactions.filter(
        (r) => r.comment_id === commentId && r.reaction_type === type,
      );

      const userNames = reactionsOfType.map((r) => r.user.name).join(", ");
      const reactionCount = reactionsOfType.length;

      if (reactionCount === 0) return null;

      return (
        <Tooltip.Root key={type}>
          <Tooltip.Trigger asChild>
            <Box
              className={`
								inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-sm
								${
                  reactionsOfType.some((r) => r.user_id === user.id)
                    ? "border-blue-400 bg-blue-100"
                    : "border-gray-7"
                }
								cursor-pointer
							`}
              onClick={() => handleReaction(commentId, type)}
            >
              {emoji} {reactionCount > 1 && <span>({reactionCount})</span>}
            </Box>
          </Tooltip.Trigger>
          <Tooltip.Content
            side="top"
            sideOffset={5}
            className="bg-gray-1 border border-gray-6 p-2 rounded shadow-lg text-sm"
          >
            <Text>{userNames || "No users reacted yet"}</Text>
          </Tooltip.Content>
        </Tooltip.Root>
      );
    });

    return <div className="flex gap-2">{groupedReactions}</div>;
  };

  // (A) 이모지 선택 드롭다운 트리거
  const EmojiDropdown = ({ commentId }) => {
    return (
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <Button size="2" variant="ghost">
            <FaceIcon className="w-5 h-5" />
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            sideOffset={5}
            className="bg-gray-2 border border-gray-6 rounded p-2 shadow-lg z-50"
          >
            <Flex gap="2">
              {reactionEmojis.map(({ type, emoji }) => {
                return (
                  <DropdownMenu.Item
                    key={type}
                    className="cursor-pointer focus:outline-none"
                    onSelect={() => handleReaction(commentId, type)}
                  >
                    <Button variant="ghost" size="1" className="mx-1">
                      {emoji}
                    </Button>
                  </DropdownMenu.Item>
                );
              })}
            </Flex>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    );
  };

  return (
    <Box className="mt-4">
      <h1 className="font-semibold mb-3">댓글</h1>
      {comments.length === 0 ? (
        <p size="2" color="gray">
          등록된 댓글이 없습니다.
        </p>
      ) : (
        <Box className="space-y-3 mb-4">
          {comments.map((comment) => {
            const commentOwner = comment.user_id === user.id;
            const commentReactions = reactions.filter(
              (r) => r.comment_id === comment.id,
            );

            return (
              <Box
                key={comment.id}
                className="bg-gray-3 border border-gray-6 rounded p-3"
              >
                <Flex justify="between" align="center" className="mb-2">
                  <Text weight="medium">
                    {comment.user?.name || "알 수 없음"}
                  </Text>
                  <Text color="gray">
                    {new Date(comment.created_at).toLocaleString("ko-KR")}
                  </Text>
                </Flex>

                {/* 본문 (수정 모드 or 일반) */}
                {editingCommentId === comment.id ? (
                  <Box>
                    <TextArea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="border border-gray-6 rounded p-2 w-full"
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
                  <Text>{comment.content}</Text>
                )}

                <Flex className="justify-between items-center mt-2">
                  <div className="flex items-center gap-4">
                    {(isAdmin || commentOwner) &&
                      editingCommentId !== comment.id && (
                        <EmojiDropdown commentId={comment.id} />
                      )}
                    <div className="flex gap-2">
                      {renderReactions(comment.id)}
                    </div>
                  </div>

                  {/* 수정/삭제 버튼: 작성자거나 Admin이면 */}
                  {editingCommentId !== comment.id && commentOwner && (
                    <Flex justify="end" gap="2" className="mt-2">
                      <Button
                        variant="ghost"
                        onClick={() => startEditComment(comment)}
                      >
                        수정
                      </Button>
                      <Button
                        variant="ghost"
                        color="red"
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        삭제
                      </Button>
                    </Flex>
                  )}
                </Flex>
              </Box>
            );
          })}
        </Box>
      )}
      {isAdmin && (
        <Box>
          <TextArea
            placeholder="댓글을 입력하세요"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="border border-gray-6 rounded p-2 w-full mb-2"
          />
          <Flex justify="end">
            <Button variant="soft" onClick={handleAddComment}>
              댓글 작성
            </Button>
          </Flex>
        </Box>
      )}
    </Box>
  );
}
