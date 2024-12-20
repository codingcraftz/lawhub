// src/app/todos/DialogContent.jsx

import React, { useState, useEffect } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { supabase } from "@/utils/supabase";
import {
  Text,
  Box,
  Dialog,
  Button,
  TextArea,
  Flex,
  Tooltip,
} from "@radix-ui/themes";
import CommentForm from "./CommentForm";
import {
  Cross2Icon,
  FaceIcon,
  Pencil1Icon,
  TrashIcon,
} from "@radix-ui/react-icons";

const emojis = { check: "✔️", thumb: "👍", heart: "❤️" };
const reactionEmojis = [
  { type: "check", emoji: "✔️" },
  { type: "thumb", emoji: "👍" },
  { type: "heart", emoji: "❤️" },
];

const DialogContent = ({ selectedRequest, user }) => {
  const [comments, setComments] = useState([]);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const [reactions, setReactions] = useState([]);

  useEffect(() => {
    if (selectedRequest?.id) {
      fetchComments(selectedRequest.id);
    }
  }, [selectedRequest]);

  const fetchComments = async (requestId) => {
    const { data: commentsData, error: commentsError } = await supabase
      .from("request_comments")
      .select("*, user:users(name)")
      .eq("request_id", requestId)
      .order("created_at", { ascending: true });

    if (commentsError) {
      console.error("Error fetching comments:", commentsError);
    } else {
      setComments(commentsData);
      // 모든 댓글의 반응을 한번에 로드
      fetchReactions(commentsData.map((c) => c.id));
    }
  };

  const fetchReactions = async (commentIds) => {
    if (commentIds.length === 0) return;

    const { data: reactionsData, error: reactionsError } = await supabase
      .from("comment_reactions")
      .select("id, comment_id, user_id, reaction_type, user:users(name)")
      .in("comment_id", commentIds);

    if (reactionsError) {
      console.error("Error fetching reactions:", reactionsError);
    } else {
      const reactionList = reactionsData.map((reaction) => ({
        id: reaction.id,
        commentId: reaction.comment_id,
        reaction: reaction.reaction_type,
        user: reaction.user.name,
        userId: reaction.user_id,
      }));
      setReactions(reactionList);
    }
  };

  const handleReaction = async (commentId, reactionType) => {
    try {
      const { data: existingReaction, error } = await supabase
        .from("comment_reactions")
        .select("*")
        .eq("comment_id", commentId)
        .eq("reaction_type", reactionType)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error checking existing reaction:", error);
        return;
      }

      if (existingReaction) {
        // 이미 반응이 있으므로 제거
        const { error: deleteError } = await supabase
          .from("comment_reactions")
          .delete()
          .eq("id", existingReaction.id);

        if (deleteError) {
          console.error("Error deleting reaction:", deleteError);
          return;
        }
      } else {
        // 반응이 없으므로 추가
        const { error: insertError } = await supabase
          .from("comment_reactions")
          .insert({
            comment_id: commentId,
            user_id: user.id,
            reaction_type: reactionType,
          });

        if (insertError) {
          console.error("Error inserting reaction:", insertError);
          return;
        }
      }

      // 전체 댓글 및 반응 새로고침
      await fetchComments(selectedRequest.id);
    } catch (error) {
      console.error("Error handling reaction:", error);
    }
  };

  const handleEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditedContent(comment.content);
  };

  const handleSaveEdit = async () => {
    const { error } = await supabase
      .from("request_comments")
      .update({ content: editedContent })
      .eq("id", editingCommentId);

    if (!error) {
      setEditingCommentId(null);
      setEditedContent("");
      fetchComments(selectedRequest.id);
    } else {
      console.error("Error updating comment:", error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm("정말로 이 댓글을 삭제하시겠습니까?")) {
      const { error } = await supabase
        .from("request_comments")
        .delete()
        .eq("id", commentId);

      if (!error) {
        fetchComments(selectedRequest.id);
      } else {
        console.error("Error deleting comment:", error);
      }
    }
  };

  const handleAddComment = async (content) => {
    const { error } = await supabase.from("request_comments").insert({
      request_id: selectedRequest.id,
      user_id: user.id,
      content,
    });

    if (!error) {
      fetchComments(selectedRequest.id);
    } else {
      console.error("Error adding comment:", error);
    }
  };

  // 사용자가 해당 댓글에 특정 반응을 이미 했는지 확인하는 헬퍼 함수
  const userHasReaction = (commentId, reactionType) => {
    return reactions.some(
      (r) =>
        r.commentId === commentId &&
        r.reaction === reactionType &&
        r.userId === user.id,
    );
  };

  return (
    <Dialog.Content style={{ maxWidth: 600 }}>
      <Dialog.Title>
        {selectedRequest?.case_timelines?.case?.title}
      </Dialog.Title>
      <Dialog.Close asChild>
        <Button
          variant="ghost"
          color="gray"
          size="1"
          style={{ position: "absolute", top: 8, right: 8 }}
        >
          <Cross2Icon />
        </Button>
      </Dialog.Close>
      <Box className="mt-4">
        <Text as="p">{selectedRequest?.case_timelines?.description}</Text>
      </Box>
      <Box className="mt-6">
        <Text weight="bold" size="4">
          Comments
        </Text>
        {comments.map((comment) => (
          <Box key={comment.id} className="mt-2">
            <Flex justify="between">
              <Text size="2" color="gray">
                {comment.user?.name} (
                {new Date(comment.created_at).toLocaleString("ko-KR", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
                )
              </Text>
              {comment.user_id === user.id && (
                <Flex gap="1">
                  <Button
                    variant="ghost"
                    color="gray"
                    size="1"
                    onClick={() => handleEditComment(comment)}
                  >
                    <Pencil1Icon />
                  </Button>
                  <Button
                    variant="ghost"
                    color="gray"
                    size="1"
                    onClick={() => handleDeleteComment(comment.id)}
                  >
                    <TrashIcon />
                  </Button>
                </Flex>
              )}
            </Flex>

            {editingCommentId === comment.id ? (
              <Box>
                <TextArea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                />
                <Flex justify="end" gap="2" className="mt-2">
                  <Button
                    variant="soft"
                    color="gray"
                    onClick={() => setEditingCommentId(null)}
                  >
                    취소
                  </Button>
                  <Button onClick={handleSaveEdit}>저장</Button>
                </Flex>
              </Box>
            ) : (
              <>
                <Flex className="mb-2" justify="between" align="center">
                  <Text>{comment.content}</Text>
                </Flex>
                <Flex className="relative" gap="2">
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <div className="p-1 rounded-full bg-gray-200 hover:opacity-85 border border-gray-300 cursor-pointer">
                        <FaceIcon width={18} height={18} />
                      </div>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content className="absolute top-2 left-0 bg-white py-1 px-2 border border-gray-300 rounded-lg">
                        <Flex className="gap-4">
                          {reactionEmojis.map(({ type, emoji }) => {
                            const isUserReaction = userHasReaction(
                              comment.id,
                              type,
                            );
                            return (
                              <DropdownMenu.Item
                                key={type}
                                onClick={() => handleReaction(comment.id, type)}
                              >
                                <Button
                                  className={`flex items-center cursor-pointer px-1 rounded-lg hover:bg-gray-300 ${
                                    isUserReaction
                                      ? "border border-blue-400 bg-blue-100"
                                      : ""
                                  }`}
                                >
                                  {emoji}
                                </Button>
                              </DropdownMenu.Item>
                            );
                          })}
                        </Flex>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>

                  {/* 바깥쪽에 보여지는 반응들 */}
                  {reactions
                    .filter((reaction) => reaction.commentId === comment.id)
                    .map((reaction) => {
                      const isUserReaction =
                        reaction.userId === user.id &&
                        userHasReaction(comment.id, reaction.reaction);
                      return (
                        <Tooltip
                          key={reaction.id}
                          content={
                            <Box
                              style={{
                                padding: "0.5rem",
                                fontSize: "12px",
                                color: "var(--gray-12)",
                              }}
                            >
                              <p>
                                <strong>{reaction.user}</strong>
                              </p>
                            </Box>
                          }
                        >
                          <Box
                            className={`border inline-block px-1 rounded-lg ${
                              isUserReaction
                                ? "border-blue-400 bg-blue-100"
                                : ""
                            } cursor-pointer`}
                            onClick={() =>
                              isUserReaction
                                ? handleReaction(
                                    reaction.commentId,
                                    reaction.reaction,
                                  )
                                : null
                            }
                          >
                            <Text>{emojis[reaction.reaction]}</Text>
                          </Box>
                        </Tooltip>
                      );
                    })}
                </Flex>
              </>
            )}
          </Box>
        ))}

        {selectedRequest.status === "closed" ? (
          <Box
            style={{
              backgroundColor: "var(--gray-4)",
              color: "var(--gray-12)",
              padding: "0.5rem",
              borderRadius: "8px",
              textAlign: "center",
              fontWeight: "bold",
              fontSize: "1rem",
              marginTop: "1rem",
            }}
          >
            해당 요청은 완료되었습니다.
          </Box>
        ) : user.role === "client" ? null : (
          <CommentForm onAddComment={handleAddComment} />
        )}
      </Box>
    </Dialog.Content>
  );
};

export default DialogContent;
