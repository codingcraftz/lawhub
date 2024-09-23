"use client";

import React, { useState } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Flex, Text, Button, IconButton } from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import Modal from "@/components/Modal";
import UserSelectionModalContent from "./UserSelectionModalContent";

const schema = yup.object().shape({
  title: yup.string().required("제목은 필수입니다"),
  description: yup.string(),
  start_date: yup.date().required("시작일을 입력해주세요"),
});

const CaseForm = ({ caseData, onSuccess }) => {
  const [selectedClients, setSelectedClients] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState([]);

  // 모달 상태 관리
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: caseData || {},
  });

  // 의뢰인 또는 담당자 제거 함수
  const handleRemoveClient = (clientId) => {
    setSelectedClients((prev) =>
      prev.filter((client) => client.id !== clientId),
    );
  };

  const handleRemoveStaff = (staffId) => {
    setSelectedStaff((prev) => prev.filter((staff) => staff.id !== staffId));
  };

  const onSubmit = async (data) => {
    try {
      let casePayload = {
        ...data,
      };

      let insertedCase;

      if (caseData) {
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
        const { data: newCase, error } = await supabase
          .from("cases")
          .insert([casePayload])
          .select("*");

        if (error) throw error;
        insertedCase = newCase[0];
      }

      // 연결 테이블에 데이터 삽입
      const clientEntries = selectedClients.map((client) => ({
        case_id: insertedCase.id,
        client_id: client.id,
      }));

      const staffEntries = selectedStaff.map((staff) => ({
        case_id: insertedCase.id,
        staff_id: staff.id,
      }));

      const { error: clientInsertError } = await supabase
        .from("case_clients")
        .insert(clientEntries);

      if (clientInsertError) throw clientInsertError;

      const { error: staffInsertError } = await supabase
        .from("case_staff")
        .insert(staffEntries);

      if (staffInsertError) throw staffInsertError;

      onSuccess();
    } catch (error) {
      console.error("Error saving case:", error);
      alert("사건 정보 저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Flex direction="column" gap="4">
          {/* 사건 제목 입력 */}
          <Box>
            <input
              placeholder="사건 제목"
              {...register("title")}
              style={{
                width: "100%",
                padding: "1.5rem",
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

          {/* 의뢰인 선택 */}
          <Box>
            <Button type="button" onClick={() => setIsClientModalOpen(true)}>
              의뢰인 선택
            </Button>
            {selectedClients.length > 0 && (
              <Box mt="3">
                <Text>선택된 의뢰인:</Text>
                {selectedClients.map((client) => (
                  <Flex key={client.id} align="center" mt="2">
                    <Text>{client.name}</Text>
                    <IconButton
                      variant="ghost"
                      onClick={() => handleRemoveClient(client.id)}
                    >
                      <Cross2Icon />
                    </IconButton>
                  </Flex>
                ))}
              </Box>
            )}
          </Box>

          {/* 담당자 선택 */}
          <Box>
            <Button type="button" onClick={() => setIsStaffModalOpen(true)}>
              담당자 선택
            </Button>
            {selectedStaff.length > 0 && (
              <Box mt="3">
                <Text>선택된 담당자:</Text>
                {selectedStaff.map((staff) => (
                  <Flex key={staff.id} align="center" mt="2">
                    <Text>{staff.name}</Text>
                    <IconButton
                      variant="ghost"
                      onClick={() => handleRemoveStaff(staff.id)}
                    >
                      <Cross2Icon />
                    </IconButton>
                  </Flex>
                ))}
              </Box>
            )}
          </Box>

          {/* 사건 설명 */}
          <Box>
            <textarea
              placeholder="사건 설명"
              {...register("description")}
              style={{
                width: "100%",
                padding: "1.5rem",
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
                padding: "1.5rem",
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

          {/* 제출 버튼 */}
          <Button type="submit">{caseData ? "수정" : "등록"}</Button>
        </Flex>
      </form>

      {/* 의뢰인 선택 모달 */}
      {isClientModalOpen && (
        <Modal
          isOpen={isClientModalOpen}
          onClose={() => setIsClientModalOpen(false)}
          title="의뢰인 선택"
        >
          <UserSelectionModalContent
            userType="client"
            selectedUsers={selectedClients}
            setSelectedUsers={setSelectedClients}
            onClose={() => setIsClientModalOpen(false)}
          />
        </Modal>
      )}

      {/* 담당자 선택 모달 */}
      {isStaffModalOpen && (
        <Modal
          isOpen={isStaffModalOpen}
          onClose={() => setIsStaffModalOpen(false)}
          title="담당자 선택"
        >
          <UserSelectionModalContent
            userType="staff"
            selectedUsers={selectedStaff}
            setSelectedUsers={setSelectedStaff}
            onClose={() => setIsStaffModalOpen(false)}
          />
        </Modal>
      )}
    </>
  );
};

export default CaseForm;
