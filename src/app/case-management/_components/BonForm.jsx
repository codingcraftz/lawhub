// src/app/case-mangement/_components/BondForm.jsx

"use client";

import React from "react";
import { Box, Flex, Button, Text, Switch } from "@radix-ui/themes";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { supabase } from "@/utils/supabase";
import CustomDatePicker from "@/components/CustomDatePicker";
import useRoleRedirect from "@/hooks/userRoleRedirect";

const BondForm = ({ caseId, bondData, onSuccess, onClose }) => {
  useRoleRedirect(["staff", "admin"], "/");
  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm({
    defaultValues: {
      principal: bondData?.principal || "",
      interest1: {
        start_date: bondData?.interest_1_start_date
          ? new Date(bondData.interest_1_start_date)
          : null,
        end_date:
          bondData?.interest_1_end_date === "dynamic"
            ? null
            : bondData?.interest_1_end_date
              ? new Date(bondData.interest_1_end_date)
              : null,
        rate: bondData?.interest_1_rate || "",
        dynamic_end: bondData?.interest_1_end_date === "dynamic" || false,
      },
      interest2: {
        start_date: bondData?.interest_2_start_date
          ? new Date(bondData.interest_2_start_date)
          : null,
        end_date:
          bondData?.interest_2_end_date === "dynamic"
            ? null
            : bondData?.interest_2_end_date
              ? new Date(bondData.interest_2_end_date)
              : null,
        rate: bondData?.interest_2_rate || "",
        dynamic_end: bondData?.interest_2_end_date === "dynamic" || false,
      },
      expenses: bondData?.expenses || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "expenses",
  });

  const validateExpenses = (expenses) => {
    return expenses.every(
      (expense) => expense.item.trim() !== "" && expense.amount > 0,
    );
  };

  const onSubmit = async (data) => {
    if (!validateExpenses(data.expenses)) {
      alert("비용 항목과 금액을 정확히 입력해주세요.");
      return;
    }

    try {
      const bondPayload = {
        case_id: caseId,
        principal: parseFloat(data.principal),
        interest_1_start_date: data.interest1.start_date || null,
        interest_1_end_date: data.interest1.dynamic_end
          ? "dynamic"
          : data.interest1.end_date || null,
        interest_1_rate: parseFloat(data.interest1.rate),
        interest_2_start_date: data.interest2.start_date || null,
        interest_2_end_date: data.interest2.dynamic_end
          ? "dynamic"
          : data.interest2.end_date || null,
        interest_2_rate: parseFloat(data.interest2.rate),
        expenses: data.expenses,
      };

      // 명시적으로 null 값을 설정
      if (!data.interest1.dynamic_end && !data.interest1.end_date) {
        bondPayload.interest_1_end_date = null;
      }

      if (!data.interest2.dynamic_end && !data.interest2.end_date) {
        bondPayload.interest_2_end_date = null;
      }

      const { error } = bondData
        ? await supabase.from("bonds").update(bondPayload).eq("id", bondData.id)
        : await supabase.from("bonds").insert(bondPayload);

      if (error) throw error;

      alert("저장되었습니다.");
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error saving bond information:", error);
      alert("저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <Box>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Flex
          direction="column"
          gap="4"
          style={{ maxWidth: "600px", margin: "0 auto" }}
        >
          <Text size="4" weight="bold">
            채권 정보 입력
          </Text>
          <Box>
            <Text className="text-md font-semibold">원리금(원)</Text>
            <input
              type="number"
              placeholder="원리금"
              {...register("principal", { required: "원리금을 입력해주세요." })}
              style={{
                marginTop: "0.5rem",
                width: "100%",
                padding: "0.5rem",
                border: "1px solid var(--gray-6)",
                borderRadius: "4px",
              }}
            />
            {errors.principal && (
              <Text color="red" size="2">
                {errors.principal.message}
              </Text>
            )}
          </Box>
          {/* 1차 이자 정보 */}
          <Box>
            <Flex justify="between">
              <Text className="text-md font-semibold mb-2">1차 이자 정보</Text>
              <Controller
                name="interest1.dynamic_end"
                control={control}
                render={({ field }) => (
                  <Flex align="center" justify="end" gap="2">
                    <Text>종기일 미정 (항상 최신 날짜로 갱신)</Text>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </Flex>
                )}
              />
            </Flex>
            <Flex direction="column" gap="2">
              <Flex align="center" gap="2">
                <Controller
                  name="interest1.start_date"
                  control={control}
                  render={({ field }) => (
                    <CustomDatePicker
                      selectedDate={field.value}
                      onDateChange={field.onChange}
                      title="기산일"
                    />
                  )}
                />
                <Text>-</Text>
                <Controller
                  name="interest1.end_date"
                  control={control}
                  render={({ field }) => (
                    <CustomDatePicker
                      selectedDate={field.value}
                      onDateChange={field.onChange}
                      title={
                        watch("interest1.dynamic_end")
                          ? "(동적 종기일 활성화됨)"
                          : "종기일"
                      }
                      disabled={watch("interest1.dynamic_end")}
                    />
                  )}
                />
              </Flex>
              <Text>이자율(%)</Text>
              <Controller
                name="interest1.rate"
                control={control}
                render={({ field }) => (
                  <input
                    type="number"
                    {...field}
                    placeholder="이자율"
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      border: "1px solid var(--gray-6)",
                      borderRadius: "4px",
                    }}
                  />
                )}
              />
            </Flex>
          </Box>
          {/* 2차 이자 정보 */}
          <Box>
            <Flex justify="between">
              <Text className="text-lg font-semibold mb-2">2차 이자 정보</Text>
              <Controller
                name="interest2.dynamic_end"
                control={control}
                render={({ field }) => (
                  <Flex align="center" justify="end" gap="2">
                    <Text>종기일 미정 (항상 최신 날짜로 갱신)</Text>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </Flex>
                )}
              />
            </Flex>
            <Flex direction="column" gap="2">
              <Flex align="center" gap="2">
                <Controller
                  name="interest2.start_date"
                  control={control}
                  render={({ field }) => (
                    <CustomDatePicker
                      selectedDate={field.value}
                      onDateChange={field.onChange}
                      title="기산일"
                    />
                  )}
                />
                <Text>-</Text>
                <Controller
                  name="interest2.end_date"
                  control={control}
                  render={({ field }) => (
                    <CustomDatePicker
                      selectedDate={field.value}
                      onDateChange={field.onChange}
                      title={
                        watch("interest2.dynamic_end")
                          ? "(동적 종기일 활성화됨)"
                          : "종기일"
                      }
                      disabled={watch("interest2.dynamic_end")}
                    />
                  )}
                />
              </Flex>
              <Text>이자율(%)</Text>
              <Controller
                name="interest2.rate"
                control={control}
                render={({ field }) => (
                  <input
                    type="number"
                    {...field}
                    placeholder="이자율"
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      border: "1px solid var(--gray-6)",
                      borderRadius: "4px",
                    }}
                  />
                )}
              />
            </Flex>
          </Box>
          {/* 비용 정보 */}
          <Box>
            <Text className="text-md font-semibold mb-2">비용 정보</Text>
            <Flex direction="column" gap="2">
              {fields.map((field, index) => (
                <Flex key={field.id} align="center" gap="2">
                  <input
                    type="text"
                    placeholder="항목 이름"
                    {...register(`expenses.${index}.item`, {
                      required: "항목 이름을 입력해주세요.",
                    })}
                    style={{ flex: 1, padding: "0.5rem", borderRadius: "4px" }}
                  />
                  <input
                    type="number"
                    placeholder="금액"
                    {...register(`expenses.${index}.amount`, {
                      required: "금액을 입력해주세요.",
                      valueAsNumber: true,
                      validate: (value) =>
                        value > 0 || "0보다 큰 값을 입력해주세요.",
                    })}
                    style={{ flex: 1, padding: "0.5rem", borderRadius: "4px" }}
                  />
                  <Button
                    size="1"
                    variant="ghost"
                    color="red"
                    onClick={() => remove(index)}
                  >
                    삭제
                  </Button>
                </Flex>
              ))}
              <Button
                variant="soft"
                type="button"
                onClick={() => append({ item: "", amount: 0 })}
              >
                추가
              </Button>
            </Flex>
          </Box>
          <Flex gap="3" justify="end">
            <Button color="red" type="button" onClick={onClose}>
              닫기
            </Button>

            <Button type="submit" disabled={!isValid}>
              저장
            </Button>
          </Flex>
        </Flex>
      </form>
    </Box>
  );
};

export default BondForm;
