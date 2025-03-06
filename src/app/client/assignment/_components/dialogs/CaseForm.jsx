"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Flex, Text, Button } from "@radix-ui/themes";
import * as Dialog from "@radix-ui/react-dialog";
import { useForm } from "react-hook-form";
import { Cross2Icon } from "@radix-ui/react-icons";
import DynamicSelect from "../DynamicSelect";

import { COURT_LIST, COURT_CITIES } from "@/utils/courtList";
import { CASE_TYPE_OPTIONS } from "@/utils/caseType";
import { CASE_CATEGORIES } from "@/utils/caseCategory";

const clientRoles = [
  "미정",
  "원고",
  "피고",
  "신청인",
  "피신청인",
  "고소인",
  "피고소인",
  "채권자",
  "채무자",
];

const CaseForm = ({
  caseData,
  onSuccess,
  onClose,
  open,
  onOpenChange,
  assignmentId,
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      status: "ongoing",
      court_name: "",
      case_number: "",
      case_subject: "",
      category: "",
      client_role: clientRoles[0],
      description: "",
      end_date: "",
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (caseData) {
      setValue("status", caseData?.status || "");
      setValue("court_name", caseData.court_name || "");
      setValue("case_number", caseData.case_number || "");
      setValue("case_subject", caseData.case_subject || "");
      setValue("category", caseData.category || "");
      setValue("client_role", caseData.client_role || clientRoles[0]);
      setValue("description", caseData.description || "");
      setValue("end_date", caseData.end_date || "");
    }
  }, [caseData, setValue]);

  const onSubmit = async (formValues) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = {
        status: formValues.status || null,
        court_name: formValues.court_name || null,
        case_number: formValues.case_number || null,
        case_subject: formValues.case_subject || null,
        category: formValues.category || null,
        client_role: formValues.client_role || null,
        description: formValues.description || null,
        end_date: formValues.end_date || null,
        assignment_id: assignmentId || null,
      };

      let savedCase;
      if (caseData) {
        const { data, error } = await supabase
          .from("cases")
          .update(payload)
          .eq("id", caseData.id)
          .select("*")
          .single();
        if (error) throw error;
        savedCase = data;
      } else {
        const { data, error } = await supabase
          .from("cases")
          .insert([payload])
          .select("*")
          .single();
        if (error) throw error;
        savedCase = data;
      }
      if (onSuccess) onSuccess(savedCase);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      alert("저장 실패");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!caseData?.id) {
      alert("삭제할 항목이 없습니다.");
      return;
    }
    const confirmation = confirm("정말로 이 항목을 삭제하시겠습니까?");
    if (!confirmation) return;

    try {
      const { error } = await supabase
        .from("cases")
        .delete()
        .eq("id", caseData.id);

      if (error) {
        throw new Error("소송 항목 삭제 중 오류가 발생했습니다.");
      }

      alert("항목이 성공적으로 삭제되었습니다.");
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting timeline item:", error);
      alert("항목 삭제 중 오류가 발생했습니다.");
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Overlay className="fixed inset-0 bg-black opacity-50 z-40" />
      <Dialog.Content
        className="
          fixed 
          left-1/2 top-1/2 
          max-h-[85vh] w-full max-w-[600px]
          -translate-x-1/2 -translate-y-1/2
          rounded-md p-6
          bg-gray-2 border border-gray-6
          shadow-md shadow-gray-7
          text-gray-12
          focus:outline-none
          z-50
          overflow-y-auto
        "
      >
        <Flex justify="between" align="center" className="mb-4">
          <Dialog.Title className="font-bold text-xl">
            {caseData ? "소송 수정" : "소송 등록"}
          </Dialog.Title>
          <Dialog.Close asChild>
            <Button variant="ghost" color="gray">
              <Cross2Icon width={20} height={20} />
            </Button>
          </Dialog.Close>
        </Flex>

        <Box className="py-2 text-md">
          <form onSubmit={handleSubmit(onSubmit)}>
            <Flex direction="column" gap="4">
              <Box>
                <Text size="2" color="gray" className="mb-1">
                  상태
                </Text>
                <select
                  {...register("status")}
                  className="w-full p-2 border border-gray-6 rounded"
                >
                  <option value="ongoing">진행</option>
                  <option value="closed">완료</option>
                </select>
              </Box>

              <Box>
                <Text size="2" color="gray" className="mb-1">
                  법원
                </Text>
                <input
                  type="text"
                  {...register("court_name")}
                  className="w-full p-2 border border-gray-6 rounded"
                  placeholder="예) 서울중앙지방법원"
                />
              </Box>

              <Box>
                <Text size="2" color="gray" className="mb-1">
                  사건 번호
                </Text>
                <input
                  type="text"
                  {...register("case_number")}
                  className="w-full p-2 border border-gray-6 rounded"
                  placeholder="예) 2023가단12345"
                />
              </Box>

              <Box>
                <Text size="2" color="gray" className="mb-1">
                  사건 세부
                </Text>
                <input
                  type="text"
                  {...register("case_subject")}
                  className="w-full p-2 border border-gray-6 rounded"
                  placeholder="예) 손해배상(기)"
                />
              </Box>

              <Box>
                <Text size="2" color="gray" className="mb-1">
                  카테고리
                </Text>
                <select
                  {...register("category")}
                  className="w-full p-2 border border-gray-6 rounded"
                >
                  <option value="">카테고리 선택</option>
                  {CASE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </Box>

              <Box>
                <Text size="2" color="gray" className="mb-1">
                  의뢰인 역할
                </Text>
                <select
                  {...register("client_role")}
                  className="w-full p-2 border border-gray-6 rounded"
                >
                  {clientRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </Box>

              <Box>
                <Text size="2" color="gray" className="mb-1">
                  종료일
                </Text>
                <input
                  type="date"
                  {...register("end_date")}
                  className="w-full p-2 border border-gray-6 rounded"
                />
              </Box>

              <Box>
                <Text size="2" color="gray" className="mb-1">
                  설명
                </Text>
                <textarea
                  {...register("description")}
                  className="w-full p-2 border border-gray-6 rounded"
                  rows={4}
                  placeholder="사건에 대한 설명을 입력하세요"
                />
              </Box>

              <Flex justify="end" gap="2">
                {caseData && (
                  <Button
                    type="button"
                    color="red"
                    variant="soft"
                    onClick={handleDelete}
                  >
                    삭제
                  </Button>
                )}
                <Button variant="soft" color="gray" onClick={onClose}>
                  닫기
                </Button>
                <Button variant="solid" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "저장 중..." : "저장"}
                </Button>
              </Flex>
            </Flex>
          </form>
        </Box>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default CaseForm;
