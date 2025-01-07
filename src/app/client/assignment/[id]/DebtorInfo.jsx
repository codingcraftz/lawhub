"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { Button, Flex, Text, Box } from "@radix-ui/themes";
import { motion } from "framer-motion";
import EditDebtorDialog from "../_components/dialogs/EditDebtor";
import EditCreditInfo from "../_components/dialogs/EditCreditInfo";

/**
 * DebtorInfo
 * - assignmentId, user
 * - 여기에 필요한 debtor 정보는 여기서 fetch
 * - 등록/수정 시 setDebtors(...) 등 로컬 상태 갱신
 */

const DebtorInfo = ({ assignmentId, user }) => {
	const [debtors, setDebtors] = useState([]);
	const [debtorsCreditInfo, setDebtorsCreditInfo] = useState([]);
	const [isExpanded, setIsExpanded] = useState({});
	const [editDialogOpen, setEditDialogOpen] = useState(false);

	// ... selectedDebtor, credit forms, etc.
	const [selectedDebtor, setSelectedDebtor] = useState(null);
	const [selectedDebtorCredit, setSelectedDebtorCredit] = useState({});
	const [openCreditInfo, setOpenCreditInfo] = useState(false);

	const isAdmin = user?.role === "staff" || user?.role === "admin";

	// 1) fetch debtors
	const fetchDebtors = async () => {
		// assignment_debtors + debtors join
		const { data, error } = await supabase
			.from("assignment_debtors")
			.select("debtor_id, debtors!inner(id, name, phone_number, address)")
			.eq("assignment_id", assignmentId);

		if (!error && data) {
			const mapped = data.map((item) => item.debtors);
			setDebtors(mapped);
		}
	};

	// 2) fetch credit info for each debtor
	const fetchAllCreditInfo = async (debtorList) => {
		const results = [];
		for (let debtor of debtorList) {
			const { data: cinfo, error } = await supabase
				.from("debtor_credit_info")
				.select("owned")
				.eq("debtor_id", debtor.id)
				.single();
			if (!error && cinfo) {
				results.push({ debtorId: debtor.id, owned: cinfo.owned });
			} else {
				results.push({ debtorId: debtor.id, owned: null });
			}
		}
		setDebtorsCreditInfo(results);
	};

	useEffect(() => {
		(async () => {
			await fetchDebtors();
		})();
	}, [assignmentId]);

	useEffect(() => {
		if (debtors.length > 0) {
			fetchAllCreditInfo(debtors);
		}
	}, [debtors]);

	// 3) 토글
	const toggleExpand = (debtorId) => {
		setIsExpanded((prev) => ({
			...prev,
			[debtorId]: !prev[debtorId],
		}));
	};

	// 4) 등록/수정이 완료되면 다시 fetch
	const handleSaveDebtors = async () => {
		setEditDialogOpen(false);
		await fetchDebtors(); // 다시 fetch
	};

	// 5) 신용정보 수정
	const handleEditCreditInfo = async (debtor) => {
		setSelectedDebtor(debtor);
		// fetch single
		const { data: cinfo, error } = await supabase
			.from("debtor_credit_info")
			.select("owned")
			.eq("debtor_id", debtor.id)
			.single();

		if (!error && cinfo) {
			setSelectedDebtorCredit(cinfo.owned);
		} else {
			setSelectedDebtorCredit({});
		}
		setOpenCreditInfo(true);
	};

	const handleSaveCreditInfo = async (updatedInfo) => {
		// update DB
		const { error } = await supabase
			.from("debtor_credit_info")
			.upsert({
				debtor_id: selectedDebtor.id,
				owned: updatedInfo,
			})
			.eq("debtor_id", selectedDebtor.id);

		if (!error) {
			// local update
			setOpenCreditInfo(false);
			// 다시 전체 fetch
			await fetchDebtors();
		}
	};

	return (
		<section className="mb-6 p-4 rounded shadow shadow-gray-5">
			<div className="flex justify-between">
				<h2 className="font-semibold text-lg mb-3">채무자 정보</h2>
				{isAdmin && (
					<Button onClick={() => setEditDialogOpen(true)}>등록/수정</Button>
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
							</div>
							{isAdmin && (
								<Button
									variant="soft"
									size="small"
									onClick={() => handleEditCreditInfo(debtor)}
								>
									신용정보 수정
								</Button>
							)}
							<Button variant="ghost" onClick={() => toggleExpand(debtor.id)}>
								{isExpanded[debtor.id] ? "닫기" : "신용 정보"}
							</Button>
						</div>
						<motion.div
							initial={{ height: 0, opacity: 0 }}
							animate={{
								height: isExpanded[debtor.id] ? "auto" : 0,
								opacity: isExpanded[debtor.id] ? 1 : 0,
							}}
							transition={{ duration: 0.3 }}
							className="overflow-hidden"
						>
							<Flex className="flex flex-col bg-gray-3 rounded shadow-sm p-4 mt-2">
								<Box>
									<h3 className="font-semibold text-md mb-2">신용 정보</h3>
									{(() => {
										const info = debtorsCreditInfo.find(
											(x) => x.debtorId === debtor.id
										);
										if (info && info.owned) {
											return (
												<ul className="space-y-2">
													{Object.entries(info.owned).map(([key, value], idx) => (
														<li
															key={idx}
															className="flex justify-between items-center p-2 rounded shadow-sm shadow-gray-9"
														>
															<Text>{key}</Text>
															<Text>{value}</Text>
														</li>
													))}
												</ul>
											);
										} else {
											return <Text>등록된 신용 정보가 없습니다.</Text>;
										}
									})()}
								</Box>
							</Flex>
						</motion.div>
					</div>
				))
			)}

			{/* 채무자 등록/수정 다이얼로그 */}
			<EditDebtorDialog
				open={editDialogOpen}
				onOpenChange={setEditDialogOpen}
				debtors={debtors}
				assignmentId={assignmentId}
				onSave={handleSaveDebtors}
			/>

			{/* 신용정보 수정 다이얼로그 */}
			<EditCreditInfo
				open={openCreditInfo}
				onOpenChange={setOpenCreditInfo}
				debtor={selectedDebtor}
				initialCreditInfo={selectedDebtorCredit}
				onSave={handleSaveCreditInfo}
			/>
		</section>
	);
};

export default DebtorInfo;

