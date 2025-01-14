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

	const fetchDebtors = async () => {
		const { data: debtorsData, error: debtorsError } = await supabase
			.from("assignment_debtors")
			.select("id, name, birth_date, phone_number, address")
			.eq("assignment_id", assignmentId);

		if (debtorsError) {
			console.error("Failed to fetch debtors:", debtorsError);
			return;
		}

		const updatedDebtors = await Promise.all(
			debtorsData.map(async (debtor) => {
				const { data: creditInfo, error: creditError } = await supabase
					.from("debtor_credit_info")
					.select("owned")
					.eq("debtor_id", debtor.id)
					.maybeSingle();

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

	// 등록/수정
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

	// 삭제
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

	// 신용정보 수정
	const handleEditCreditInfo = async (debtor) => {
		setSelectedDebtor(debtor);
		const { data: cinfo, error } = await supabase
			.from("debtor_credit_info")
			.select("owned")
			.eq("debtor_id", debtor.id)
			.maybeSingle();

		setSelectedDebtorCredit(cinfo?.owned || {});
		setOpenCreditInfo(true);
	};

	const handleSaveCreditInfo = async (updatedInfo) => {
		const { error } = await supabase
			.from("debtor_credit_info")
			.upsert({
				debtor_id: selectedDebtor.id,
				owned: updatedInfo,
			}, { onConflict: "debtor_id" });

		if (!error) {
			setOpenCreditInfo(false);
			fetchDebtors();
		}
	};

	const toggleExpand = (debtorId) => {
		setIsExpanded((prev) => ({
			...prev,
			[debtorId]: !prev[debtorId],
		}));
	};

	return (
		<section className="mb-6 p-4 rounded shadow-md shadow-gray-7 bg-gray-2 text-gray-12">
			<Flex justify="between" align="center" className="mb-3">
				<Text as="h2" className="font-semibold text-lg">
					채무자 정보
				</Text>
				{isAdmin && (
					<Button
						onClick={() => {
							setSelectedDebtor(null);
							setIsFormOpen(true);
						}}
					>
						등록
					</Button>
				)}
			</Flex>

			{debtors.length === 0 ? (
				<Text>등록된 채무자가 없습니다.</Text>
			) : (
				debtors.map((debtor) => (
					<Box
						key={debtor.id}
						className="mb-4 p-3 bg-gray-3 border border-gray-6 rounded"
					>
						<Flex justify="between" align="center">
							<Box>
								<Text>
									<span className="font-semibold">이름: </span>
									{debtor.name}
								</Text>
							</Box>
							{isAdmin && (
								<Flex gap="2">
									<Button
										variant="soft"
										size="2"
										onClick={() => {
											setSelectedDebtor(debtor);
											setIsFormOpen(true);
										}}
									>
										수정
									</Button>
									<Button
										variant="soft"
										color="red"
										size="2"
										onClick={() => handleDeleteDebtor(debtor.id)}
									>
										삭제
									</Button>
									<Button
										variant="soft"
										size="2"
										onClick={() => handleEditCreditInfo(debtor)}
									>
										신용정보 수정
									</Button>
								</Flex>
							)}
							<Button variant="ghost" onClick={() => toggleExpand(debtor.id)}>
								{isExpanded[debtor.id] ? "닫기" : "신용 정보"}
							</Button>
						</Flex>

						{isExpanded[debtor.id] && (
							<motion.div
								initial={{ height: 0, opacity: 0 }}
								animate={{ height: "auto", opacity: 1 }}
								transition={{ duration: 0.3 }}
								className="overflow-hidden mt-3"
							>
								<Box className="bg-gray-2 p-3 border border-gray-6 rounded">
									{debtor.creditInfo ? (
										<ul >
											{Object.entries(debtor.creditInfo).map(([key, value]) => (
												<li key={key}>
													<Text size="2" color="gray">
														{key}: {value}
													</Text>
												</li>
											))}
										</ul>
									) : (
										<Text size="2" color="gray">
											등록된 신용 정보가 없습니다.
										</Text>
									)}
								</Box>
							</motion.div>
						)}
					</Box>
				))
			)}

			{isFormOpen && (
				<DebtorForm
					initialData={selectedDebtor}
					onOpenChange={setIsFormOpen}
					onSubmit={handleSaveDebtor}
				/>
			)}

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

