"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { Button, Flex, Text, Box } from "@radix-ui/themes";
import { motion } from "framer-motion";
import EditCreditInfo from "../_components/dialogs/EditCreditInfo";
import DebtorForm from "../_components/dialogs/DebtorForm";

const DebtorInfo = ({ assignmentId, user }) => {
	const [debtors, setDebtors] = useState([]);
	const [isExpanded, setIsExpanded] = useState({});
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [selectedDebtor, setSelectedDebtor] = useState(null);
	const [openCreditInfo, setOpenCreditInfo] = useState(false);
	const [selectedDebtorCredit, setSelectedDebtorCredit] = useState({});

	const isAdmin = user?.role === "staff" || user?.role === "admin";

	// 1. Fetch debtors and their credit info
	const fetchDebtors = async () => {
		const { data: debtorsData, error: debtorsError } = await supabase
			.from("assignment_debtors")
			.select("id, name, birth_date, phone_number, address")
			.eq("assignment_id", assignmentId);

		if (debtorsError) {
			console.error("Failed to fetch debtors:", debtorsError);
			return;
		}

		// Fetch associated credit info for each debtor
		const updatedDebtors = await Promise.all(
			debtorsData.map(async (debtor) => {
				const { data: creditInfo, error: creditError } = await supabase
					.from("debtor_credit_info")
					.select("owned")
					.eq("debtor_id", debtor.id)
					.single();

				return {
					...debtor,
					creditInfo: creditError ? null : creditInfo?.owned || null,
				};
			})
		);

		setDebtors(updatedDebtors);
	};

	useEffect(() => {
		fetchDebtors();
	}, [assignmentId]);

	// 2. Handle form submission for adding/editing a debtor
	const handleSaveDebtor = async (debtorData) => {
		let response;
		if (selectedDebtor) {
			response = await supabase
				.from("assignment_debtors")
				.update(debtorData)
				.eq("id", selectedDebtor.id);
		} else {
			response = await supabase
				.from("assignment_debtors")
				.insert({ ...debtorData, assignment_id: assignmentId });
		}

		if (response.error) {
			console.error("Failed to save debtor:", response.error);
			alert("채무자 등록/수정 중 오류가 발생했습니다.");
			return;
		}

		setIsFormOpen(false);
		setSelectedDebtor(null);
		fetchDebtors();
	};

	// 3. Handle delete button click
	const handleDeleteDebtor = async (debtorId) => {
		const { error } = await supabase
			.from("assignment_debtors")
			.delete()
			.eq("id", debtorId);

		if (error) {
			console.error("Failed to delete debtor:", error);
			alert("채무자 삭제 중 오류가 발생했습니다.");
		} else {
			fetchDebtors();
		}
	};

	// 4. Handle edit credit info
	const handleEditCreditInfo = async (debtor) => {
		setSelectedDebtor(debtor);

		const { data: cinfo, error } = await supabase
			.from("debtor_credit_info")
			.select("owned")
			.eq("debtor_id", debtor.id)
			.single();

		setSelectedDebtorCredit(cinfo?.owned || {});
		setOpenCreditInfo(true);
	};

	const handleSaveCreditInfo = async (updatedInfo) => {
		const { error } = await supabase
			.from("debtor_credit_info")
			.upsert({
				debtor_id: selectedDebtor.id,
				owned: updatedInfo,
			});

		if (!error) {
			setOpenCreditInfo(false);
			fetchDebtors();
		}
	};

	// Toggle expand
	const toggleExpand = (debtorId) => {
		setIsExpanded((prev) => ({
			...prev,
			[debtorId]: !prev[debtorId],
		}));
	};

	return (
		<section className="mb-6 p-4 rounded shadow shadow-gray-5">
			<div className="flex justify-between">
				<h2 className="font-semibold text-lg mb-3">채무자 정보</h2>
				{isAdmin && (
					<Button
						onClick={() => {
							setSelectedDebtor(null); // Reset for new form
							setIsFormOpen(true);
						}}
					>
						등록/수정
					</Button>
				)}
			</div>
			{debtors.length === 0 ? (
				<p>등록된 채무자가 없습니다.</p>
			) : (
				debtors.map((debtor) => (
					<div key={debtor.id} className="mb-4">
						<div className="flex justify-between items-center">
							<div>
								<p>
									<span className="font-semibold">이름: </span>
									{debtor.name}
								</p>
								{/*
								<p>
									<span className="font-semibold">생년월일: </span>
									{debtor.birth_date || "정보 없음"}
								</p>
								<p>
									<span className="font-semibold">전화번호: </span>
									{debtor.phone_number || "정보 없음"}
								</p>
								<p>
									<span className="font-semibold">주소: </span>
									{debtor.address || "정보 없음"}
								</p>
						*/}
							</div>
							{isAdmin && (
								<div className="flex gap-2">
									<Button
										variant="soft"
										size="small"
										onClick={() => {
											setSelectedDebtor(debtor); // For edit form
											setIsFormOpen(true);
										}}
									>
										수정
									</Button>
									<Button
										variant="outline"
										size="small"
										onClick={() => handleDeleteDebtor(debtor.id)}
									>
										삭제
									</Button>
									<Button
										variant="soft"
										size="small"
										onClick={() => handleEditCreditInfo(debtor)}
									>
										신용정보 수정
									</Button>
								</div>
							)}
							<Button variant="ghost" onClick={() => toggleExpand(debtor.id)}>
								{isExpanded[debtor.id] ? "닫기" : "신용 정보"}
							</Button>
						</div>
						{isExpanded[debtor.id] && (
							<motion.div
								initial={{ height: 0, opacity: 0 }}
								animate={{ height: "auto", opacity: 1 }}
								transition={{ duration: 0.3 }}
								className="overflow-hidden"
							>
								<Flex className="bg-gray-3 p-4 rounded mt-2">
									{debtor.creditInfo ? (
										<ul>
											{Object.entries(debtor.creditInfo).map(([key, value]) => (
												<li key={key}>
													<Text>{key}: {value}</Text>
												</li>
											))}
										</ul>
									) : (
										<Text>등록된 신용 정보가 없습니다.</Text>
									)}
								</Flex>
							</motion.div>
						)}
					</div>
				))
			)}

			{/* DebtorForm Dialog */}
			{isFormOpen && (
				<DebtorForm
					initialData={selectedDebtor}
					onOpenChange={setIsFormOpen}
					onSubmit={handleSaveDebtor}
				/>
			)}

			{/* Credit Info Dialog */}
			{openCreditInfo && (
				<EditCreditInfo
					open={openCreditInfo}
					onOpenChange={setOpenCreditInfo}
					debtor={selectedDebtor}
					initialCreditInfo={selectedDebtorCredit}
					onSave={handleSaveCreditInfo}
				/>
			)}
		</section>
	);
};

export default DebtorInfo;

