// src/app/case-management/_components/TimeLineForm.jsx

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/utils/supabase";
import {
  Box,
  Button,
  Flex,
  Select,
  TextArea,
  Text,
  Dialog,
} from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";
import { Controller } from "react-hook-form";
import { useUser } from "@/hooks/useUser";
import useRoleRedirect from "@/hooks/userRoleRedirect";

const TimelineForm = ({ caseId, onSuccess, editingItem, onClose }) => {
  useRoleRedirect(["staff", "admin"], "/");
  const [staff, setStaff] = useState([]);
  const { user } = useUser();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
  } = useForm({
    mode: "onChange",
    defaultValues: editingItem || {},
  });

  useEffect(() => {
    fetchStaff();
    if (editingItem) {
      Object.keys(editingItem).forEach((key) => {
        setValue(key, editingItem[key]);
      });
    }
  }, [editingItem, setValue]);

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, role")
        .in("role", ["admin", "staff"]);

      if (error) throw error;
      setStaff(data);
    } catch (error) {
      console.error("Error fetching staff:", error);
    }
  };

  const onSubmit = async (data) => {
    try {
      const timelineData = {
        type: data.type,
        description: data.description,
        case_id: caseId,
        status: "대기중",
        created_by: user.id,
      };

      if (
        data.type === "요청" &&
        data.requested_to &&
        data.requested_to !== "none"
      ) {
        timelineData.requested_to = data.requested_to;
      }

      let result;
      if (editingItem) {
        result = await supabase
          .from("case_timelines")
          .update(timelineData)
          .eq("id", editingItem.id)
          .select();
      } else {
        result = await supabase
          .from("case_timelines")
          .insert(timelineData)
          .select();
      }

      if (result.error) throw result.error;

      if (
        !editingItem &&
        result.data &&
        result.data[0] &&
        data.type === "요청" &&
        data.requested_to &&
        data.requested_to !== "none"
      ) {
        await supabase.from("requests").insert({
          case_timeline_id: result.data[0].id,
          requester_id: user.id,
          receiver_id: data.requested_to,
          status: "ongoing",
        });

        await supabase.from("notifications").insert({
          user_id: data.requested_to,
          case_id: caseId, // 사건 ID 추가
          case_timeline_id: result.data[0].id,
          type: "요청", // 요청 유형 지정
          message: `${data.description}`,
          is_read: false,
        });
      }

      onSuccess();
    } catch (error) {
      console.error("Error saving timeline item:", error);
      alert("타임라인 항목 저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <Box>
      <Dialog.Close>
        <Button
          variant="ghost"
          color="gray"
          size="1"
          style={{ position: "absolute", top: 8, right: 8 }}
        >
          <Cross2Icon />
        </Button>
      </Dialog.Close>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Flex direction="column" gap="3">
          <Box>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select.Root onValueChange={field.onChange} value={field.value}>
                  <Select.Trigger placeholder="유형 선택" />
                  <Select.Content>
                    <Select.Group>
                      <Select.Label>유형</Select.Label>
                      <Select.Item value="요청">요청</Select.Item>
                      <Select.Item value="완료">완료</Select.Item>
                      <Select.Item value="상담">상담</Select.Item>
                      <Select.Item value="접수">접수</Select.Item>
                    </Select.Group>
                  </Select.Content>
                </Select.Root>
              )}
            />
            {errors.type && (
              <Text color="red" size="1">
                {errors.type.message}
              </Text>
            )}
          </Box>

          <Controller
            name="type"
            control={control}
            render={({ field }) =>
              field.value === "요청" && (
                <Box>
                  <Controller
                    name="requested_to"
                    control={control}
                    render={({ field }) => (
                      <Select.Root
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <Select.Trigger placeholder="요청 대상 선택" />
                        <Select.Content>
                          <Select.Group>
                            <Select.Label>요청 대상</Select.Label>
                            <Select.Item value="none">선택 안함</Select.Item>
                            {staff.map(
                              (s) =>
                                s.id && (
                                  <Select.Item key={s.id} value={s.id}>
                                    {s.name} ({s.role})
                                  </Select.Item>
                                ),
                            )}
                          </Select.Group>
                        </Select.Content>
                      </Select.Root>
                    )}
                  />
                  {errors.requested_to && (
                    <Text color="red" size="1">
                      {errors.requested_to.message}
                    </Text>
                  )}
                </Box>
              )
            }
          />

          <Box>
            <TextArea
              placeholder="설명"
              {...register("description")}
              style={{ minHeight: "100px" }}
            />
            {errors.description && (
              <Text color="red" size="1">
                {errors.description.message}
              </Text>
            )}
          </Box>

          <Flex gap="3" mt="4" justify="end">
            <Button variant="soft" color="gray" onClick={onClose}>
              취소
            </Button>
            <Button type="submit">{editingItem ? "수정" : "등록"}</Button>
          </Flex>
        </Flex>
      </form>
    </Box>
  );
};

export default TimelineForm;
