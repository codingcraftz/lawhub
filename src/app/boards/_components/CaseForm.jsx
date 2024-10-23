// src/app/boards/_components/CaseForm.jsx

"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Flex, Text, Button, Dialog } from "@radix-ui/themes";
import * as yup from "yup";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import UserSelectionModalContent from "./UserSelectionModalContent";
import { Cross2Icon } from "@radix-ui/react-icons";

const schema = yup.object().shape({
  title: yup.string().required("제목은 필수입니다"),
  description: yup.string(),
  start_date: yup.date().required("시작일을 입력해주세요"),
  category_id: yup.string().required("카테고리를 선택해주세요"),
});

const CaseForm = ({ caseData, onSuccess, onClose }) => {
  const [categories, setCategories] = useState([]);
  const [selectedClients, setSelectedClients] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: caseData || {},
  });

  useEffect(() => {
    fetchCategories();
    if (caseData) {
      fetchCaseRelations();
    }
  }, [caseData]);

  const fetchCategories = async () => {
    const { data, error } = await supabase.from("case_categories").select("*");
    if (error) {
      console.error("Error fetching categories:", error);
    } else {
      setCategories(data);
    }
  };

  const fetchCaseRelations = async () => {
    // 의뢰인 가져오기
    const { data: clientData, error: clientError } = await supabase
      .from("case_clients")
      .select("client_id, client:users(name)")
      .eq("case_id", caseData.id);

    if (clientError) {
      console.error("Error fetching clients:", clientError);
    } else {
      const clients = clientData.map((item) => ({
        id: item.client_id,
        name: item.client.name,
      }));
      setSelectedClients(clients);
    }

    // 담당자 가져오기
    const { data: staffData, error: staffError } = await supabase
      .from("case_staff")
      .select("staff_id, staff:users(name)")
      .eq("case_id", caseData.id);

    if (staffError) {
      console.error("Error fetching staff:", staffError);
    } else {
      const staff = staffData.map((item) => ({
        id: item.staff_id,
        name: item.staff.name,
      }));
      setSelectedStaff(staff);
    }
  };

  const onSubmit = async (data) => {
    try {
      let casePayload = {
        title: data.title,
        description: data.description,
        start_date: data.start_date,
        category_id: data.category_id,
        status: data.status || "ongoing", // 기본값을 'ongoing'으로 설정
      };

      let insertedCase;

      if (caseData) {
        // 기존 사건 수정
        const { data: updatedCase, error } = await supabase
          .from("cases")
          .update(casePayload)
          .eq("id", caseData.id)
          .select("*");

        if (error) throw error;
        insertedCase = updatedCase[0];

        // 기존 연결 데이터 삭제
        await supabase.from("case_clients").delete().eq("case_id", caseData.id);
        await supabase.from("case_staff").delete().eq("case_id", caseData.id);
      } else {
        // 새로운 사건 생성
        const { data: newCase, error } = await supabase
          .from("cases")
          .insert([casePayload])
          .select("*");

        if (error) throw error;
        insertedCase = newCase[0];
      }

      // 연결 테이블 데이터 삽입
      const clientEntries = selectedClients.map((client) => ({
        case_id: insertedCase.id,
        client_id: client.id,
      }));

      const staffEntries = selectedStaff.map((staff) => ({
        case_id: insertedCase.id,
        staff_id: staff.id,
      }));

      // 연결 테이블에 데이터 삽입 시 에러 처리 강화
      if (clientEntries.length > 0) {
        const { data: clientInsertData, error: clientInsertError } =
          await supabase.from("case_clients").insert(clientEntries);

        if (clientInsertError) {
          console.error(
            "Error inserting into case_clients:",
            clientInsertError,
          );
          throw clientInsertError;
        }
      }

      if (staffEntries.length > 0) {
        const { data: staffInsertData, error: staffInsertError } =
          await supabase.from("case_staff").insert(staffEntries);

        if (staffInsertError) {
          console.error("Error inserting into case_staff:", staffInsertError);
          throw staffInsertError;
        }
      }

      // 담당자에게 알림 생성
      for (const staff of selectedStaff) {
        try {
          const { data, error } = await supabase.from("notifications").insert({
            user_id: staff.id,
            message: `새로운 사건에 배정되었습니다: ${insertedCase.title}`,
            case_timeline_id: null,
            is_read: false,
          });

          if (error) throw error;
        } catch (error) {
          console.error("Error inserting notification:", error);
          // 여기서 적절한 오류 처리를 수행합니다.
        }
      }

      onSuccess();
    } catch (error) {
      console.error("Error saving case:", error);
      alert("사건 정보 저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Flex direction="column" gap="4">
        {/* 사건 제목 입력 */}
        <Box>
          <input
            placeholder="사건 제목"
            {...register("title")}
            style={{
              width: "100%",
              padding: "0.6rem 0.8rem",
              border: "2px solid var(--gray-6)",
              borderRadius: "var(--radius-1)",
            }}
          />
          {errors.title && (
            <Text color="red" size="2">
              {errors.title.message}
            </Text>
          )}
        </Box>

        {/* 카테고리 선택 */}
        <Box>
          <select
            {...register("category_id")}
            style={{
              width: "100%",
              padding: "0.6rem 0.8rem",
              border: "2px solid var(--gray-6)",
              borderRadius: "var(--radius-1)",
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
            <Text color="red" size="2">
              {errors.category_id.message}
            </Text>
          )}
        </Box>

        {/* 사건 설명 */}
        <Box>
          <textarea
            placeholder="사건 설명"
            {...register("description")}
            style={{
              width: "100%",
              padding: "0.6rem 0.8rem",
              border: "2px solid var(--gray-6)",
              borderRadius: "var(--radius-1)",
              minHeight: "100px",
            }}
          />
        </Box>

        {/* 사건 시작일 */}
        <Box>
          <input
            type="date"
            {...register("start_date")}
            style={{
              width: "100%",
              padding: "0.6rem 0.8rem",
              border: "2px solid var(--gray-6)",
              borderRadius: "var(--radius-1)",
            }}
          />
          {errors.start_date && (
            <Text color="red" size="2">
              {errors.start_date.message}
            </Text>
          )}
        </Box>

        {/* 의뢰인 선택 */}
        <Box>
          <Button type="button" onClick={() => setIsClientModalOpen(true)}>
            의뢰인 선택
          </Button>
          {selectedClients.length > 0 && (
            <Text>
              선택된 의뢰인: {selectedClients.map((c) => c.name).join(", ")}
            </Text>
          )}
        </Box>

        {/* 담당자 선택 */}
        <Box>
          <Button type="button" onClick={() => setIsStaffModalOpen(true)}>
            담당자 선택
          </Button>
          {selectedStaff.length > 0 && (
            <Text>
              선택된 담당자: {selectedStaff.map((s) => s.name).join(", ")}
            </Text>
          )}
        </Box>
        <Flex gap="3" mt="4" justify="end">
          <Button variant="soft" color="gray" onClick={onClose}>
            취소
          </Button>
          <Button type="submit">등록</Button>
        </Flex>
      </Flex>

      {/* 의뢰인 선택 모달 */}
      <Dialog.Root open={isClientModalOpen} onOpenChange={setIsClientModalOpen}>
        <Dialog.Content style={{ maxWidth: 450 }}>
          <Dialog.Title>의뢰인 선택</Dialog.Title>
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
          <UserSelectionModalContent
            userType="client"
            selectedUsers={selectedClients}
            setSelectedUsers={setSelectedClients}
            onClose={() => setIsClientModalOpen(false)}
          />
        </Dialog.Content>
      </Dialog.Root>

      {/* 담당자 선택 모달 */}
      <Dialog.Root open={isStaffModalOpen} onOpenChange={setIsStaffModalOpen}>
        <Dialog.Content style={{ maxWidth: 450 }}>
          <Dialog.Title>담당자 선택</Dialog.Title>
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
          <UserSelectionModalContent
            userType="staff"
            selectedUsers={selectedStaff}
            setSelectedUsers={setSelectedStaff}
            onClose={() => setIsStaffModalOpen(false)}
          />
        </Dialog.Content>
      </Dialog.Root>
    </form>
  );
};

export default CaseForm;

