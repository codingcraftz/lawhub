"use client";

import React, { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Switch from "@radix-ui/react-switch";
import { Cross2Icon } from "@radix-ui/react-icons";
import { Box, Flex, Button, Text, Theme } from "@radix-ui/themes";
import { supabase } from "@/utils/supabase";

// react-hook-form + yup
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

// 스텝 컴포넌트 (5단계)
import Step1_ClientAndGroupSelection from "./Step1_ClientAndGroupSelection";
import Step2_AssigneeRegistration from "./Step2_AssigneeRegistration";
import Step2_CreditorRegistration from "./Step2_CreditorRegistration";
import Step3_DebtorRegistration from "./Step3_DebtorRegistration";
import Step4_AssignmentContent from "./Step4_AssignmentContent";
import { useRouter } from "next/navigation";

// 밸리데이션 스키마
const assignmentSchema = yup.object().shape({
  description: yup.string().required("의뢰 내용을 입력해주세요."),
});

const AssignmentForm = ({ open, onOpenChange, onSuccess }) => {
  const [step, setStep] = useState(1);

  // --------------------- 의뢰 타입: 채권 or 소송 ---------------------
  const [assignmentType, setAssignmentType] = useState("채권");

  // --------------------- 의뢰인/그룹 선택 ---------------------
  const [noClientSelected, setNoClientSelected] = useState(false);
  const [selectedClients, setSelectedClients] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [userType, setUserType] = useState(null);

  // --------------------- 담당자(직원) 선택 ---------------------
  const [selectedAssignees, setSelectedAssignees] = useState([]);

  // --------------------- (채권자/원고) 리스트 ---------------------
  const [selectedCreditors, setSelectedCreditors] = useState([]);

  // --------------------- (채무자/피고) 리스트 ---------------------
  const [selectedDebtors, setSelectedDebtors] = useState([]);

  const router = useRouter();

  // --------------------- react-hook-form ---------------------
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(assignmentSchema),
    mode: "onChange",
  });

  // 모달이 열릴 때마다 리셋
  useEffect(() => {
    if (open) {
      setStep(1);
      setNoClientSelected(false);
      setSelectedClients([]);
      setSelectedGroups([]);
      setUserType(null);
      setSelectedAssignees([]);
      setSelectedCreditors([]);
      setSelectedDebtors([]);
      setAssignmentType("채권"); // 초기값: 채권
    }
  }, [open]);

  // --------------------- 스텝 이동 ---------------------
  const goToNextStep = () => {
    if (step === 1) {
      // Step1 검증
      if (
        !noClientSelected &&
        selectedClients.length === 0 &&
        selectedGroups.length === 0
      ) {
        alert("의뢰인을 선택하거나 '의뢰인 없음'을 켜주세요.");
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

  const goToPrevStep = () => {
    setStep((prev) => prev - 1);
  };

  // --------------------- 전체 취소(리셋) ---------------------
  const handleCancel = () => {
    setStep(1);
    setNoClientSelected(false);
    setSelectedClients([]);
    setSelectedGroups([]);
    setUserType(null);
    setSelectedAssignees([]);
    setSelectedCreditors([]);
    setSelectedDebtors([]);
    setAssignmentType("채권"); // 리셋
    onOpenChange(false);
  };

  // --------------------- 의뢰 최종 저장 ---------------------
  const onSubmit = async (data) => {
    try {
      // 1) assignments 테이블에 INSERT (type 컬럼)
      const { data: assignmentData, error: assignmentError } = await supabase
        .from("assignments")
        .insert([
          {
            description: data.description,
            type: assignmentType, // "채권" 또는 "소송"
          },
        ])
        .select("*")
        .single();

      if (assignmentError) {
        console.error("Assignment 추가 오류:", assignmentError);
        alert("의뢰 추가 중 오류가 발생했습니다.");
        return;
      }

      const assignmentId = assignmentData.id;

      // 2) 의뢰인 없음
      if (noClientSelected) {
        const { error: clientError } = await supabase
          .from("assignment_clients")
          .insert({
            assignment_id: assignmentId,
            client_id: "e8353222-07e6-4d05-ac2c-5e004c043ce6",
          });
        if (clientError) {
          console.error("Assignment Clients 추가 오류:", clientError);
          alert("고객 추가 중 오류가 발생했습니다.");
          return;
        }
      }

      // 3) 담당자(직원) 연결
      if (selectedAssignees.length > 0) {
        const assigneeInsertData = selectedAssignees.map((assignee) => ({
          assignment_id: assignmentId,
          user_id: assignee.id,
          role: assignee.employee_type,
        }));
        const { error: assigneeError } = await supabase
          .from("assignment_assignees")
          .insert(assigneeInsertData);
        if (assigneeError) {
          console.error("담당자 추가 오류:", assigneeError);
          return;
        }
      }

      // 4) 의뢰인 연결
      if (!noClientSelected) {
        // 4-1) 개별 고객
        if (selectedClients.length > 0) {
          const clientInsertData = selectedClients.map((client) => ({
            assignment_id: assignmentId,
            client_id: client.id,
            type: userType,
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
        // 4-2) 그룹
        if (selectedGroups.length > 0) {
          const groupInsertData = selectedGroups.map((group) => ({
            assignment_id: assignmentId,
            group_id: group.id,
            type: userType,
          }));
          const { error: groupError } = await supabase
            .from("assignment_groups")
            .insert(groupInsertData);
          if (groupError) {
            console.error("Assignment Groups 추가 오류:", groupError);
            alert("Groups 추가 중 오류가 발생했습니다.");
            return;
          }
        }
      }

			// 5) (채권자/원고) 저장
if (selectedCreditors.length > 0) {
  const creditorsInsertData = selectedCreditors.map((creditor) => ({
    assignment_id: assignmentId,
    name: creditor.name,
    phone_number: creditor?.phone_number || null,
    address: creditor?.address || null,
    // New columns
    registration_number: creditor?.registration_number || null,
    workplace_name: creditor?.workplace_name || null,
    workplace_address: creditor?.workplace_address || null,
  }));

  const { error: creditorError } = await supabase
    .from("assignment_creditors")
    .insert(creditorsInsertData);

  if (creditorError) {
    console.error("Assignment Creditors 추가 오류:", creditorError);
    alert("채권자/원고 추가 중 오류가 발생했습니다.");
    return;
  }
}


			// Step6) (채무자/피고) 저장 부분만 수정
if (selectedDebtors.length > 0) {
  const debtorsInsertData = selectedDebtors.map((debtor) => ({
    assignment_id: assignmentId,
    name: debtor.name,
    phone_number: debtor?.phone_number || null,
    address: debtor?.address || null,
    registration_number: debtor?.registration_number || null,
    workplace_name: debtor?.workplace_name || null,
    workplace_address: debtor?.workplace_address || null,
  }));

  const { error: debtorError } = await supabase
    .from("assignment_debtors")
    .insert(debtorsInsertData);

  if (debtorError) {
    console.error("Assignment Debtors 추가 오류:", debtorError);
    alert("채무자/피고 추가 중 오류가 발생했습니다.");
    return;
  }
}

      // 성공 메시지 및 페이지 이동
      alert("의뢰가 성공적으로 등록되었습니다!");
      onSuccess && onSuccess();
      onOpenChange(false);
      router.push(`/client/assignment/${assignmentId}`);
    } catch (err) {
      console.error("의뢰 추가 중 예기치 못한 오류:", err);
      alert("의뢰 추가 중 오류가 발생했습니다.");
    }
  };

  // --------------------- 선택 제거 핸들러 ---------------------
  const removeClient = (clientId) => {
    setSelectedClients((prev) => prev.filter((c) => c.id !== clientId));
  };
  const removeGroup = (groupId) => {
    setSelectedGroups((prev) => prev.filter((g) => g.id !== groupId));
  };
  const removeCreditor = (index) => {
    setSelectedCreditors((prev) => prev.filter((_, i) => i !== index));
  };
  const removeDebtor = (index) => {
    setSelectedDebtors((prev) => prev.filter((_, i) => i !== index));
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
                style={{ position: "absolute", top: 24, right: 24 }}
              >
                <Cross2Icon width={25} height={25} />
              </Button>
            </Dialog.Close>

            {/* 상단에 스위치: 채권 <-> 소송 */}
            <Box mb="3">
              <Flex align="center" gap="2">
                <Text>채권</Text>
                <Switch.Root
                  checked={assignmentType === "소송"}
                  onCheckedChange={(checked) =>
                    setAssignmentType(checked ? "소송" : "채권")
                  }
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
                      transform:
                        assignmentType === "소송"
                          ? "translateX(19px)"
                          : "translateX(2px)",
                    }}
                  />
                </Switch.Root>
                <Text>소송</Text>
              </Flex>
            </Box>

            {/* ========== Step1: 의뢰인 선택 ========== */}
            {step === 1 && (
              <>
                <Dialog.Title className="font-bold text-xl pb-6">
                  1단계: 의뢰인 선택
                </Dialog.Title>
                <Flex align="center" mb="3" gap="2">
                  <Text>의뢰인 없음 (미가입)</Text>
                  <Switch.Root
                    checked={noClientSelected}
                    onCheckedChange={(checked) => {
                      setNoClientSelected(checked);
                      if (checked) {
                        setSelectedClients([]);
                        setSelectedGroups([]);
                      }
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

                {!noClientSelected && (
                  <Step1_ClientAndGroupSelection
                    noClientSelected={noClientSelected}
                    selectedClients={selectedClients}
                    setSelectedClients={setSelectedClients}
                    removeClient={removeClient}
                    selectedGroups={selectedGroups}
                    setSelectedGroups={setSelectedGroups}
                    removeGroup={removeGroup}
                    userType={userType}
                    setUserType={setUserType}
                  />
                )}

                <Flex justify="end" mt="4" gap="2">
                  <Button variant="soft" color="gray" onClick={handleCancel}>
                    닫기
                  </Button>
                  <Button
                    variant="soft"
                    onClick={goToNextStep}
                    disabled={
                      !noClientSelected &&
                      selectedClients.length === 0 &&
                      selectedGroups.length === 0
                    }
                  >
                    다음
                  </Button>
                </Flex>
              </>
            )}

            {/* ========== Step2: 담당자 선택 ========== */}
            {step === 2 && (
              <>
                <Dialog.Title className="font-bold text-xl pb-6">
                  2단계: 담당자 선택
                </Dialog.Title>
                <Step2_AssigneeRegistration
                  selectedAssignees={selectedAssignees}
                  setSelectedAssignees={setSelectedAssignees}
                />

                <Flex justify="end" mt="4" gap="2">
                  <Button variant="soft" color="gray" onClick={goToPrevStep}>
                    이전
                  </Button>
                  <Button variant="soft" onClick={goToNextStep}>
                    다음
                  </Button>
                </Flex>
              </>
            )}

            {/* ========== Step3: (채권자/원고) 등록 ========== */}
            {step === 3 && (
              <>
                <Dialog.Title className="font-bold text-xl pb-6">
                  {/* 
                    assignmentType이 '채권'일 때 → "채권자 정보를..."
                    assignmentType이 '소송'일 때 → "원고 정보를..."
                  */}
                  {assignmentType === "소송"
                    ? "3단계: 원고 정보를 입력하세요"
                    : "3단계: 채권자 정보를 입력하세요"}
                </Dialog.Title>

                <Step2_CreditorRegistration
                  assignmentType={assignmentType}
                  selectedCreditors={selectedCreditors}
                  setSelectedCreditors={setSelectedCreditors}
                  removeCreditor={removeCreditor}
                />

                <Flex justify="end" mt="4" gap="2">
                  <Button variant="soft" color="gray" onClick={goToPrevStep}>
                    이전
                  </Button>
                  <Button variant="soft" onClick={goToNextStep}>
                    다음
                  </Button>
                </Flex>
              </>
            )}

            {/* ========== Step4: (채무자/피고) 등록 ========== */}
            {step === 4 && (
              <>
                <Dialog.Title className="font-bold text-xl pb-6">
                  {assignmentType === "소송"
                    ? "4단계: 피고 정보를 입력하세요"
                    : "4단계: 채무자 정보를 입력하세요"}
                </Dialog.Title>

                <Step3_DebtorRegistration
                  assignmentType={assignmentType}
                  selectedDebtors={selectedDebtors}
                  setSelectedDebtors={setSelectedDebtors}
                  removeDebtor={removeDebtor}
                />

                <Flex justify="end" mt="4" gap="2">
                  <Button variant="soft" color="gray" onClick={goToPrevStep}>
                    이전
                  </Button>
                  <Button variant="soft" onClick={goToNextStep}>
                    다음
                  </Button>
                </Flex>
              </>
            )}

            {/* ========== Step5: 의뢰내용 입력 ========== */}
            {step === 5 && (
              <>
                <Dialog.Title className="font-bold text-xl pb-6">
                  5단계: 의뢰 내용을 입력하세요
                </Dialog.Title>
                <Step4_AssignmentContent
                  register={register}
                  goToPrevStep={goToPrevStep}
                  handleSubmit={handleSubmit}
                  onSubmit={onSubmit}
                  errors={errors}
                />
              </>
            )}
          </Dialog.Content>
        </Theme>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default AssignmentForm;
