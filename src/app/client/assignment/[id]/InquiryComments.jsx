// src/app/client/assignment/[id]/InquiryComments.jsx

"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Flex, Text, Button, TextArea } from "@radix-ui/themes";

const InquiryComments = ({ inquiryId, user }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState("");

  // 댓글 목록 불러오기
  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("assignment_inquiry_comments")
      .select(
        `
        id,
        comment,
        created_at,
        user: user_id(id, name)
      `,
      )
      .eq("inquiry_id", inquiryId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching comments:", error);
      return;
    }
    setComments(data);
  };

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inquiryId]);

  // 댓글 등록
  const handleAddComment = async () => {
    if (!newComment.trim()) {
      alert("댓글을 입력해주세요.");
      return;
    }
    const { error } = await supabase
      .from("assignment_inquiry_comments")
      .insert({
        inquiry_id: inquiryId,
        user_id: user.id,
        comment: newComment,
      });
    if (error) {
      console.error("Error adding comment:", error);
      alert("댓글 등록 중 오류가 발생했습니다.");
    } else {
      setNewComment("");
      fetchComments();
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async (id) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    const { error } = await supabase
      .from("assignment_inquiry_comments")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting comment:", error);
      alert("댓글 삭제 중 오류가 발생했습니다.");
    } else {
      fetchComments();
    }
  };

  // 댓글 수정
  const handleUpdateComment = async (id) => {
    if (!editingContent.trim()) {
      alert("수정할 내용을 입력해주세요.");
      return;
    }

    const { error } = await supabase
      .from("assignment_inquiry_comments")
      .update({ comment: editingContent })
      .eq("id", id);

    if (error) {
      console.error("Error updating comment:", error);
      alert("댓글 수정 중 오류가 발생했습니다.");
    } else {
      setEditingCommentId(null);
      setEditingContent("");
      fetchComments();
    }
  };

  return (
    <Box>
      <Text className="mb-2 font-semibold">댓글</Text>

      {/* 댓글 목록 */}
      {comments.length === 0 ? (
        <Text as="p" className="mb-2">
          등록된 댓글이 없습니다.
        </Text>
      ) : (
        <Box className="space-y-2 mb-2">
          {comments.map((c) => (
            <Box key={c.id} className="bg-gray-3 p-2 rounded">
              <Flex justify="between" className="mb-1">
                <Text size="2" weight="bold">
                  {c.user?.name}
                </Text>
                <Text size="1" color="gray">
                  {new Date(c.created_at).toLocaleString("ko-KR")}
                </Text>
              </Flex>

              {/* 수정 중인지 여부에 따라 표시 */}
              {editingCommentId === c.id ? (
                <>
                  <TextArea
                    className="mb-2"
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                  />
                  <Flex justify="end" gap="2">
                    <Button
                      variant="soft"
                      onClick={() => {
                        setEditingCommentId(null);
                        setEditingContent("");
                      }}
                    >
                      취소
                    </Button>
                    <Button onClick={() => handleUpdateComment(c.id)}>
                      저장
                    </Button>
                  </Flex>
                </>
              ) : (
                <>
                  <Text className="mb-1">{c.comment}</Text>
                  {/* 본인 댓글만 수정/삭제 표시 */}
                  {c.user?.id === user.id && (
                    <Flex gap="2" justify="end">
                      <Button
                        variant="ghost"
                        size="1"
                        onClick={() => {
                          setEditingCommentId(c.id);
                          setEditingContent(c.comment);
                        }}
                      >
                        수정
                      </Button>
                      <Button
                        variant="ghost"
                        size="1"
                        color="red"
                        onClick={() => handleDeleteComment(c.id)}
                      >
                        삭제
                      </Button>
                    </Flex>
                  )}
                </>
              )}
            </Box>
          ))}
        </Box>
      )}

      {/* 새 댓글 작성 폼 */}
      <Box>
        <TextArea
          placeholder="댓글을 입력하세요"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="mb-2"
        />
        <Flex justify="end">
          <Button onClick={handleAddComment}>댓글 등록</Button>
        </Flex>
      </Box>
    </Box>
  );
};

export default InquiryComments;
