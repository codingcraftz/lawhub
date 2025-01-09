"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { Button } from "@radix-ui/themes";
import CreditorForm from "../_components/dialogs/CreditorForm"; // 채권자 등록/수정 폼

const CreditorInfo = ({ assignmentId, user }) => {
	const [creditors, setCreditors] = useState([]);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [currentCreditor, setCurrentCreditor] = useState(null);

	const isAdmin = user?.role === "staff" || user?.role === "admin";

	// 1. Fetch creditors
	const fetchCreditors = async () => {
		const { data, error } = await supabase
			.from("assignment_creditors")
			.select("id, name, birth_date, phone_number, address")
			.eq("assignment_id", assignmentId);

		if (!error && data) {
			setCreditors(data);
		} else {
			console.error("Failed to fetch creditors:", error);
		}
	};

	useEffect(() => {
		fetchCreditors();
	}, [assignmentId]);

	// 2. Handle form submission for adding/editing a creditor
	const handleSaveCreditor = async (creditorData) => {
		let response;
		if (currentCreditor) {
			// Update existing creditor
			response = await supabase
				.from("assignment_creditors")
				.update(creditorData)
				.eq("id", currentCreditor.id);
		} else {
			// Add new creditor
			response = await supabase
				.from("assignment_creditors")
				.insert({ ...creditorData, assignment_id: assignmentId });
		}

		if (response.error) {
			console.error("Failed to save creditor:", response.error);
			alert("채권자 등록/수정 중 오류가 발생했습니다.");
		} else {
			setIsFormOpen(false);
			setCurrentCreditor(null);
			fetchCreditors(); // Refresh list
		}
	};

	// 3. Handle delete button click
	const handleDeleteCreditor = async (creditorId) => {
		const { error } = await supabase
			.from("assignment_creditors")
			.delete()
			.eq("id", creditorId);

		if (error) {
			console.error("Failed to delete creditor:", error);
			alert("채권자 삭제 중 오류가 발생했습니다.");
		} else {
			fetchCreditors(); // Refresh list
		}
	};

	return (
		<section className="mb-6 p-4 rounded shadow shadow-gray-5">
			<div className="flex justify-between">
				<h2 className="font-semibold text-lg mb-3">채권자 정보</h2>
				{isAdmin && (
					<Button
						onClick={() => {
							setCurrentCreditor(null); // Reset form for new creditor
							setIsFormOpen(true);
						}}
					>
						등록
					</Button>
				)}
			</div>
			{creditors.length === 0 ? (
				<p>등록된 채권자가 없습니다.</p>
			) : (
				creditors.map((creditor) => (
					<div key={creditor.id} className="mb-4">
						<div className="flex justify-between items-center">
							<div>
								<p>
									<span className="font-semibold">이름: </span>
									{creditor.name}
								</p>
								{/*
								<p>
									<span className="font-semibold">생년월일: </span>
									{creditor.birth_date || "정보 없음"}
								</p>
								<p>
									<span className="font-semibold">전화번호: </span>
									{creditor.phone_number || "정보 없음"}
								</p>
								<p>
									<span className="font-semibold">주소: </span>
									{creditor.address || "정보 없음"}
								</p>
						*/}
							</div>
							{isAdmin && (
								<div className="flex gap-2">
									<Button
										variant="soft"
										size="small"
										onClick={() => {
											setCurrentCreditor(creditor); // Set form data for editing
											setIsFormOpen(true);
										}}
									>
										수정
									</Button>
									<Button
										variant="outline"
										size="small"
										onClick={() => handleDeleteCreditor(creditor.id)}
									>
										삭제
									</Button>
								</div>
							)}
						</div>
					</div>
				))
			)}

			{/* CreditorForm Dialog */}
			{isFormOpen && (
				<CreditorForm
					initialData={currentCreditor}
					onOpenChange={setIsFormOpen}
					onSubmit={handleSaveCreditor}
				/>
			)}
		</section>
	);
};

export default CreditorInfo;

