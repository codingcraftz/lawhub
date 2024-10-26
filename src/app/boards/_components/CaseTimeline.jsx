// src/app/boards/_components/CaseTimeline.jsx

const getTypeColor = (type) => {
  switch (type) {
    case "요청":
      return "bg-blue-200 text-blue-900";
    case "완료":
      return "bg-green-200 text-green-900";
    case "상담":
      return "bg-purple-200 text-purple-900";
    case "접수":
      return "bg-yellow-200 text-yellow-900";
    default:
      return "bg-gray-200 text-gray-900";
  }
};

import React, { useState, useEffect } from "react";
import { Box, Flex, Text, Badge, Button, Dialog } from "@radix-ui/themes";
import { PlusIcon } from "@radix-ui/react-icons";
import { supabase } from "@/utils/supabase";
import TimelineForm from "./TimeLineForm";

const CaseTimeline = ({ caseId, caseStatus, onClose }) => {
  const [timelineItems, setTimelineItems] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    console.log("CaseTimeline component mounted or caseId changed:", caseId);
    fetchTimelineItems();
    fetchCurrentUser();
  }, [caseId]);

  const fetchCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();
      if (!error && data) {
        setCurrentUser({ ...user, role: data.role });
      }
    }
  };

  const fetchTimelineItems = async () => {
    try {
      const { data, error } = await supabase
        .from("case_timelines")
        .select(
          `
        *,
        created_by(id, name),
        requested_to(id, name)
      `,
        )
        .eq("case_id", caseId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching timeline items:", error);
      } else {
        setTimelineItems(data);
      }
    } catch (error) {
      console.error("Error fetching timeline items:", error);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("정말로 이 항목을 삭제하시겠습니까?")) {
      try {
        const { error } = await supabase
          .from("case_timelines")
          .delete()
          .eq("id", id);
        if (error) throw error;
        fetchTimelineItems();
      } catch (error) {
        console.error("Error deleting timeline item:", error);
        alert("타임라인 항목 삭제 중 오류가 발생했습니다.");
      }
    }
  };

  const handleFormSuccess = () => {
    fetchTimelineItems();
    setIsDialogOpen(false);
    setEditingItem(null);
  };

  const isAdmin = currentUser?.role === "admin";

  const handleCaseCompletion = async () => {
    if (
      window.confirm(
        "정말로 이 사건을 완료하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
      )
    ) {
      try {
        const { error } = await supabase
          .from("cases")
          .update({ status: "completed" })
          .eq("id", caseId);
        if (error) throw error;
        alert("사건이 성공적으로 완료되었습니다.");
        onClose(); // 타임라인을 닫고 사건 목록으로 돌아갑니다.
        window.location.reload(); // 페이지를 새로고침하여 변경사항을 반영합니다.
      } catch (error) {
        console.error("Error completing case:", error);
        alert("사건 완료 중 오류가 발생했습니다.");
      }
    }
  };

  return (
    <Box>
      <Flex direction="column" gap="4">
        <Flex justify="between" align="center">
          <Text size="5" weight="bold">
            사건 타임라인
          </Text>
          {caseStatus !== "completed" && (
            <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <Dialog.Trigger>
                <Button size="2" onClick={() => setEditingItem(null)}>
                  <PlusIcon />새 항목 추가
                </Button>
              </Dialog.Trigger>
              <Dialog.Content>
                <Dialog.Title>
                  {editingItem ? "타임라인 항목 수정" : "새 타임라인 항목 추가"}
                </Dialog.Title>
                <TimelineForm
                  caseId={caseId}
                  onSuccess={handleFormSuccess}
                  editingItem={editingItem}
                  onClose={() => setIsDialogOpen(false)}
                />
              </Dialog.Content>
            </Dialog.Root>
          )}
        </Flex>

        {/* 타임라인 항목들 */}
        <Flex direction="column" gap="3">
          {timelineItems.map((item, index) => (
            <Box
              key={item.id}
              style={{
                paddingLeft: "1.5rem",
                position: "relative",
                borderLeft: "2px solid var(--gray-6)",
                paddingLeft: "1rem",
              }}
            >
              <Box
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: "var(--gray-6)",
                  position: "absolute",
                  left: "-6px",
                }}
              />
              <Flex justify="between" align="center">
                <Flex align="center" gap="2">
                  <Text size="2" color="gray">
                    {new Date(item.created_at).toLocaleString("ko-KR", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </Text>
                  <Badge className={getTypeColor(item.type)}>{item.type}</Badge>
                </Flex>
                {isAdmin && caseStatus !== "completed" && (
                  <Flex gap="2">
                    <Button
                      size="1"
                      variant="soft"
                      onClick={() => handleEdit(item)}
                    >
                      수정
                    </Button>
                    <Button
                      size="1"
                      variant="soft"
                      color="red"
                      onClick={() => handleDelete(item.id)}
                    >
                      삭제
                    </Button>
                  </Flex>
                )}
              </Flex>
              <Flex className="justify-between">
                <Text size="3" mt="1">
                  {item.description}
                </Text>
                <Text size="2" color="gray" mt="1">
                  {item.created_by?.name &&
                    (item.type === "요청" && item.requested_to?.name
                      ? `${item.created_by.name} → ${item.requested_to.name}`
                      : item.created_by.name)}
                </Text>
              </Flex>
            </Box>
          ))}
        </Flex>

        {/* 하단 버튼 */}
        <Flex justify="end" mt="4">
          {isAdmin && caseStatus !== "completed" ? (
            <Button size="2" color="red" onClick={handleCaseCompletion}>
              사건 종결
            </Button>
          ) : (
            <Button size="2" onClick={onClose}>
              확인
            </Button>
          )}
        </Flex>
      </Flex>
    </Box>
  );
};

export default CaseTimeline;
