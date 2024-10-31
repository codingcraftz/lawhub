// src/app/admin/_components/CaseCategoryManagement.jsx

"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Text, Flex, Button, Table } from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";
import * as DialogPrimitive from "@radix-ui/react-dialog";

const CaseCategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("case_categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching categories:", error);
    } else {
      setCategories(data);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleEdit = (category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setIsDialogOpen(true);
  };

  const handleDelete = async (categoryId) => {
    if (confirm("정말로 이 카테고리를 삭제하시겠습니까?")) {
      const { error } = await supabase
        .from("case_categories")
        .delete()
        .eq("id", categoryId);

      if (error) {
        console.error("Error deleting category:", error);
      } else {
        fetchCategories();
      }
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!categoryName.trim()) {
      alert("카테고리 이름을 입력해주세요.");
      return;
    }

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from("case_categories")
          .update({ name: categoryName })
          .eq("id", editingCategory.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("case_categories")
          .insert({ name: categoryName });

        if (error) throw error;
      }

      setIsDialogOpen(false);
      setCategoryName("");
      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      console.error("Error saving category:", error);
      alert("카테고리 저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <Box>
      <Flex justify="between" align="center" mb="4">
        <Text size="6" weight="bold">
          카테고리 관리
        </Text>
        <Button
          onClick={() => {
            setEditingCategory(null);
            setCategoryName("");
            setIsDialogOpen(true);
          }}
        >
          카테고리 추가
        </Button>
      </Flex>

      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>카테고리 이름</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>액션</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {categories.map((category) => (
            <Table.Row key={category.id}>
              <Table.Cell>{category.name}</Table.Cell>
              <Table.Cell>
                <Flex gap="2">
                  <Button size="1" onClick={() => handleEdit(category)}>
                    수정
                  </Button>
                  <Button
                    size="1"
                    color="red"
                    onClick={() => handleDelete(category.id)}
                  >
                    삭제
                  </Button>
                </Flex>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
      <DialogPrimitive.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 bg-black bg-opacity-50" />
          <DialogPrimitive.Content
            className="fixed top-1/2 left-1/2 bg-white dark:bg-gray-800 rounded-lg p-6 transform -translate-x-1/2 -translate-y-1/2 max-w-md w-full"
            style={{ zIndex: 1000 }}
          >
            <DialogPrimitive.Title className="text-lg font-bold mb-4">
              카테고리 {editingCategory ? "수정" : "추가"}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close asChild>
              <Button
                variant="ghost"
                size="1"
                style={{ position: "absolute", top: 8, right: 8 }}
              >
                <Cross2Icon />
              </Button>
            </DialogPrimitive.Close>
            <form onSubmit={handleFormSubmit}>
              <Flex direction="column" gap="3">
                <Box>
                  <label>카테고리 이름</label>
                  <input
                    type="text"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      border: "1px solid var(--gray-6)",
                      borderRadius: "var(--radius-2)",
                    }}
                  />
                </Box>
                <Flex justify="end" gap="2" mt="4">
                  <Button
                    variant="soft"
                    color="gray"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    취소
                  </Button>
                  <Button type="submit">
                    {editingCategory ? "수정" : "추가"}
                  </Button>
                </Flex>
              </Flex>
            </form>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </Box>
  );
};

export default CaseCategoryManagement;
