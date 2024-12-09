"use client";

import React, { useState, useEffect } from "react";

export default function TimelineFiles() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const timelineId = "123";

  const fetchFiles = async () => {
    try {
      const response = await fetch(
        `http://211.44.133.202:3001/files/${timelineId}`,
      );
      const data = await response.json();
      setFiles(data);
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("Please select a file to upload");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setUploading(true);

    try {
      const response = await fetch("http://211.44.133.202:3001/upload", {
        method: "POST",
        body: formData,
        headers: {
          "timeline-id": timelineId,
        },
      });

      if (!response.ok) {
        alert("Failed to upload file.");
        return;
      }

      alert("File uploaded successfully");
      fetchFiles();
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleFileDelete = async (fileId) => {
    try {
      const response = await fetch(
        `http://211.44.133.202:3001/files/${fileId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        alert("Failed to delete file.");
        return;
      }

      alert("File deleted successfully.");
      fetchFiles();
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Timeline Files</h1>

      <form onSubmit={handleFileUpload}>
        <input
          type="file"
          onChange={(e) => setSelectedFile(e.target.files[0])}
          disabled={uploading}
        />
        <button type="submit" disabled={uploading}>
          {uploading ? "Uploading..." : "Upload File"}
        </button>
      </form>

      <ul>
        {files.map((file) => (
          <li key={file.id}>
            <a
              href={`http://211.44.133.202:3001/${file.filePath}`}
              target="_blank"
            >
              {file.original_name}
            </a>
            <button onClick={() => handleFileDelete(file.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
