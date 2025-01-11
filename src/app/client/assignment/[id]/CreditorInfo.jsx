"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { Button } from "@radix-ui/themes";
import CreditorForm from "../_components/dialogs/CreditorForm";

const CreditorInfo = ({ assignmentId, user }) => {
	const [creditors, setCreditors] = useState([]);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [currentCreditor, setCurrentCreditor] = useState(null);

	const isAdmin = user?.role === "staff" || user?.role === "admin";

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

	const handleSaveCreditor = async (creditorData) => {
		let response;
		if (currentCreditor) {
			response = await supabase
				.from("assignment_creditors")
				.update(creditorData)
				.eq("id", currentCreditor.id);
		} else {
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
			fetchCreditors();
		}
	};

	const handleDeleteCreditor = async (creditorId) => {
		const { error } = await supabase
			.from("assignment_creditors")
			.delete()
			.eq("id", creditorId);

		if (error) {
			console.error("Failed to delete creditor:", error);
			alert("채권자 삭제 중 오류가 발생했습니다.");
		} else {
			fetchCreditors();
		}
	};

	return (
		<section className="mb-6 p-4 rounded shadow-md shadow-gray-7 bg-gray-2 text-gray-12">
			<div className="flex justify-between mb-3">
				<h2 className="font-semibold text-lg">채권자 정보</h2>
				{isAdmin && (
					<Button
						variant="soft"
						onClick={() => {
							setCurrentCreditor(null);
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
					<div
						key={creditor.id}
						className="mb-4 p-3 bg-gray-3 border border-gray-6 rounded"
					>
						<div className="flex justify-between items-center">
							<div>
								<p>
									<span className="font-semibold">이름: </span>
									{creditor.name}
								</p>
							</div>
							{isAdmin && (
								<div className="flex gap-2">
									<Button
										variant="soft"
										size="2"
										onClick={() => {
											setCurrentCreditor(creditor);
											setIsFormOpen(true);
										}}
									>
										수정
									</Button>
									<Button
										variant="soft"
										size="2"
										color="red"
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

