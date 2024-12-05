"use client";

import React, { useState, useEffect } from "react";

export default function Home() {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  console.log(files);

  // 파일 목록 가져오기
  useEffect(() => {
    fetch("/api/files")
      .then((res) => res.json())
      .then((data) => setFiles(data))
      .catch((err) => console.error(err));
  }, []);

  const handleFileUpload = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      alert("Please select a file to upload");
      return;
    }

    const formData = new FormData();
    const normalizedFileName = selectedFile.name.normalize("NFC");
    console.log(selectedFile);
    formData.append("file", selectedFile, normalizedFileName);

    try {
      const response = await fetch("http://211.44.133.202:3001/upload", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      alert(`File uploaded successfully: ${result.filePath}`);
    } catch (error) {
      console.error("Error during file upload:", error);
      alert("An error occurred while uploading the file.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>File Upload & Download</h1>
      {/* 파일 업로드 */}
      <form onSubmit={handleFileUpload}>
        <input
          type="file"
          onChange={(e) => setSelectedFile(e.target.files[0])}
        />
        <button type="submit">Upload File</button>
      </form>
      <h2>Uploaded Files</h2>
      <ul>
        {files.map((file, index) => (
          <li key={index}>
            <a href={file.url} download>
              {file.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
