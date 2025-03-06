// src/app/case-management/_components/TimeLineForm.jsx

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/utils/supabase";
import * as Dialog from "@radix-ui/react-dialog";

import {
  Box,
  Button,
  Flex,
  Select,
  TextArea,
  Text,
  Theme,
} from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";
import { Controller } from "react-hook-form";
import { useUser } from "@/hooks/useUser";
import useRoleRedirect from "@/hooks/userRoleRedirect";

const TimelineForm = ({
  caseId,
  onSuccess,
  editingItem,
  open,
  onOpenChange,
}) => {
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

      if (onSuccess) onSuccess();
      alert("요청이 저장되었습니다.");
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving timeline item:", error);
      alert("타임라인 항목 저장 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = async () => {
    if (!editingItem?.id) {
      alert("삭제할 항목이 없습니다.");
      return;
    }

    const confirmation = confirm("정말로 이 항목을 삭제하시겠습니까?");
    if (!confirmation) return;

    try {
      const { error } = await supabase
        .from("case_timelines")
        .delete()
        .eq("id", editingItem.id);

      if (error) {
        throw new Error("타임라인 항목 삭제 중 오류가 발생했습니다.");
      }

      alert("항목이 성공적으로 삭제되었습니다.");
      if (onSuccess) onSuccess(); // 부모 컴포넌트에서 상태를 갱신
      onOpenChange(false); // 다이얼로그 닫기
    } catch (error) {
      console.error("Error deleting timeline item:", error);
      alert("항목 삭제 중 오류가 발생했습니다.");
    }
  };

  return (
    <Dialog.Portal>
      <Theme>
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-50 z-30" />
          <Dialog.Content className="fixed bg-gray-3 left-1/2 top-1/2 max-h-[85vh] w-full max-w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-md p-[25px] shadow focus:outline-none z-40 overflow-y-auto">
            <Dialog.Title className="font-bold text-xl">
              신용정보 수정
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                color="gray"
                style={{ position: "absolute", top: 24, right: 24 }}
              >
                <Cross2Icon width={25} height={25} />
              </Button>
            </Dialog.Close>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Flex direction="column" gap="3">
                <Box>
                  <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                      <Select.Root
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <Select.Trigger placeholder="유형 선택" />
                        <Select.Content className="z-[1000]">
                          <Select.Group>
                            <Select.Label>유형</Select.Label>
                            <Select.Item value="요청">요청</Select.Item>
                            <Select.Item value="요청완료">요청완료</Select.Item>
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
                              <Select.Content className="z-[1000]">
                                <Select.Group>
                                  <Select.Label>요청 대상</Select.Label>
                                  <Select.Item value="none">
                                    선택 안함
                                  </Select.Item>
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
                  {editingItem && (
                    <Button
                      type="button"
                      color="red"
                      variant="soft"
                      onClick={handleDelete}
                    >
                      삭제
                    </Button>
                  )}
                  <Button
                    variant="soft"
                    color="gray"
                    type="button"
                    onClick={() => onOpenChange(false)}
                  >
                    닫기
                  </Button>
                  <Button type="submit">{editingItem ? "수정" : "등록"}</Button>
                </Flex>
              </Flex>
            </form>
          </Dialog.Content>
        </Dialog.Root>
      </Theme>
    </Dialog.Portal>
  );
};

export default TimelineForm;
