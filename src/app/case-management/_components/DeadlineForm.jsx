// src/app/boards/_components/DeadlineForm.jsx

"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Box, Button, Flex, Text } from "@radix-ui/themes";
import * as Dialog from "@radix-ui/react-dialog";
import { supabase } from "@/utils/supabase";
import CustomDatePicker from "@/components/CustomDatePicker";
import useRoleRedirect from "@/hooks/userRoleRedirect";
import { Cross2Icon, PlusIcon } from "@radix-ui/react-icons";

const DeadlineForm = ({
  caseId,
  onSuccess,
  onClose,
  editingDeadline,
  setEditingDeadline,
  open,
  onOpenChange,
}) => {
  useRoleRedirect(["staff", "admin"], "/");
  const {
    control,
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      type: editingDeadline?.type || "",
      deadline_date: editingDeadline?.deadline_date
        ? new Date(editingDeadline.deadline_date)
        : null,
      location: editingDeadline?.location || "",
      case_id: caseId || "", // 만약 caseId가 제공되지 않는다면 ""로 시작
    },
  });

  const [cases, setCases] = useState([]);

  useEffect(() => {
    if (!caseId) {
      const fetchCases = async () => {
        try {
          const { data, error } = await supabase
            .from("cases")
            .select("id, title")
            .order("created_at", { ascending: true });

          if (error) throw error;

          setCases(data || []);
        } catch (error) {
          console.error("사건 목록 불러오는 중 오류:", error);
        }
      };
      fetchCases();
    }
  }, [caseId]);

  const onSubmit = async (data) => {
    try {
      const finalCaseId = caseId || data.case_id;
      if (!finalCaseId) {
        alert("사건을 선택해주세요.");
        return;
      }

      if (editingDeadline?.id) {
        const { error } = await supabase
          .from("case_deadlines")
          .update({
            type: data.type,
            deadline_date: data.deadline_date,
            location: data.location,
          })
          .eq("id", editingDeadline.id);
        if (error) throw error;
        onSuccess("기일이 성공적으로 수정되었습니다!");
      } else {
        const { error } = await supabase.from("case_deadlines").insert({
          case_id: finalCaseId,
          type: data.type,
          deadline_date: data.deadline_date,
          location: data.location,
        });
        if (error) throw error;
        onSuccess("기일이 성공적으로 추가되었습니다!");
      }
    } catch (error) {
      console.error("기일 저장 중 오류:", error);
      alert("기일 저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger asChild>
        <Button
          variant="soft"
          size="2"
          onClick={() => setEditingDeadline(null)}
        >
          <PlusIcon /> 기일 추가
        </Button>
      </Dialog.Trigger>
      <Dialog.Overlay className="fixed inset-0 bg-black opacity-75 z-10" />
      <Dialog.Content className="fixed bg-gray-3 left-1/2 top-1/2 min-w-[450px] max-h-[85vh] max-w-[650px] -translate-x-1/2 -translate-y-1/2 rounded-md p-[25px] shadow focus:outline-none data-[state=open]:animate-contentShow z-20">
        <Dialog.Title>
          {editingDeadline ? "기일 수정" : "새 기일 추가"}
        </Dialog.Title>
        <Dialog.Close asChild>
          <Button
            variant="ghost"
            color="gray"
            style={{ position: "absolute", top: 8, right: 8 }}
          >
            <Cross2Icon width={25} height={25} />
          </Button>
        </Dialog.Close>
        <Box>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Flex direction="column" gap="3">
              {/* caseId가 없는 경우 사건 선택 UI 표시 */}
              {!caseId && (
                <Box>
                  <select
                    {...register("case_id", {
                      required: "사건을 선택해주세요.",
                    })}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      border: "1px solid var(--gray-6)",
                      borderRadius: "var(--radius-2)",
                    }}
                  >
                    <option value="">사건을 선택해주세요</option>
                    {cases.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                  {errors.case_id && (
                    <Text color="red">{errors.case_id.message}</Text>
                  )}
                </Box>
              )}

              <Box>
                <input
                  {...register("type", {
                    required: "기일 유형을 입력해주세요",
                  })}
                  placeholder="기일 유형 (예: 변론, 수사, 감정)"
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    border: "1px solid var(--gray-6)",
                    borderRadius: "var(--radius-2)",
                  }}
                />
                {errors.type && <Text color="red">{errors.type.message}</Text>}
              </Box>
              <Box>
                <Controller
                  name="deadline_date"
                  control={control}
                  rules={{ required: "기일 날짜를 선택해주세요" }}
                  render={({ field }) => (
                    <CustomDatePicker
                      selectedDate={field.value}
                      onDateChange={field.onChange}
                      title="기일 날짜 및 시간 선택"
                      showTimeSelect
                      timeIntervals={10}
                      timeFormat="HH:mm"
                      dateFormat="yyyy-MM-dd HH:mm"
                    />
                  )}
                />
                {errors.deadline_date && (
                  <Text color="red">{errors.deadline_date.message}</Text>
                )}
              </Box>
              <Box>
                <input
                  {...register("location", { required: "장소를 입력해주세요" })}
                  placeholder="장소"
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    border: "1px solid var(--gray-6)",
                    borderRadius: "var(--radius-2)",
                  }}
                />
                {errors.location && (
                  <Text color="red">{errors.location.message}</Text>
                )}
              </Box>
              <Flex gap="3" mt="4" justify="end">
                <Button
                  variant="soft"
                  color="gray"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  취소
                </Button>
                <Button variant="soft" type="submit" disabled={isSubmitting}>
                  {editingDeadline ? "수정" : "등록"}
                </Button>
              </Flex>
            </Flex>
          </form>
        </Box>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default DeadlineForm;
