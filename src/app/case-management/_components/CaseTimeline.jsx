import React, { useState, useEffect } from "react";
import { Box, Flex, Text, Badge, Button, Dialog } from "@radix-ui/themes";
import { PlusIcon } from "@radix-ui/react-icons";
import { supabase } from "@/utils/supabase";
import TimelineForm from "./TimeLineForm";
import DeadlineForm from "./DeadlineForm";
import { useUser } from "@/hooks/useUser";
import DialogContent from "@/app/todos/DialogContent";

const getTypeColor = (type) => {
  switch (type) {
    case "요청":
      return "bg-yellow-200 text-yellow-900";
    case "요청완료":
      return "bg-blue-200 text-blue-900";
    case "완료":
      return "bg-gray-200 text-gray-900";
    case "상담":
      return "bg-purple-200 text-purple-900";
    case "접수":
      return "bg-green-200 text-green-900";
    default:
      return "bg-gray-200 text-gray-900";
  }
};

const CaseTimeline = ({ caseId, caseStatus, onClose }) => {
  const [timelineItems, setTimelineItems] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [editingDeadline, setEditingDeadline] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeadlineDialogOpen, setIsDeadlineDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const { user } = useUser();

  useEffect(() => {
    fetchTimelineItems();
    fetchDeadlines();
  }, [caseId]);

  const openCommentDialog = async (item) => {
    try {
      const { data: requestData, error } = await supabase
        .from("requests")
        .select(
          `
        *,
        requester:users(id, name),
        receiver:users(id, name),
        case_timelines(id, description, type, case:cases(title))
      `,
        )
        .eq("case_timeline_id", item.id)
        .single();

      if (error || !requestData) {
        console.error("Error fetching request:", error);
        alert("요청 정보를 불러오는 중 오류가 발생했습니다.");
        return;
      }

      setSelectedRequest(requestData);
      setIsCommentDialogOpen(true);
    } catch (error) {
      console.error("Error fetching request:", error);
      alert("요청 정보를 불러오는 중 오류가 발생했습니다.");
    }
  };

  const closeCommentDialog = () => {
    setSelectedRequest(null);
    setIsCommentDialogOpen(false);
  };

  const handleEditDeadline = (deadline) => {
    setEditingDeadline(deadline);
    setIsDeadlineDialogOpen(true);
  };

  const handleDeleteDeadline = async (id) => {
    if (window.confirm("정말로 이 기일을 삭제하시겠습니까?")) {
      try {
        const { error } = await supabase
          .from("case_deadlines")
          .delete()
          .eq("id", id);
        if (error) throw error;
        fetchDeadlines();
      } catch (error) {
        console.error("기일 삭제 중 오류:", error);
        alert("기일 삭제 중 오류가 발생했습니다.");
      }
    }
  };

  const fetchTimelineItems = async () => {
    try {
      const { data, error } = await supabase
        .from("case_timelines")
        .select("*, created_by(id, name), requested_to(id, name)")
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

  const fetchDeadlines = async () => {
    try {
      const { data, error } = await supabase
        .from("case_deadlines")
        .select("*")
        .eq("case_id", caseId)
        .order("deadline_date", { ascending: true });

      if (error) {
        console.error("Error fetching deadlines:", error);
      } else {
        setDeadlines(data);
      }
    } catch (error) {
      console.error("Error fetching deadlines:", error);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id, type) => {
    if (window.confirm("정말로 이 항목을 삭제하시겠습니까?")) {
      try {
        if (type === "요청" || type === "요청완료") {
          // requests와 request_comments 삭제
          const { data: requestData, error: requestError } = await supabase
            .from("requests")
            .select("id")
            .eq("case_timeline_id", id);

          if (requestError) throw requestError;

          if (requestData && requestData.length > 0) {
            const requestIds = requestData.map((request) => request.id);

            // request_comments 삭제
            const { error: commentError } = await supabase
              .from("request_comments")
              .delete()
              .in("request_id", requestIds);

            if (commentError) throw commentError;

            // requests 삭제
            const { error: deleteRequestError } = await supabase
              .from("requests")
              .delete()
              .eq("case_timeline_id", id);

            if (deleteRequestError) throw deleteRequestError;
          }
        }

        // case_timelines에서 항목 삭제
        const { error: timelineError } = await supabase
          .from("case_timelines")
          .delete()
          .eq("id", id);

        if (timelineError) throw timelineError;

        fetchTimelineItems(); // 타임라인 업데이트
      } catch (error) {
        console.error("타임라인 항목 삭제 중 오류:", error);
        alert("타임라인 항목 삭제 중 오류가 발생했습니다.");
      }
    }
  };

  const handleDeadlineFormSuccess = () => {
    fetchDeadlines();
    setIsDeadlineDialogOpen(false);
    setEditingDeadline(null);
  };

  const handleFormSuccess = () => {
    fetchTimelineItems();
    setIsDialogOpen(false);
    setEditingItem(null);
  };

  const isAdmin = user?.role === "admin";

  const handleCaseCompletion = async () => {
    if (window.confirm("정말로 이 사건을 완료하시겠습니까?")) {
      try {
        const { error } = await supabase
          .from("cases")
          .update({ status: "closed" })
          .eq("id", caseId);
        if (error) throw error;
        onClose();
        window.location.reload();
      } catch (error) {
        console.error("Error completing case:", error);
        alert("사건 완료 중 오류가 발생했습니다.");
      }
    }
  };

  return (
    <Box>
      <Flex direction="column" gap="4">
        {deadlines.length > 0 && (
          <Box mb="4">
            <Flex direction="column" gap="2">
              {deadlines.map((deadline) => (
                <Flex
                  key={deadline.id}
                  justify="between"
                  align="center"
                  className="p-2 border rounded-md"
                  style={{
                    backgroundColor: "var(--gray-2)",
                    border: "1px solid var(--gray-6)",
                  }}
                >
                  <Text size="3" weight="bold">
                    {deadline.type}
                  </Text>
                  <Flex gap="3">
                    <Text size="2" color="gray">
                      {new Date(deadline.deadline_date).toLocaleDateString(
                        "ko-KR",
                        {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        },
                      )}
                    </Text>
                    {isAdmin && caseStatus !== "closed" && (
                      <Flex gap="2">
                        <Button
                          size="1"
                          variant="soft"
                          onClick={() => handleEditDeadline(deadline)}
                        >
                          수정
                        </Button>
                        <Button
                          size="1"
                          variant="soft"
                          color="red"
                          onClick={() => handleDeleteDeadline(deadline.id)}
                        >
                          삭제
                        </Button>
                      </Flex>
                    )}
                  </Flex>
                </Flex>
              ))}
            </Flex>
          </Box>
        )}

        <Flex justify="between" align="center">
          <Text size="5" weight="bold">
            사건 타임라인
          </Text>

          {caseStatus !== "closed" && (
            <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <Dialog.Trigger>
                <Button size="2" onClick={() => setEditingItem(null)}>
                  <PlusIcon /> 새 항목 추가
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

        {/* 타임라인 리스트 */}
        <Flex direction="column" gap="3">
          {timelineItems.map((item) => (
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
                  {item.type === "요청" ? (
                    <Flex>
                      <Badge className={getTypeColor(item.type)}>
                        요청(진행중)
                      </Badge>
                    </Flex>
                  ) : item.type === "요청완료" ? (
                    <Flex>
                      <Badge className={getTypeColor(item.type)}>
                        요청(완료)
                      </Badge>
                    </Flex>
                  ) : (
                    <Badge className={getTypeColor(item.type)}>
                      {item.type}
                    </Badge>
                  )}
                  {(item.type === "요청" || item.type === "요청완료") && (
                    <Button
                      size="1"
                      variant="ghost"
                      onClick={() => openCommentDialog(item)}
                    >
                      요청 상세 보기
                    </Button>
                  )}
                </Flex>
                {isAdmin && caseStatus !== "closed" && (
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
              <Flex
                className="justify-between"
                style={{ flexWrap: "nowrap", gap: "8px" }}
              >
                <Text
                  size="3"
                  mt="1"
                  style={{ flexGrow: 1, overflow: "hidden" }}
                >
                  {item.description}
                </Text>
                <Text
                  size="2"
                  color="gray"
                  mt="1"
                  style={{
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                    marginLeft: "8px",
                  }}
                >
                  {item.created_by?.name &&
                    ((item.type === "요청" || item.type === "요청완료") &&
                    item.requested_to?.name
                      ? `${item.created_by.name} → ${item.requested_to.name}`
                      : item.created_by.name)}
                </Text>
              </Flex>
            </Box>
          ))}
        </Flex>
        <Flex justify="between" mt="4">
          {caseStatus !== "closed" && (
            <Dialog.Root
              open={isDeadlineDialogOpen}
              onOpenChange={setIsDeadlineDialogOpen}
            >
              <Dialog.Trigger>
                <Button size="2" onClick={() => setIsDeadlineDialogOpen(true)}>
                  <PlusIcon /> 기일 추가
                </Button>
              </Dialog.Trigger>
              <Dialog.Content
                style={{
                  overflow: "visible",
                  position: "relative",
                  zIndex: 1000,
                }}
              >
                <Dialog.Title>
                  {editingDeadline ? "기일 수정" : "새 기일 추가"}
                </Dialog.Title>
                <DeadlineForm
                  caseId={caseId}
                  onSuccess={handleDeadlineFormSuccess}
                  onClose={() => {
                    setIsDeadlineDialogOpen(false);
                    setEditingDeadline(null);
                  }}
                  editingDeadline={editingDeadline} // 수정할 데이터를 전달
                />
              </Dialog.Content>
            </Dialog.Root>
          )}

          {isAdmin && caseStatus !== "closed" ? (
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
      {isCommentDialogOpen && selectedRequest && (
        <Dialog.Root
          open={isCommentDialogOpen}
          onOpenChange={closeCommentDialog}
        >
          <DialogContent selectedRequest={selectedRequest} user={user} />
        </Dialog.Root>
      )}
    </Box>
  );
};

export default CaseTimeline;
