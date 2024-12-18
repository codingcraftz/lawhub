// src/app/boards/_components/DeadlineForm.jsx

"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Box, Button, Flex, Text } from "@radix-ui/themes";
import { supabase } from "@/utils/supabase";
import CustomDatePicker from "@/components/CustomDatePicker";
import useRoleRedirect from "@/hooks/userRoleRedirect";

const DeadlineForm = ({ caseId, onSuccess, onClose, editingDeadline }) => {
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
    <Box>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Flex direction="column" gap="3">
          {/* caseId가 없는 경우 사건 선택 UI 표시 */}
          {!caseId && (
            <Box>
              <select
                {...register("case_id", { required: "사건을 선택해주세요." })}
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
              {...register("type", { required: "기일 유형을 입력해주세요" })}
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
            <Button type="submit" disabled={isSubmitting}>
              {editingDeadline ? "수정" : "등록"}
            </Button>
          </Flex>
        </Flex>
      </form>
    </Box>
  );
};

export default DeadlineForm;
