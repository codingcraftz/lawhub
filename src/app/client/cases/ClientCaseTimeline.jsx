// src/app/client/cases/ClientCaseTimeline.jsx

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

import React, { useState, useEffect } from "react";
import { Box, Flex, Text, Badge, Button, Dialog } from "@radix-ui/themes";
import { supabase } from "@/utils/supabase";
import DialogContent from "@/app/todos/DialogContent";
import { useUser } from "@/hooks/useUser";

const ClientCaseTimeline = ({ caseId, description, onClose }) => {
  const [timelineItems, setTimelineItems] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const { user } = useUser();

  useEffect(() => {
    fetchTimelineItems();
    fetchDeadlines();
  }, [caseId]);

  const fetchTimelineItems = async () => {
    const { data, error } = await supabase
      .from("case_timelines")
      .select(
        `
        *,
        created_by:users!case_timelines_created_by_fkey(id, name),
        requested_to:users!case_timelines_requested_to_fkey(id, name)
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

  return (
    <>
      <Text
        style={{
          color: "var(--gray-9)",
          fontSize: "0.9rem",
          display: "inline-block",
          paddingBottom: "1rem",
        }}
      >
        {description}
      </Text>
      <Box>
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
                  <Text size="2" color="gray">
                    {new Date(deadline.deadline_date).toLocaleDateString(
                      "ko-KR",
                      {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      },
                    )}
                  </Text>
                </Flex>
              ))}
            </Flex>
          </Box>
        )}

        <Flex direction="column" gap="4">
          <Text size="5" weight="bold">
            사건 타임라인
          </Text>
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
                </Flex>
                <Flex className="justify-between">
                  <Text size="3" mt="1">
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
                      (item.type === "요청" && item.requested_to?.name
                        ? `${item.created_by.name} → ${item.requested_to.name}`
                        : item.created_by.name)}
                  </Text>
                </Flex>
              </Box>
            ))}
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
    </>
  );
};

export default ClientCaseTimeline;
