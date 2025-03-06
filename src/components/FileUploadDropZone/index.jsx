"use client";
import React, { useState } from "react";
import { Box } from "@radix-ui/themes";

export default function FileUploadDropZone({ databaseId, onFileUpload }) {
  const [dragging, setDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      onFileUpload(databaseId, droppedFiles); // 여러 파일
    }
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      onFileUpload(databaseId, selectedFiles); // 여러 파일
    }
  };

  return (
    <Box
      className={`drop-zone ${dragging ? "dragging" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0.8rem",
        borderRadius: "4px",
        cursor: "pointer",
        backgroundColor: dragging ? "var(--gray-3)" : "var(--gray-2)",
        border: dragging
          ? "2px solid var(--blue-9)"
          : "2px dashed var(--gray-6)",
      }}
    >
      <label
        htmlFor={`file-upload-${databaseId}`}
        className="text-sm"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          cursor: "pointer",
        }}
      >
        파일을 드래그하거나 클릭하세요.
        <input
          type="file"
          id={`file-upload-${databaseId}`}
          multiple // 여러 파일
          style={{ display: "none" }}
          onChange={handleFileSelect}
        />
      </label>
    </Box>
  );
}
