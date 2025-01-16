"use client";

import React, { useState, useEffect } from "react";
import { Button, Flex, Text, Box } from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";
import { motion, AnimatePresence } from "framer-motion";
import FileUploadDropZone from "@/components/FileUploadDropZone";

const checkAdmin = (user) => {
	return user?.role === "staff" || user?.role === "admin";
};

export default function FileList({ assignmentId, user }) {
	const [files, setFiles] = useState([]);
	const [isExpanded, setIsExpanded] = useState(false);
	const [uploading, setUploading] = useState(false);

	const isAdmin = checkAdmin(user);

	// 파일 목록 가져오기
	const fetchFiles = async () => {
		if (!assignmentId) return;
		try {
			const res = await fetch(`http://211.44.133.202:3001/files/${assignmentId}`);
			if (!res.ok) throw new Error("Failed to fetch files");
			const data = await res.json();
			setFiles(data);
		} catch (error) {
			console.error("Error fetching files:", error);
			// 여기서 Error: Failed to fetch → 서버가 안 켜져 있으면 ERR_CONNECTION_REFUSED
		}
	};

	useEffect(() => {
		fetchFiles();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [assignmentId]);

	// 여러 파일 업로드
	const handleFileUpload = async (assignmentId, fileArray) => {
		if (!fileArray || fileArray.length === 0) return;
		setUploading(true);
		try {
			const formData = new FormData();
			fileArray.forEach((file) => {
				formData.append("files", file);
			});
			// 업로더 이름 (한글 가능) → Body(FormData)로 전송
			formData.append("uploadedBy", user?.name || "Unknown");

			// assignmentId를 헤더로
			const response = await fetch("http://211.44.133.202:3001/upload", {
				method: "POST",
				body: formData,
				headers: {
					"assignment-id": assignmentId,
				},
			});
			if (!response.ok) {
				throw new Error("File upload failed");
			}
			alert("파일 업로드 성공");
			fetchFiles();
		} catch (err) {
			console.error("Error uploading file:", err);
			alert("파일 업로드 중 오류가 발생했습니다.");
		} finally {
			setUploading(false);
		}
	};

	// 파일 삭제
	const handleFileDelete = async (fileId) => {
		if (!window.confirm("정말로 이 파일을 삭제하시겠습니까?")) return;
		try {
			const response = await fetch(`http://211.44.133.202:3001/files/${fileId}`, {
				method: "DELETE",
			});
			if (!response.ok) throw new Error("File delete failed");
			alert("파일이 삭제되었습니다.");
			fetchFiles();
		} catch (err) {
			console.error("Error deleting file:", err);
			alert("파일 삭제 중 오류가 발생했습니다.");
		}
	};

	// 최근 3개만 표시
	const visibleFiles = isExpanded ? files : files.slice(0, 3);

	return (
		<section className="mb-6 p-4 rounded shadow-md shadow-gray-7 bg-gray-2 text-gray-12">
			<Flex align="center" className="mb-3">
				<Text className="text-lg font-semibold">
					첨부 파일 <span className="text-md text-gray-10">({files.length}개)</span>
				</Text>
			</Flex>

			{/* 파일 목록 */}
			{files.length === 0 ? (
				<Text>등록된 파일이 없습니다.</Text>
			) : (
				<AnimatePresence initial={false}>
					<motion.ul layout className="flex flex-col gap-2">
						{visibleFiles.map((file) => {
							const uploadedDate = new Date(file.uploaded_at).toLocaleString(
								"ko-KR",
								{
									year: "numeric",
									month: "2-digit",
									day: "2-digit",
									hour: "2-digit",
									minute: "2-digit",
								}
							);
							return (
								<motion.li
									key={file.id}
									layout
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: "auto" }}
									exit={{ opacity: 0, height: 0 }}
									className="p-2 bg-gray-3 border border-gray-6 rounded flex justify-between items-center"
								>
									<div className="flex flex-col" style={{ gap: "4px" }}>
										<a
											className="text-blue-9"
											href={`http://211.44.133.202:3001/download/${file.id}`}
											target="_blank"
											rel="noopener noreferrer"
										>
											{file.original_name}
										</a>
										<Text size="1" color="gray">
											{/* 업로더 이름 + 업로드 날짜 */}
											{file.uploaded_by
												? `${file.uploaded_by}`
												: `업로더 정보 없음`}
											{" / "}
											{uploadedDate}
										</Text>
									</div>

									{/* 삭제 버튼 (관리자만) */}
									{isAdmin && (
										<Button
											size="1"
											variant="soft"
											color="red"
											onClick={() => handleFileDelete(file.id)}
										>
											<Cross2Icon />
										</Button>
									)}
								</motion.li>
							);
						})}
					</motion.ul>
				</AnimatePresence>
			)}

			{/* 더보기 / 접기 버튼 */}
			{files.length > 3 && (
				<Button
					variant="ghost"
					className="mt-2 w-full"
					onClick={() => setIsExpanded(!isExpanded)}
				>
					{isExpanded ? "접기" : "더보기"}
				</Button>
			)}

			{/* 파일 업로드 섹션 (관리자만) */}
			{isAdmin && (
				<Box mt="4">
					<Text size="2" weight="bold" mb="2">
						파일 업로드
					</Text>
					<FileUploadDropZone
						databaseId={assignmentId}
						onFileUpload={handleFileUpload}
					/>
					{uploading && (
						<Text size="2" color="gray" mt="2">
							업로드 중...
						</Text>
					)}
				</Box>
			)}
		</section>
	);
}

