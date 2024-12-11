import React, { useState, useEffect } from "react";
import { Box, Flex, Text, Button, Dialog, Badge } from "@radix-ui/themes";
import { supabase } from "@/utils/supabase";
import {
  PlusIcon,
  FileIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  Cross2Icon,
} from "@radix-ui/react-icons";
import DeadlineForm from "./DeadlineForm";
import { useUser } from "@/hooks/useUser";
import TimelineForm from "./TimeLineForm";
import DialogContent from "@/app/todos/DialogContent";
import FileUploadDropZone from "@/components/FileUploadDropZone";

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

const CaseTimeline = ({ caseId, caseStatus, description, onClose }) => {
  const [timelineItems, setTimelineItems] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [editingDeadline, setEditingDeadline] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeadlineDialogOpen, setIsDeadlineDialogOpen] = useState(false);
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [fileLists, setFileLists] = useState({});
  const [uploadingFiles, setUploadingFiles] = useState({});
  const [expandedFileSections, setExpandedFileSections] = useState({});
  const { user } = useUser();

  const isAdmin = user?.role === "admin" || user?.role === "staff";

  const handleFormSuccess = () => {
    fetchTimelineItems();
    setIsDialogOpen(false);
    setEditingItem(null);
  };

  const handleSuccess = (message) => {
    fetchDeadlines();
    alert(message);
    setIsDeadlineDialogOpen(false);
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

  useEffect(() => {
    fetchDeadlines();
    fetchTimelineItems();
  }, [caseId]);

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
        for (const item of data) {
          fetchFilesForTimeline(item.id);
        }
      }
    } catch (error) {
      console.error("Error fetching timeline items:", error);
    }
  };

  const handleEditDeadline = (deadline) => {
    setEditingDeadline({
      ...deadline,
      start: new Date(deadline.deadline_date),
      title: deadline.type,
    });
    setIsDeadlineDialogOpen(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleDeleteDeadline = async (deadlineId) => {
    if (window.confirm("정말로 이 기일을 삭제하시겠습니까?")) {
      try {
        const { error } = await supabase
          .from("case_deadlines")
          .delete()
          .eq("id", deadlineId);

        if (error) throw error;

        alert("기일이 성공적으로 삭제되었습니다.");
        fetchDeadlines();
      } catch (error) {
        console.error("Error deleting deadline:", error);
        alert("기일 삭제 중 오류가 발생했습니다.");
      }
    }
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

  const handleFileUpload = async (timelineId, file) => {
    if (!file) return;
    setUploadingFiles((prev) => ({ ...prev, [timelineId]: true }));

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://211.44.133.202:3001/upload", {
        method: "POST",
        body: formData,
        headers: { "timeline-id": timelineId },
      });

      if (!response.ok) {
        throw new Error("File upload failed");
      }

      alert("파일이 성공적으로 업로드되었습니다.");
      fetchFilesForTimeline(timelineId);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("파일 업로드 중 오류가 발생했습니다.");
    } finally {
      setUploadingFiles((prev) => ({ ...prev, [timelineId]: false }));
    }
  };

  const handleFileDelete = async (fileId, timelineId) => {
    if (window.confirm("정말로 이 파일을 삭제하시겠습니까?")) {
      try {
        const { error } = await supabase
          .from("files")
          .delete()
          .eq("id", fileId);

        if (error) throw error;

        alert("파일이 성공적으로 삭제되었습니다.");
        fetchFilesForTimeline(timelineId);
      } catch (error) {
        console.error("Error deleting file:", error);
        alert("파일 삭제 중 오류가 발생했습니다.");
      }
    }
  };

  const toggleFileSection = (itemId) => {
    setExpandedFileSections((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const handleCaseCompletion = async () => {
    if (window.confirm("정말로 이 사건을 완료하시겠습니까?")) {
      try {
        const { error } = await supabase
          .from("cases")
          .update({ status: "closed" })
          .eq("id", caseId);
        if (error) throw error;
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
        <Text style={{ color: "var(--gray-9)", fontSize: "0.9rem" }}>
          {description}
        </Text>

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
              <Flex direction="row" align="center" gap="3">
                <Text size="3" weight="bold">
                  {deadline.type}
                </Text>
                <Text size="2" weight="gray">
                  {deadline.location}
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
              <Flex gap="2">
                <Button
                  size="1"
                  onClick={() => handleEditDeadline(deadline)}
                  variant="soft"
                  style={{ display: "flex", alignItems: "center" }}
                >
                  수정
                </Button>
                <Button
                  size="1"
                  variant="soft"
                  color="red"
                  onClick={() => handleDeleteDeadline(deadline.id)}
                  style={{ display: "flex", alignItems: "center" }}
                >
                  삭제
                </Button>
              </Flex>
            </Flex>
          ))}
        </Flex>
        {deadlines.length > 0 && (
          <Box className="ml-auto" mb="4">
            {caseStatus !== "closed" && (
              <Dialog.Root
                open={isDeadlineDialogOpen}
                onOpenChange={setIsDeadlineDialogOpen}
              >
                <Dialog.Trigger asChild>
                  <Button size="2" onClick={() => setEditingDeadline(null)}>
                    <PlusIcon /> 기일 추가
                  </Button>
                </Dialog.Trigger>
                <Dialog.Content style={{ overflow: "visible" }}>
                  <Dialog.Title>
                    {editingDeadline ? "기일 수정" : "새 기일 추가"}
                  </Dialog.Title>
                  <DeadlineForm
                    caseId={caseId}
                    onSuccess={handleSuccess}
                    editingDeadline={editingDeadline}
                    onClose={() => setIsDeadlineDialogOpen(false)}
                  />
                </Dialog.Content>
              </Dialog.Root>
            )}
          </Box>
        )}

        <Flex justify="between" align="center">
          <Text size="5" weight="bold">
            사건 타임라인
          </Text>
        </Flex>
        {/* 타임라인 리스트 */}
        <Flex direction="column" gap="3">
          {timelineItems.map((item) => {
            const fileCount = fileLists[item.id]?.length || 0;
            const isFileSectionOpen = expandedFileSections[item.id] || false;

            return (
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
                            <Button
                              size="1"
                              variant="ghost"
                              color="red"
                              onClick={() => handleFileDelete(file.id, item.id)}
                            >
                              <Cross2Icon />
                            </Button>
                          </Flex>
                        ))
                      ) : (
                        <Text size="2" color="gray">
                          첨부된 파일이 없습니다.
                        </Text>
                      )}
                    </Flex>

                    {/* 업로드 섹션 */}
                    <Box mt="4">
                      <Text size="2" weight="bold" mb="2">
                        파일 업로드
                      </Text>
                      <FileUploadDropZone
                        timelineId={item.id}
                        onFileUpload={handleFileUpload}
                      />
                      <Flex direction="column" gap="2">
                        {uploadingFiles[item.id] && (
                          <Text size="2" color="gray">
                            업로드 중...
                          </Text>
                        )}
                      </Flex>
                    </Box>
                  </Box>
                )}
              </Box>
            );
          })}
        </Flex>
        <Flex justify="between" mt="4">
          {isAdmin && caseStatus !== "closed" && (
            <Button size="2" color="red" onClick={handleCaseCompletion}>
              사건 종결
            </Button>
          )}
          {caseStatus !== "closed" && (
            <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <Dialog.Trigger>
                <Button size="2" onClick={() => setEditingItem(null)}>
                  <PlusIcon /> 타임라인 추가
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
