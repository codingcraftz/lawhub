"use client";

import React, { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Box, Flex, Button, Text } from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";
import { supabase } from "@/utils/supabase";
import ClientGroupSearch from "../ClientGroupSearch";

export default function AssigmentEditFrom({
  open,
  onOpenChange,
  assignment,
  onAssignmentUpdated,
}) {
  const [description, setDescription] = useState("");
  const [assignedClients, setAssignedClients] = useState([]);
  const [assignedGroups, setAssignedGroups] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && assignment) {
      setDescription(assignment.description || "");
      const clientData = (assignment.assignment_clients || []).map((ac) => ({
        client_id: ac.client_id,
        type: ac.type,
        name: ac.client?.name || "",
        phone_number: ac.client?.phone_number || "",
      }));
      setAssignedClients(clientData);
      const groupData = (assignment.assignment_groups || []).map((ag) => ({
        group_id: ag.group_id,
        type: ag.type,
        name: ag.group?.name || "",
      }));
      setAssignedGroups(groupData);
    }
  }, [open, assignment]);

  const removeClient = (clientId) => {
    setAssignedClients((prev) => prev.filter((c) => c.client_id !== clientId));
  };

  const removeGroup = (groupId) => {
    setAssignedGroups((prev) => prev.filter((g) => g.group_id !== groupId));
  };

  const handleSave = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { error: updateError } = await supabase
        .from("assignments")
        .update({ description })
        .eq("id", assignment.id);

      if (updateError) throw updateError;
      const oldClients = assignment.assignment_clients || [];
      const newClients = assignedClients;

      const removed = oldClients.filter(
        (oc) => !newClients.some((nc) => nc.client_id === oc.client_id),
      );
      const added = newClients.filter(
        (nc) => !oldClients.some((oc) => oc.client_id === nc.client_id),
      );

      if (removed.length > 0) {
        for (const r of removed) {
          const { error: removeErr } = await supabase
            .from("assignment_clients")
            .delete()
            .eq("assignment_id", assignment.id)
            .eq("client_id", r.client_id);
          if (removeErr) throw removeErr;
        }
      }

      // 추가
      if (added.length > 0) {
        const insertData = added.map((item) => ({
          assignment_id: assignment.id,
          client_id: item.client_id,
          type: item.type || null, // 예시
        }));
        const { error: addErr } = await supabase
          .from("assignment_clients")
          .insert(insertData);
        if (addErr) throw addErr;
      }

      const oldGroups = assignment.assignment_groups || [];
      const newGroups = assignedGroups;

      const removedGroup = oldGroups.filter(
        (og) => !newGroups.some((ng) => ng.group_id === og.group_id),
      );
      const addedGroup = newGroups.filter(
        (ng) => !oldGroups.some((og) => og.group_id === ng.group_id),
      );

      // 삭제
      if (removedGroup.length > 0) {
        for (const rg of removedGroup) {
          const { error: removeGroupErr } = await supabase
            .from("assignment_groups")
            .delete()
            .eq("assignment_id", assignment.id)
            .eq("group_id", rg.group_id);
          if (removeGroupErr) throw removeGroupErr;
        }
      }

      // 추가
      if (addedGroup.length > 0) {
        const insertData = addedGroup.map((g) => ({
          assignment_id: assignment.id,
          group_id: g.group_id,
          type: g.type || null,
        }));
        const { error: addGroupErr } = await supabase
          .from("assignment_groups")
          .insert(insertData);
        if (addGroupErr) throw addGroupErr;
      }

      // 성공 시
      alert("의뢰 정보가 수정되었습니다.");
      onOpenChange(false);
      onAssignmentUpdated && onAssignmentUpdated();
    } catch (err) {
      console.error("Error updating assignment:", err);
      alert("의뢰 수정 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Overlay className="fixed inset-0 bg-black opacity-50 z-40" />
      <Dialog.Content className="fixed bg-gray-2 left-1/2 top-1/2 max-h-[80vh] w-full max-w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-md p-6 shadow-lg z-50 overflow-y-auto">
        {/* 닫기 버튼 */}
        <Dialog.Close asChild>
          <Button
            variant="ghost"
            color="gray"
            style={{ position: "absolute", top: 20, right: 20 }}
          >
            <Cross2Icon width={25} height={25} />
          </Button>
        </Dialog.Close>

        <Text size="4" weight="bold" className="mb-4">
          의뢰 수정
        </Text>

        {/* 의뢰 내용 수정 */}
        <Box className="mb-6">
          <Text size="3" className="mb-2 font-semibold">
            의뢰 내용
          </Text>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full h-24 rounded border border-gray-6 p-2"
          />
        </Box>

        {/* 의뢰인/그룹 수정 */}
        <Box className="mb-6">
          <Text size="3" weight="bold" className="mb-2">
            의뢰인 / 그룹
          </Text>
          <ClientGroupSearch
            assignedClients={assignedClients}
            setAssignedClients={setAssignedClients}
            assignedGroups={assignedGroups}
            setAssignedGroups={setAssignedGroups}
          />
        </Box>

        {/* 선택된 의뢰인 목록 */}
        <Box className="mb-4">
          <Text size="3" weight="bold" className="mb-2">
            선택된 의뢰인
          </Text>
          <Box className="space-y-1">
            {assignedClients.map((client) => (
              <Flex
                key={client.client_id}
                align="center"
                justify="between"
                className="p-1 bg-gray-2 rounded"
              >
                <Text>
                  {client.name}
                  {client.phone_number ? ` (${client.phone_number})` : ""}
                </Text>
                <Button
                  variant="ghost"
                  size="2"
                  onClick={() => removeClient(client.client_id)}
                >
                  <Cross2Icon width={15} height={15} />
                </Button>
              </Flex>
            ))}
          </Box>
        </Box>

        {/* 선택된 그룹 목록 */}
        <Box className="mb-4">
          <Text size="3" weight="bold" className="mb-2">
            선택된 그룹
          </Text>
          <Box className="space-y-1">
            {assignedGroups.map((group) => (
              <Flex
                key={group.group_id}
                align="center"
                justify="between"
                className="p-1 bg-gray-2 rounded"
              >
                <Text>{group.name}</Text>
                <Button
                  variant="ghost"
                  size="2"
                  onClick={() => removeGroup(group.group_id)}
                >
                  <Cross2Icon width={15} height={15} />
                </Button>
              </Flex>
            ))}
          </Box>
        </Box>

        {/* 버튼 */}
        <Flex justify="end" gap="2">
          <Dialog.Close asChild>
            <Button variant="soft" color="gray">
              취소
            </Button>
          </Dialog.Close>
          <Button
            variant="solid"
            color="blue"
            onClick={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? "저장 중..." : "저장"}
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
