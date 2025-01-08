"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Switch from "@radix-ui/react-switch";
import { Cross2Icon } from "@radix-ui/react-icons";
import { Box, Flex, Button, Text, Theme } from "@radix-ui/themes";
import { supabase } from "@/utils/supabase";

// react-hook-form + yup
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

// 각 스텝 컴포넌트 임포트
import Step1_ClientSelection from "./Step1_ClientSelection";
import Step2_DebtorSelection from "./Step2_DebtorSelection";
import Step3_AssignmentContent from "./Step3_AssignmentContent";

// 밸리데이션 스키마
const assignmentSchema = yup.object().shape({
  description: yup.string().required("의뢰 내용을 입력해주세요."),
});

// chip 스타일(선택된 사용자 목록에 적용)
const chipStyle = {
  backgroundColor: "var(--gray-2)",
  borderRadius: 4,
  padding: "4px 8px",
  display: "flex",
  alignItems: "center",
};

const AssignmentForm = ({ open, onOpenChange, onSuccess }) => {
  // --------------------- 스텝 상태 ---------------------
  const [step, setStep] = useState(1);

  // --------------------- 의뢰인(고객) 상태 ---------------------
  const [noClientSelected, setNoClientSelected] = useState(false); // 의뢰인 없음 스위치
  const [selectedClients, setSelectedClients] = useState([]);

  // --------------------- 채무자 상태 ---------------------
  const [selectedDebtors, setSelectedDebtors] = useState([]);

  // --------------------- 의뢰 내용 + react-hook-form ---------------------
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(assignmentSchema),
    mode: "onChange",
  });

  // --------------------- 스텝 이동 ---------------------
  const goToNextStep = () => {
    if (step === 1) {
      // (스텝1) 의뢰인 없음 스위치가 OFF이면 최소 1명 필요
      if (!noClientSelected && selectedClients.length === 0) {
        alert("의뢰인을 선택하거나 '의뢰인 없음'을 켜주세요.");
        return;
      }
    }
    if (step === 2) {
      // (스텝2) 채무자는 1명 이상 필요
      if (selectedDebtors.length === 0) {
        alert("채무자를 최소 1명 이상 선택해주세요.");
        return;
      }
    }
    setStep(step + 1);
  };

  const goToPrevStep = () => {
    setStep(step - 1);
  };

  // --------------------- 최종 등록 ---------------------
  const onSubmit = async (data) => {
    try {
      // Step 1: Assignments 테이블에 기본 의뢰 내용 저장
      const { data: assignmentData, error: assignmentError } = await supabase
        .from("assignments")
        .insert([{ description: data.description }])
        .select("id")
        .single();

      if (assignmentError) {
        console.error("Assignment 추가 오류:", assignmentError);
        alert("Assignment 추가 중 오류가 발생했습니다.");
        return;
      }

      const assignmentId = assignmentData.id;

      // Step 2: Assignment_clients 테이블에 의뢰인 데이터 저장
      if (!noClientSelected) {
        const clientInsertData = selectedClients.map((client) => ({
          assignment_id: assignmentId,
          client_id: client.id,
        }));

        const { error: clientError } = await supabase
          .from("assignment_clients")
          .insert(clientInsertData);

        if (clientError) {
          console.error("Assignment Clients 추가 오류:", clientError);
          alert("Clients 추가 중 오류가 발생했습니다.");
          return;
        }
      }

      // assingment_debtors 테이블에 debtors 채무자 저장
      const debtorInsertData = selectedDebtors.map((debtor) => ({
        assignment_id: assignmentId,
        debtor_id: debtor.id,
      }));

      const { error: clientError } = await supabase
        .from("assignment_debtors")
        .insert(debtorInsertData);

      if (clientError) {
        console.error("Assignment Clients 추가 오류:", clientError);
        alert("Clients 추가 중 오류가 발생했습니다.");
        return;
      }

      // Step 3: 성공 처리
      alert("Assignment가 성공적으로 추가되었습니다!");
      onSuccess && onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error("Assignment 추가 중 오류:", err);
      alert("Assignment 추가 중 오류가 발생했습니다.");
    }
  };

  // --------------------- 전체 취소(리셋) ---------------------
  const handleCancel = () => {
    setStep(1);
    setNoClientSelected(false);
    setSelectedClients([]);
    setSelectedDebtors([]);
    onOpenChange(false);
  };

  // --------------------- 선택 제거 핸들러 ---------------------
  const removeClient = (clientId) => {
    setSelectedClients((prev) => prev.filter((c) => c.id !== clientId));
  };
  const removeDebtor = (debtorId) => {
    setSelectedDebtors((prev) => prev.filter((d) => d.id !== debtorId));
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Theme>
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-75 z-30" />
          <Dialog.Content
            className="fixed bg-gray-3 left-1/2 top-1/2 max-h-[85vh] w-full max-w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-md p-[25px] shadow focus:outline-none z-40 overflow-y-auto"
            style={{ width: "90%", maxWidth: "600px" }}
          >
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                color="gray"
                style={{ position: "absolute", top: 8, right: 8 }}
              >
                <Cross2Icon width={25} height={25} />
              </Button>
            </Dialog.Close>

            {/* =================== Step1: 의뢰인 =================== */}
            {step === 1 && (
              <>
                <Dialog.Title className="font-bold text-xl mb-3">
                  1단계: 의뢰인을 선택해주세요
                </Dialog.Title>

                {/* 의뢰인 없음 스위치 */}
                <Flex align="center" mb="3" gap="2">
                  <Text>의뢰인 없음 (미가입)</Text>
                  <Switch.Root
                    checked={noClientSelected}
                    onCheckedChange={(checked) => {
                      setNoClientSelected(checked);
                      if (checked) setSelectedClients([]); // 스위치 켜면 목록 비움
                    }}
                    style={{ width: 42, height: 25, position: "relative" }}
                  >
                    <Switch.Thumb
                      style={{
                        display: "block",
                        width: 21,
                        height: 21,
                        backgroundColor: "white",
                        borderRadius: "50%",
                        transition: "transform 100ms",
                        transform: noClientSelected
                          ? "translateX(19px)"
                          : "translateX(2px)",
                      }}
                    />
                  </Switch.Root>
                </Flex>

                {/* 의뢰인 검색 + 선택 */}
                {!noClientSelected && (
                  <Step1_ClientSelection
                    selectedClients={selectedClients}
                    setSelectedClients={setSelectedClients}
                    removeClient={removeClient}
                  />
                )}

                {/* 하단 버튼 */}
                <Flex justify="end" mt="4" gap="2">
                  <Button variant="soft" color="gray" onClick={handleCancel}>
                    취소
                  </Button>
                  <Button
                    variant="soft"
                    onClick={goToNextStep}
                    disabled={!noClientSelected && selectedClients.length === 0}
                  >
                    다음
                  </Button>
                </Flex>
              </>
            )}

            {/* =================== Step2: 채무자 =================== */}
            {step === 2 && (
              <>
                <Dialog.Title className="font-bold text-xl mb-3">
                  2단계: 채무자를 선택해주세요
                </Dialog.Title>

                <Step2_DebtorSelection
                  selectedDebtors={selectedDebtors}
                  setSelectedDebtors={setSelectedDebtors}
                  removeDebtor={removeDebtor}
                />

                {/* 하단 버튼 */}
                <Flex justify="end" mt="4" gap="2">
                  <Button variant="soft" color="gray" onClick={goToPrevStep}>
                    이전
                  </Button>
                  <Button
                    variant="soft"
                    onClick={goToNextStep}
                    disabled={selectedDebtors.length === 0}
                  >
                    다음
                  </Button>
                </Flex>
              </>
            )}

            {/* =================== Step3: 의뢰 내용 입력 =================== */}
            {step === 3 && (
              <Step3_AssignmentContent
                register={register}
                goToPrevStep={goToPrevStep}
                handleSubmit={handleSubmit}
                onSubmit={onSubmit}
                errors={errors}
              />
            )}
          </Dialog.Content>
        </Theme>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default AssignmentForm;
