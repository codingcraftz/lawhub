import React, { useEffect, useState } from "react";
import { Box, Button, Flex, Text } from "@radix-ui/themes";

import { Cross2Icon } from "@radix-ui/react-icons";
import FileUploadDropZone from "@/components/FileUploadDropZone";

const FileList = ({ timelineId, files, isAdmin }) => {
  const [uploadingFiles, setUploadingFiles] = useState({});
  const handleFileDelete = async (fileId, timelineId) => {
    if (window.confirm("정말로 이 파일을 삭제하시겠습니까?")) {
      try {
        const { error } = await supabase
          .from("files")
          .delete()
          .eq("id", fileId);

        if (error) throw error;

        alert("파일이 성공적으로 삭제되었습니다.");
      } catch (error) {
        console.error("Error deleting file:", error);
        alert("파일 삭제 중 오류가 발생했습니다.");
      }
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

  return (
    <Box>
      <Text>첨부 파일 목록</Text>
      <Flex direction="column" gap="2">
        {files?.length > 0 ? (
          files?.map((file) => (
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
          <Text>첨부된 파일이 없습니다.</Text>
        )}
      </Flex>
      {/* 업로드 섹션 */}
      {isAdmin && (
        <Box mt="4">
          <Text size="2" weight="bold" mb="2">
            파일 업로드
          </Text>
          <FileUploadDropZone
            timelineId={timelineId}
            onFileUpload={handleFileUpload}
          />
          <Flex direction="column" gap="2">
            {uploadingFiles[timelineId] && (
              <Text size="2" color="gray">
                업로드 중...
              </Text>
            )}
          </Flex>
        </Box>
      )}
    </Box>
  );
};

export default FileList;
