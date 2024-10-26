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
import OpponentSelectionModalContent from "./OpponentSelectionModalContent";
import CustomDatePicker from "@/components/CustomDatePicker";

// 유효성 검사 스키마
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
  const [selectedOpponents, setSelectedOpponents] = useState([]); // 상대방 상태
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isOpponentModalOpen, setIsOpponentModalOpen] = useState(false); // 상대방 선택 모달

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
      console.error("카테고리 불러오기 오류:", error);
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
      console.error("의뢰인 불러오기 오류:", clientError);
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
      console.error("담당자 불러오기 오류:", staffError);
    } else {
      const staff = staffData.map((item) => ({
        id: item.staff_id,
        name: item.staff.name,
      }));
      setSelectedStaff(staff);
    }

    // 상대방 가져오기 (opponents 테이블과 조인)
    const { data: opponentData, error: opponentError } = await supabase
      .from("case_opponents")
      .select(
        "opponent_id, opponent:opponents(name, registration_number, address, phone_number)",
      ) // opponents 테이블과 조인
      .eq("case_id", caseData.id);

    if (opponentError) {
      console.error("상대방 불러오기 오류:", opponentError);
    } else {
      const opponents = opponentData.map((item) => ({
        id: item.opponent_id,
        name: item.opponent.name,
        registration_number: item.opponent.registration_number,
        address: item.opponent.address,
        phone_number: item.opponent.phone_number,
      }));
      setSelectedOpponents(opponents);
    }
  };

  const onSubmit = async (data) => {
    try {
      let casePayload = {
        title: data.title,
        description: data.description,
        start_date: data.start_date,
        category_id: data.category_id,
        status: data.status || "ongoing",
      };

      let insertedCase;

      if (caseData) {
        // 기존 사건 업데이트
        const { data: updatedCase, error } = await supabase
          .from("cases")
          .update(casePayload)
          .eq("id", caseData.id)
          .select("*");

        if (error) throw error;
        insertedCase = updatedCase[0];

        // 기존 관계 삭제
        await supabase.from("case_clients").delete().eq("case_id", caseData.id);
        await supabase.from("case_staff").delete().eq("case_id", caseData.id);
        await supabase
          .from("case_opponents")
          .delete()
          .eq("case_id", caseData.id); // 기존 상대방 관계 삭제
      } else {
        // 새로운 사건 삽입
        const { data: newCase, error } = await supabase
          .from("cases")
          .insert([casePayload])
          .select("*");

        if (error) throw error;
        insertedCase = newCase[0];
      }

      // 의뢰인, 담당자, 상대방 삽입
      const clientEntries = selectedClients.map((client) => ({
        case_id: insertedCase.id,
        client_id: client.id,
      }));
      const staffEntries = selectedStaff.map((staff) => ({
        case_id: insertedCase.id,
        staff_id: staff.id,
      }));
      const opponentEntries = selectedOpponents.map((opponent) => ({
        case_id: insertedCase.id,
        opponent_id: opponent.id, // 새로운 상대방 삽입 대신 관계만 삽입
      }));

      if (clientEntries.length > 0) {
        await supabase.from("case_clients").insert(clientEntries);
      }
      if (staffEntries.length > 0) {
        await supabase.from("case_staff").insert(staffEntries);
      }
      if (opponentEntries.length > 0) {
        await supabase.from("case_opponents").insert(opponentEntries);
      }

      // 담당자에게 알림
      for (const staff of selectedStaff) {
        await supabase.from("notifications").insert({
          user_id: staff.id,
          message: `새로운 사건에 배정되었습니다: ${insertedCase.title}`,
          is_read: false,
        });
      }

      onSuccess();
    } catch (error) {
      console.error("사건 저장 중 오류:", error);
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

        <Box>
          <Controller
            control={control}
            name="start_date"
            render={({ field }) => (
              <CustomDatePicker
                title="사건 시작 날짜 선택"
                selectedDate={field.value}
                onDateChange={(date) => field.onChange(date)}
              />
            )}
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

        {/* 상대방 선택 */}
        <Box>
          <Button type="button" onClick={() => setIsOpponentModalOpen(true)}>
            상대방 선택
          </Button>
          {selectedOpponents.length > 0 && (
            <Text>
              선택된 상대방: {selectedOpponents.map((o) => o.name).join(", ")}
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

      {/* 상대방 선택 모달 */}
      <Dialog.Root
        open={isOpponentModalOpen}
        onOpenChange={setIsOpponentModalOpen}
      >
        <Dialog.Content style={{ maxWidth: 450 }}>
          <Dialog.Title>상대방 추가</Dialog.Title>
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
          <OpponentSelectionModalContent
            selectedOpponents={selectedOpponents}
            setSelectedOpponents={setSelectedOpponents}
            onClose={() => setIsOpponentModalOpen(false)}
          />
        </Dialog.Content>
      </Dialog.Root>
    </form>
  );
};

export default CaseForm;
