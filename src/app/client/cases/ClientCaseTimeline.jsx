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
import {
  ChevronDownIcon,
  ChevronUpIcon,
  Cross2Icon,
  FileIcon,
} from "@radix-ui/react-icons";

const ClientCaseTimeline = ({ caseId, description, onClose }) => {
  const [timelineItems, setTimelineItems] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [fileLists, setFileLists] = useState({});
  const [expandedFileSections, setExpandedFileSections] = useState({});

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
      for (const item of data) {
        fetchFilesForTimeline(item.id);
      }
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

  const toggleFileSection = (itemId) => {
    setExpandedFileSections((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const fetchFilesForTimeline = async (timelineId) => {
    try {
      const { data, error } = await supabase
        .from("files")
        .select("*")
        .eq("entity", "timeline")
        .eq("entity_id", timelineId);

      if (error) {
        console.error("Error fetching files:", error);
      } else {
        setFileLists((prev) => ({ ...prev, [timelineId]: data }));
      }
    } catch (error) {
      console.error("Error fetching files:", error);
    }
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
      <Box className="flex flex-col gap-10">
        {deadlines.length > 0 && (
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
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                </Text>
              </Flex>
            ))}
          </Flex>
        )}

        <Flex direction="column" gap="4">
          <Text size="5" weight="bold">
            사건 타임라인
          </Text>
          <Flex direction="column" gap="3">
            {timelineItems.length > 0 ? (
              timelineItems.map((item) => {
                const fileCount = fileLists[item.id]?.length || 0;
                const isFileSectionOpen =
                  expandedFileSections[item.id] || false;

                return (
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
                    {/* 파일 섹션 토글링 버튼 */}
                    <Box mt="2">
                      <Button
                        size="1"
                        variant="ghost"
                        onClick={() => toggleFileSection(item.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <FileIcon />
                        첨부파일 ({fileCount}개)
                        {isFileSectionOpen ? (
                          <ChevronUpIcon />
                        ) : (
                          <ChevronDownIcon />
                        )}
                      </Button>
                    </Box>

                    {isFileSectionOpen && (
                      <Box
                        mt="2"
                        style={{
                          backgroundColor: "var(--gray-1)",
                          border: "1px solid var(--gray-6)",
                          borderRadius: "4px",
                          padding: "1rem",
                        }}
                      >
                        <Text size="2" weight="bold" mb="2">
                          첨부 파일 목록
                        </Text>
                        <Flex direction="column" gap="2">
                          {fileLists[item.id]?.length > 0 ? (
                            fileLists[item.id].map((file) => (
                              <Flex
                                key={file.id}
                                justify="between"
                                align="center"
                                style={{
                                  backgroundColor: "var(--gray-2)",
                                  borderRadius: "4px",
                                  padding: "0.5rem",
                                  border: "1px solid var(--gray-3)",
                                }}
                              >
                                <a
                                  className="text-sm"
                                  href={`http://211.44.133.202:3001/download/${file.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: "var(--blue-9)" }}
                                >
                                  {file.original_name}
                                </a>
                              </Flex>
                            ))
                          ) : (
                            <Text size="2" color="gray">
                              첨부된 파일이 없습니다.
                            </Text>
                          )}
                        </Flex>
                      </Box>
                    )}
                  </Box>
                );
              })
            ) : (
              <Text>등록된 기록이 없습니다.</Text>
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
    </>
  );
};

export default ClientCaseTimeline;
