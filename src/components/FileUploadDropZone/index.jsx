import React, { useState } from "react";
import { Box } from "@radix-ui/themes";

const FileUploadDropZone = ({ timelineId, onFileUpload }) => {
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

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFileUpload(timelineId, files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      onFileUpload(timelineId, file);
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
        htmlFor={`file-upload-${timelineId}`}
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
          id={`file-upload-${timelineId}`}
          style={{ display: "none" }}
          onChange={handleFileSelect}
        />
      </label>
    </Box>
  );
};

export default FileUploadDropZone;
