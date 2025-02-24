// src/app/client/assignment/[id]/DebtorInfo.jsx

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
	const [isSubmitting, setIsSubmitting] = useState(false);


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

	const handleSaveDebtor = async (debtorData) => {
		if (isSubmitting) return;
		setIsSubmitting(true);
		try {
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
				throw response.error
			}

			setIsFormOpen(false);
			setSelectedDebtor(null);
			fetchDebtors();
		} catch (error) {
			console.error("채무자 등록/수정 오류:", error)
		} finally { setIsSubmitting(false); }
	};

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

	const handleEditCreditInfo = async (debtor) => {
		setSelectedDebtor(debtor);
		if (isSubmitting) return;
		setIsSubmitting(true);

		const { data: cinfo, error } = await supabase
			.from("debtor_credit_info")
			.select("owned")
			.eq("debtor_id", debtor.id)
			.maybeSingle();

		setSelectedDebtorCredit(cinfo?.owned || {});
		setOpenCreditInfo(true);
	};

	const handleSaveCreditInfo = async (updatedInfo) => {
		if (isSubmitting) return;
		setIsSubmitting(true);
		try {
			const { error } = await supabase
				.from("debtor_credit_info")
				.upsert({
					debtor_id: selectedDebtor.id,
					owned: updatedInfo,
				}, { onConflict: "debtor_id" });

			if (error) {
				throw error
			}
			setOpenCreditInfo(false);
			fetchDebtors();
		} catch (error) {
			console.error("신용정보 저장중 오류:", error)
		} finally { setIsSubmitting(false); }
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
						<Flex justify="between" align="center" className="flex-col md:flex-row">
							<div className="flex justify-between items-center gap-2 w-full">
								<p className="flex flex-col md:flex-row items-center gap-2 flex-start">
									<p className="font-semibold"> {`이름: ${debtor.name}`}</p>
									{isAdmin && (
										<Flex className="items-center gap-2">
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
										</Flex>
									)}
								</p>
								<Button variant="ghost" onClick={() => toggleExpand(debtor.id)}>
									{isExpanded[debtor.id] ? "닫기" : "신용 정보"}
								</Button>
							</div>
						</Flex>

						{isExpanded[debtor.id] && (
							<motion.div
								initial={{ height: 0, opacity: 0 }}
								animate={{ height: "auto", opacity: 1 }}
								transition={{ duration: 0.3 }}
								className="overflow-hidden mt-3"
							>
								{isAdmin &&
									<div className="flex flex-end w-full mb-2">
										<Button
											className="ml-auto"
											variant="soft"
											size="2"
											onClick={() => handleEditCreditInfo(debtor)}
										>
											신용정보 수정
										</Button>
									</div>
								}
								<Box className="bg-gray-2 p-3 border border-gray-6 rounded">
									{debtor.creditInfo ? (
										<ul >
											{Object.entries(debtor.creditInfo).map(([key, value]) => (
												<li key={key}>
													<Text>
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
					isSubmitting={isSubmitting}
					initialData={selectedDebtor}
					onOpenChange={setIsFormOpen}
					onSubmit={handleSaveDebtor}
				/>
			)}

			{openCreditInfo && (
				<EditCreditInfo
					isSubmitting={isSubmitting}
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

