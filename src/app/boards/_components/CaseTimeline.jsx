import React, { useState, useEffect } from "react";
import { Box, Flex, Text, Badge, Button, Dialog } from "@radix-ui/themes";
import { PlusIcon } from "@radix-ui/react-icons";
import { supabase } from "@/utils/supabase";
import TimelineForm from "./TimeLineForm";

const CaseTimeline = ({ caseId }) => {
  const [timelineItems, setTimelineItems] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchTimelineItems();
    fetchCurrentUser();
  }, [caseId]);

  const fetchCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (!error && data) {
        setCurrentUser({ ...user, role: data.role });
      }
    }
  };

  const fetchTimelineItems = async () => {
    const { data, error } = await supabase
      .from("case_timelines")
      .select(
        `
          *,
          manager:profiles!case_timelines_manager_fkey(name),
          handler:profiles!case_timelines_handler_fkey(name)
        `,
      )
      .eq("case_id", caseId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching timeline items:", error);
    } else {
      setTimelineItems(data);
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

  return (
    <Box>
      <Flex justify="between" align="center" mb="4">
        <Text size="5" weight="bold">
          사건 타임라인
        </Text>
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
            />
          </Dialog.Content>
        </Dialog.Root>
      </Flex>
      <Flex direction="column" gap="3">
        {timelineItems.map((item) => (
          <Box
            key={item.id}
            style={{
              borderLeft: "2px solid var(--gray-6)",
              paddingLeft: "1rem",
              position: "relative",
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
                top: "6px",
              }}
            />
            <Flex justify="between" align="center">
              <Flex align="center" gap="2">
                <Text size="2" color="gray">
                  {new Date(item.created_at).toLocaleString()}
                </Text>
                <Badge>{item.type}</Badge>
              </Flex>
              {isAdmin && (
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
            <Text size="3" mt="1">
              {item.description}
            </Text>
            <Text size="2" color="gray" mt="1">
              담당자: {item.manager?.name || "없음"}
              {item.handler && ` | 처리자: ${item.handler.name}`}
            </Text>
          </Box>
        ))}
      </Flex>
    </Box>
  );
};

export default CaseTimeline;
