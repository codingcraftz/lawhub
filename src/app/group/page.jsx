"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Flex, Button, Text, Card, Switch } from "@radix-ui/themes";
import GroupForm from "./GroupForm";
import GroupMembersEditor from "./GroupMembersEditor";

export default function GroupManagementPage() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isAddingGroup, setIsAddingGroup] = useState(false);

  // Fetch groups
  const fetchGroups = async () => {
    const { data, error } = await supabase.from("groups").select("*");
    if (error) {
      console.error("그룹 목록 불러오기 오류:", error);
    } else {
      setGroups(data || []);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // Handle adding a new group
  const handleGroupAdded = () => {
    setIsAddingGroup(false);
    fetchGroups();
  };

  // Handle selecting a group
  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
  };

  return (
    <Box p="4" className="w-full max-w-screen-lg mx-auto">
      {/* Header */}
      <Flex justify="between" align="center" mb="4" className="flex-wrap gap-4">
        <Text size="5" weight="bold">
          그룹 관리
        </Text>
        {isAddingGroup ? (
          <GroupForm
            onCancel={() => setIsAddingGroup(false)}
            onSuccess={handleGroupAdded}
          />
        ) : (
          <Button variant="solid" onClick={() => setIsAddingGroup(true)}>
            + 새 그룹 추가
          </Button>
        )}
      </Flex>

      <Flex gap="6" mt="4" className="flex-wrap">
        {/* Sidebar: Group List */}
        <Card
          p="3"
          className="w-full md:w-1/4 max-h-[300px] md:max-h-[500px] overflow-auto shadow-md"
        >
          <Text weight="bold" size="4" mb="3">
            그룹 목록
          </Text>
          {groups.map((group) => (
            <Box
              key={group.id}
              p="2"
              className={`cursor-pointer rounded-md ${
                selectedGroup?.id === group.id
                  ? "bg-primary-3 text-primary-11"
                  : "hover:bg-gray-3"
              }`}
              onClick={() => handleSelectGroup(group)}
            >
              {group.name}
            </Box>
          ))}
        </Card>

        {/* Main Content: Group Details */}
        <Card p="4" className="flex-1 shadow-md w-full md:w-3/4">
          {selectedGroup ? (
            <>
              <GroupDetails
                selectedGroup={selectedGroup}
                fetchGroups={fetchGroups}
              />
            </>
          ) : (
            <Flex justify="center" align="center" className="h-full">
              <Text>좌측에서 그룹을 선택해주세요.</Text>
            </Flex>
          )}
        </Card>
      </Flex>
    </Box>
  );
}

function GroupDetails({ selectedGroup, fetchGroups }) {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(selectedGroup.name);

  useEffect(() => {
    setIsEditing(false); // Reset editing state when group changes
    setNewName(selectedGroup.name); // Reset name field when group changes
  }, [selectedGroup]);

  const handleSave = async () => {
    const { error } = await supabase
      .from("groups")
      .update({ name: newName })
      .eq("id", selectedGroup.id);
    if (error) {
      console.error("그룹 수정 오류:", error);
      alert("수정 중 오류가 발생했습니다.");
    } else {
      alert("그룹 이름이 수정되었습니다.");
      fetchGroups();
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    const { error } = await supabase
      .from("groups")
      .delete()
      .eq("id", selectedGroup.id);
    if (error) {
      console.error("그룹 삭제 오류:", error);
      alert("삭제 중 오류가 발생했습니다.");
    } else {
      alert("그룹이 삭제되었습니다.");
      fetchGroups();
    }
  };

  return (
    <>
      <Flex justify="between" align="center" mb="2">
        {/* 그룹 이름 + 스위치 (토글 수정) */}
        <Flex align="center" gap="2">
          <Text className="text-lg font-bold">{selectedGroup.name}</Text>
          <Switch
            checked={isEditing}
            onCheckedChange={(checked) => setIsEditing(checked)}
          />
        </Flex>
      </Flex>

      {/* 수정 모드 활성화 시 입력창 표시 */}
      {isEditing ? (
        <Flex gap="2" align="center" mt="2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{
              padding: "0.6rem",
              border: "1px solid var(--gray-6)",
              borderRadius: "var(--radius-2)",
              flex: 1,
            }}
          />
          <Button onClick={handleSave}>저장</Button>
          <Button variant="outline" onClick={() => setIsEditing(false)}>
            취소
          </Button>
        </Flex>
      ) : (
        <Button variant="soft" color="red" onClick={handleDelete}>
          삭제
        </Button>
      )}

      <Box mt="4">
        <GroupMembersEditor group={selectedGroup} />
      </Box>
    </>
  );
}
