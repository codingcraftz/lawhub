import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Box,
  Flex,
  Text,
  Button,
  Badge,
  ChevronDownIcon,
} from "@radix-ui/themes";
import { ChevronUpIcon, FileIcon, Pencil1Icon } from "@radix-ui/react-icons";
import FileList from "@/components/Timeline/FileList";
import { getTypeColor } from "@/utils/util";
import TimelineForm from "./TimelineForm";
import { fetchFiles } from "../../utils/api";

const TimelineItem = ({ item, isAdmin, onSuccess }) => {
  const [isFileListOpen, setIsFileListOpen] = useState(false);
  const [timelineOpenMap, setTimelineOpenMap] = useState({}); // 각 타임라인 항목의 열림 상태

  const [files, setFiles] = useState();
  const fileCount = files?.length || 0;

  // 첨부파일 로드
  useEffect(() => {
    const loadFiles = async () => {
      const data = await fetchFiles(item.id);
      setFiles(data);
    };
    loadFiles();
  }, [item.id]);

  // 모달 열기
  const openTimelineForm = () => {
    setTimelineOpenMap((prev) => ({ ...prev, [item.id]: true }));
  };

  // 모달 닫기
  const closeTimelineForm = () => {
    setTimelineOpenMap((prev) => ({ ...prev, [item.id]: false }));
  };

  return (
    <Box
      style={{
        borderLeft: "2px solid var(--gray-6)",
        paddingLeft: "1rem",
        position: "relative",
      }}
    >
      <Flex justify="between" align="center">
        <Flex align="center" gap="2">
          <Text>{new Date(item.created_at).toLocaleString("ko-KR")}</Text>
          <Badge className={getTypeColor(item.type)}>{item.type}</Badge>
          {isAdmin && (
            <Button
              size="1"
              variant="soft"
              onClick={openTimelineForm}
              style={{ display: "flex", alignItems: "center", gap: "4px" }}
            >
              <Pencil1Icon /> 수정
            </Button>
          )}
        </Flex>
        <Box mt="2">
          <Button
            size="1"
            variant="ghost"
            onClick={() => setIsFileListOpen(!isFileListOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <FileIcon />
            첨부파일 ({fileCount}개)
            {isFileListOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </Button>
        </Box>
      </Flex>
      <Text>{item.description}</Text>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{
          height: isFileListOpen ? "auto" : 0,
          opacity: isFileListOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <FileList files={files} timelineId={item.id} />
      </motion.div>
      {/* TimelineForm 모달 */}
      {timelineOpenMap[item.id] && (
        <TimelineForm
          open={timelineOpenMap[item.id]}
          onOpenChange={(opened) => {
            if (!opened) closeTimelineForm();
          }}
          caseId={item.case_id}
          editingItem={item}
          onSuccess={() => {
            closeTimelineForm();
            onSuccess();
          }}
        />
      )}
    </Box>
  );
};

export default TimelineItem;
