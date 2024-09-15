"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { supabase } from "@/utils/supabase";
import { Box, Flex, Text, Button } from "@radix-ui/themes";

const schema = yup.object().shape({
  title: yup.string().required("제목은 필수입니다"),
  client_id: yup.string().required("의뢰인을 선택해주세요"),
  assigned_to: yup.string().required("담당자를 선택해주세요"),
  category_id: yup.number().required("카테고리를 선택해주세요"),
  description: yup.string(),
  start_date: yup.date().required("시작일을 입력해주세요"),
});

const CaseForm = ({ caseData, onSuccess }) => {
  const [clients, setClients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [categories, setCategories] = useState([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: caseData || {},
  });

  useEffect(() => {
    fetchFormData();
  }, []);

  const fetchFormData = async () => {
    const [clientsData, staffData, categoriesData] = await Promise.all([
      supabase.from("clients").select("id, name"),
      supabase.from("profiles").select("id, name").eq("role", "staff"),
      supabase.from("case_categories").select("id, name"),
    ]);

    setClients(clientsData.data || []);
    setStaff(staffData.data || []);
    setCategories(categoriesData.data || []);
  };

  const onSubmit = async (data) => {
    try {
      if (caseData) {
        const { error } = await supabase
          .from("cases")
          .update(data)
          .eq("id", caseData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("cases").insert([data]);
        if (error) throw error;
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving case:", error);
      alert("사건 정보 저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Flex direction="column" gap="3">
        <Box>
          <input
            placeholder="사건 제목"
            {...register("title")}
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid var(--gray-6)",
              borderRadius: "var(--radius-2)",
            }}
          />
          {errors.title && (
            <Text color="red" size="1">
              {errors.title.message}
            </Text>
          )}
        </Box>
        <Box>
          <select
            {...register("client_id")}
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid var(--gray-6)",
              borderRadius: "var(--radius-2)",
            }}
          >
            <option value="">의뢰인 선택</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
          {errors.client_id && (
            <Text color="red" size="1">
              {errors.client_id.message}
            </Text>
          )}
        </Box>
        <Box>
          <select
            {...register("assigned_to")}
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid var(--gray-6)",
              borderRadius: "var(--radius-2)",
            }}
          >
            <option value="">담당자 선택</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {errors.assigned_to && (
            <Text color="red" size="1">
              {errors.assigned_to.message}
            </Text>
          )}
        </Box>
        <Box>
          <select
            {...register("category_id")}
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid var(--gray-6)",
              borderRadius: "var(--radius-2)",
            }}
          >
            <option value="">카테고리 선택</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.category_id && (
            <Text color="red" size="1">
              {errors.category_id.message}
            </Text>
          )}
        </Box>
        <Box>
          <textarea
            placeholder="사건 설명"
            {...register("description")}
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid var(--gray-6)",
              borderRadius: "var(--radius-2)",
              minHeight: "100px",
            }}
          />
        </Box>
        <Box>
          <input
            type="date"
            {...register("start_date")}
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid var(--gray-6)",
              borderRadius: "var(--radius-2)",
            }}
          />
          {errors.start_date && (
            <Text color="red" size="1">
              {errors.start_date.message}
            </Text>
          )}
        </Box>
        <Button type="submit">{caseData ? "수정" : "등록"}</Button>
      </Flex>
    </form>
  );
};

export default CaseForm;
