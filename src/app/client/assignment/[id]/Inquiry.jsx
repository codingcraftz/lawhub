"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Button, Flex, Text, Box, TextArea } from "@radix-ui/themes";
import { motion } from "framer-motion";

const Inquiry = ({ assignmentId, user }) => {
	const [inquiries, setInquiries] = useState([]);
	const [newInquiry, setNewInquiry] = useState("");
	const [isExpanded, setIsExpanded] = useState(false);
	const [editingInquiryId, setEditingInquiryId] = useState(null);
	const [editingContent, setEditingContent] = useState("");
	const [isFormVisible, setIsFormVisible] = useState(false);
	const [loading, setLoading] = useState(false);
	const isAdmin = user?.role === "staff" || user?.role === "admin";

	const fetchInquiries = async () => {
		setLoading(true);
		const { data, error } = await supabase
			.from("assignment_inquiries")
			.select("*, user:users(name)")
			.eq("assignment_id", assignmentId)
			.order("created_at", { ascending: true });

		if (error) {
			console.error("Failed to fetch inquiries:", error);
		} else {
			setInquiries(data);
		}
		setLoading(false);
	};

	useEffect(() => {
		fetchInquiries();
	}, [assignmentId]);

	const handleAddInquiry = async () => {
		if (!newInquiry.trim()) return alert("문의 내용을 입력해주세요.");

		const { error } = await supabase.from("assignment_inquiries").insert({
			assignment_id: assignmentId,
			inquiry: newInquiry,
			user_id: user?.id,
		});

		if (error) {
			console.error("Error adding inquiry:", error);
			alert("문의 등록 중 오류가 발생했습니다.");
		} else {
			setNewInquiry("");
			setIsFormVisible(false);
			fetchInquiries();
		}
	};

	const handleEditInquiry = async () => {
		if (!editingContent.trim()) return alert("수정할 내용을 입력해주세요.");

		const { error } = await supabase
			.from("assignment_inquiries")
			.update({ inquiry: editingContent })
			.eq("id", editingInquiryId);

		if (error) {
			console.error("Error editing inquiry:", error);
			alert("문의 수정 중 오류가 발생했습니다.");
		} else {
			setEditingInquiryId(null);
			setEditingContent("");
			fetchInquiries();
		}
	};

	const handleDeleteInquiry = async (id) => {
		if (!window.confirm("정말 삭제하시겠습니까?")) return;

		const { error } = await supabase
			.from("assignment_inquiries")
			.delete()
			.eq("id", id);

		if (error) {
			console.error("Error deleting inquiry:", error);
			alert("문의 삭제 중 오류가 발생했습니다.");
		} else {
			fetchInquiries();
		}
	};

	const toggleExpand = () => {
		setIsExpanded(!isExpanded);
	};

	const renderInquiries = () => {
		if (inquiries.length === 0) return null;

		const inquiriesToShow = isExpanded
			? inquiries
			: [inquiries[inquiries.length - 1]];

		return inquiriesToShow.map((inquiry) => (
			<Box
				key={inquiry.id}
				className="p-3 bg-gray-3 border border-gray-6 rounded shadow-sm space-y-2 mb-4"
			>
				<Flex justify="between" align="center">
					<Text size="2" weight="bold">
						{inquiry.user?.name}
					</Text>
					<Text size="1" color="gray">
						{new Date(inquiry.created_at).toLocaleString("ko-KR")}
					</Text>
				</Flex>

				{editingInquiryId === inquiry.id ? (
					<>
						<TextArea
							value={editingContent}
							onChange={(e) => setEditingContent(e.target.value)}
							className="border border-gray-6 p-2 rounded w-full"
						/>
						<Flex justify="end" gap="2">
							<Button
								variant="soft"
								onClick={() => setEditingInquiryId(null)}
							>
								닫기
							</Button>
							<Button onClick={handleEditInquiry}>저장</Button>
						</Flex>
					</>
				) : (
					<Text>{inquiry.inquiry}</Text>
				)}

				{inquiry.user_id === user?.id && (
					<Flex gap="2" className="justify-end">
						<Button
							variant="ghost"
							size="1"
							onClick={() => {
								setEditingInquiryId(inquiry.id);
								setEditingContent(inquiry.inquiry);
							}}
						>
							수정
						</Button>
						<Button variant="ghost" size="1" onClick={() => handleDeleteInquiry(inquiry.id)}>
							삭제
						</Button>
					</Flex>
				)}
			</Box>
		));
	};

	return (
		<section className="mb-6 p-4 rounded shadow-md shadow-gray-7 bg-gray-2 text-gray-12">
			<Flex justify="between" align="center" className="mb-4">
				<Text as="h2" className="font-semibold text-lg">
					문의 사항
				</Text>
				<Button color={isFormVisible && "gray"} onClick={() => setIsFormVisible(!isFormVisible)}>
					{isFormVisible ? "닫기" : "등록"}
				</Button>
			</Flex>

			{isFormVisible && (
				<motion.div
					initial={{ height: 0, opacity: 0 }}
					animate={{ height: "auto", opacity: 1 }}
					transition={{ duration: 0.3 }}
					className="mb-4"
				>
					<TextArea
						placeholder="문의 내용을 입력하세요"
						value={newInquiry}
						onChange={(e) => setNewInquiry(e.target.value)}
						className="mb-2 border border-gray-6 rounded p-2 w-full"
					/>
					<Flex justify="end">
						<Button onClick={handleAddInquiry}>등록</Button>
					</Flex>
				</motion.div>
			)}

			{loading ? (
				<Text>로딩 중...</Text>
			) : inquiries.length === 0 ? (
				<Text>등록된 문의 사항이 없습니다.</Text>
			) : (
				<>
					{renderInquiries()}
					{inquiries.length > 1 && (
						<Button className="ml-auto w-full" variant="ghost" onClick={toggleExpand}>
							{isExpanded ? "접기" : "더 보기"}
						</Button>
					)}
				</>
			)}
		</section>
	);
};

export default Inquiry;

