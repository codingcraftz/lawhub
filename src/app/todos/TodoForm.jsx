"use client";

import React, { useState } from "react";
import { supabase } from "@/utils/supabase";
import { Dialog, Flex, Button, Box } from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";

const priorityOptions = ["높음", "중간", "낮음"];

const TodoForm = ({ todo, onSave, onClose }) => {
  const [title, setTitle] = useState(todo?.title || "");
  const [priority, setPriority] = useState(todo?.priority || "중간");

  const handleSave = async () => {
    if (!title.trim()) return;

    try {
      const { error } = await supabase
        .from("todos")
        .update({ title, priority })
        .eq("id", todo.id);

      if (error) throw error;

      onSave();
    } catch (error) {
      console.error("Error updating todo:", error);
    }
  };

  return (
    <Dialog.Root open onOpenChange={onClose}>
      <Dialog.Content style={{ maxWidth: 400 }}>
        <Dialog.Title>할 일 수정</Dialog.Title>
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

        <Box as="form" onSubmit={(e) => e.preventDefault()}>
          <Flex direction="column" gap="4">
            <Box>
              <input
                placeholder="할 일 제목"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.6rem 0.8rem",
                  border: "1px solid var(--gray-6)",
                  borderRadius: "var(--radius-1)",
                }}
              />
            </Box>

            <Box>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.6rem 0.8rem",
                  border: "1px solid var(--gray-6)",
                  borderRadius: "var(--radius-1)",
                }}
              >
                {priorityOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Box>

            <Flex gap="2" justify="end">
              <Button variant="soft" color="gray" onClick={onClose}>
                취소
              </Button>
              <Button onClick={handleSave}>저장</Button>
            </Flex>
          </Flex>
        </Box>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default TodoForm;
