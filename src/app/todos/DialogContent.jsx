// src/app/todos/DialogContent.jsx

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Text, Box, Dialog, Button, TextArea, Flex } from "@radix-ui/themes";
import CommentForm from "./CommentForm";
import { Cross2Icon, Pencil1Icon, TrashIcon } from "@radix-ui/react-icons";

const DialogContent = ({ selectedRequest, user }) => {
  const [comments, setComments] = useState([]);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedContent, setEditedContent] = useState("");

  useEffect(() => {
    fetchComments(selectedRequest.id);
  }, [selectedRequest]);

  const fetchComments = async (requestId) => {
    const { data, error } = await supabase
      .from("request_comments")
      .select("*, user:users(name)")
      .eq("request_id", requestId)
      .order("created_at", { ascending: true });

    if (error) console.error("Error fetching comments:", error);
    else setComments(data);
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

  console.log(selectedRequest);
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
              <Flex justify="between" align="center">
                <Text>{comment.content}</Text>
              </Flex>
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
