"use client";

import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { supabase } from "@/utils/supabase";
import { Box, Flex, Button, Text, Checkbox } from "@radix-ui/themes";

export default function AssignmentAssigneeForm({
  open,
  onOpenChange,
  assignmentId,
  existingAssignees = [],
  onAssigneesUpdated,
}) {
  const [internalStaff, setInternalStaff] = useState([]);
  const [externalStaff, setExternalStaff] = useState([]);
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchStaff();
    setSelectedAssignees(
      existingAssignees.map((assignee) => ({
        id: assignee.user_id,
        name: assignee.users?.name || "이름 없음",
        position: assignee.users?.position || "직위 없음",
        employee_type: assignee.users?.employee_type || "",
      })),
    ); // Prepopulate selected assignees with complete user details
  }, [existingAssignees]);

  const fetchStaff = async () => {
    try {
      const { data: internalData, error: internalError } = await supabase
        .from("users")
        .select("id, name, position, employee_type")
        .or("role.eq.staff,role.eq.admin")
        .eq("employee_type", "internal");

      if (internalError) throw internalError;
      const sortedInternalStaff = (internalData || []).sort((a, b) =>
        a.name.localeCompare(b.name),
      );
      const { data: externalData, error: externalError } = await supabase
        .from("users")
        .select("id, name, position, employee_type")
        .eq("role", "staff")
        .eq("employee_type", "external");

      if (externalError) throw externalError;
      const sortedExternalStaff = (externalData || []).sort((a, b) =>
        a.name.localeCompare(b.name),
      );
      setInternalStaff(sortedInternalStaff);
      setExternalStaff(sortedExternalStaff);
    } catch (error) {
      console.error("직원 목록 가져오기 오류:", error);
    }
  };

  const handleToggleAssignee = (staff) => {
    const exists = selectedAssignees.some((a) => a.id === staff.id);
    if (exists) {
      setSelectedAssignees(selectedAssignees.filter((a) => a.id !== staff.id));
    } else {
      setSelectedAssignees([...selectedAssignees, staff]);
    }
  };

  const isChecked = (id) => selectedAssignees.some((a) => a.id === id);

  const handleSave = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const insertData = selectedAssignees.map((assignee) => ({
        assignment_id: assignmentId,
        user_id: assignee.id,
        role: assignee.employee_type,
      }));

      await supabase
        .from("assignment_assignees")
        .delete()
        .eq("assignment_id", assignmentId);

      const { error } = await supabase
        .from("assignment_assignees")
        .insert(insertData);
      if (error) throw error;

      alert("담당자가 성공적으로 업데이트되었습니다.");
      onAssigneesUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error("담당자 업데이트 오류:", error);
      alert("담당자 업데이트 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false); // <-- 로딩 상태 종료
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Overlay className="fixed inset-0 bg-black opacity-50 z-40" />
      <Dialog.Content
        className="
          fixed
          left-1/2 top-1/2
          max-h-[85vh] min-w-[450px] max-w-[650px]
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
        <Dialog.Title className="text-xl font-bold">담당자 배정</Dialog.Title>
        {/* Internal Staff */}
        <Box mb="4">
          <Text size="3" weight="bold" mb="2">
            내부 직원
          </Text>
          <Flex direction="column">
            {internalStaff.map((staff) => (
              <Flex
                key={staff.id}
                align="center"
                style={{
                  backgroundColor: "var(--gray-2)",
                  borderRadius: 4,
                  padding: "8px",
                }}
              >
                <Checkbox
                  checked={isChecked(staff.id)}
                  onCheckedChange={() => handleToggleAssignee(staff)}
                />
                <Text ml="2">
                  {staff.name} ({staff.position || "직위 없음"})
                </Text>
              </Flex>
            ))}
          </Flex>
        </Box>

        {/* External Staff */}
        <Box mb="4">
          <Text size="3" weight="bold" mb="2">
            외부 직원
          </Text>
          <Flex direction="column">
            {externalStaff.map((staff) => (
              <Flex
                key={staff.id}
                align="center"
                style={{
                  backgroundColor: "var(--gray-2)",
                  borderRadius: 4,
                  padding: "8px",
                }}
              >
                <Checkbox
                  checked={isChecked(staff.id)}
                  onCheckedChange={() => handleToggleAssignee(staff)}
                />
                <Text ml="2">
                  {staff.name} ({staff.position || "직위 없음"})
                </Text>
              </Flex>
            ))}
          </Flex>
        </Box>

        {/* Preview Selected Assignees */}
        <Box mt="4">
          <Text size="3" weight="bold" mb="2">
            선택된 담당자
          </Text>
          {selectedAssignees.length === 0 ? (
            <Text as="p">선택된 담당자가 없습니다.</Text>
          ) : (
            <Flex direction="column" gap="2">
              {selectedAssignees.map((assignee) => (
                <Flex
                  key={assignee.id}
                  align="center"
                  style={{
                    backgroundColor: "var(--blue-2)",
                    borderRadius: 4,
                    padding: "8px",
                  }}
                >
                  <Text>
                    {assignee.name} ({assignee.position || "직위 없음"})
                  </Text>
                  <Button
                    variant="ghost"
                    color="red"
                    size="2"
                    style={{ marginLeft: "auto" }}
                    onClick={() =>
                      setSelectedAssignees(
                        selectedAssignees.filter((a) => a.id !== assignee.id),
                      )
                    }
                  >
                    제거
                  </Button>
                </Flex>
              ))}
            </Flex>
          )}
        </Box>

        <Flex justify="end" mt="4" gap="2">
          <Button variant="soft" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button variant="solid" onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? "저장 중..." : "저장"}
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
