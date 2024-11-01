// src/app/todos/CommentForm.jsx

import React, { useState } from "react";
import { TextArea, Button, Flex } from "@radix-ui/themes";

const CommentForm = ({ onAddComment }) => {
  const [newComment, setNewComment] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddComment(newComment);
    setNewComment("");
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <TextArea
        placeholder="댓글을 입력하세요..."
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        required
        style={{ minHeight: "80px" }}
      />
      <Flex justify="end" gap="2" className="mt-2">
        <Button type="submit">댓글 추가</Button>
      </Flex>
    </form>
  );
};

export default CommentForm;
