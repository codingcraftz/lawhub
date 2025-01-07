"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Button, Flex, Text, Box } from "@radix-ui/themes";
import { motion } from "framer-motion";
import BondForm from "../_components/dialogs/BondForm";
import { formatDate, formattedEndDate } from "@/utils/util";

const BondDetails = ({ assignmentId, user }) => {
	const [bond, setBond] = useState(null);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isExpanded, setIsExpanded] = useState(false);
	const isAdmin = user?.role === "staff" || user?.role === "admin";

	// 1) fetch
	const fetchBond = async () => {
		const { data, error } = await supabase
			.from("bonds")
			.select("*")
			.eq("assignment_id", assignmentId)
			.maybeSingle();

		if (!error) {
			setBond(data || null);
		}
	};

	useEffect(() => {
		fetchBond();
	}, [assignmentId]);

	// 2) Form 성공 시 재-fetch
	const handleFormSuccess = () => {
		setIsFormOpen(false);
		fetchBond();
	};

	if (!bond) {
		return (
			<section className="mb-6 p-4 rounded shadow shadow-gray-5">
				<Flex className="justify-between">
					<h2 className="font-semibold text-lg mb-3">채권 정보</h2>
					{isAdmin && (
						<Button type="button" onClick={() => setIsFormOpen(true)}>등록</Button>
					)}
				</Flex>
				<p>등록된 채권 정보가 없습니다.</p>
				<BondForm
					assignmentId={assignmentId}
					open={isFormOpen}
					onOpenChange={setIsFormOpen}
					bondData={null}
					onSuccess={handleFormSuccess}
				/>
			</section>
		);
	}

	// 3) 계산
	const principal = parseFloat(bond.principal || 0);
	const calcInterest = (rate, sdate, edate) => {
		if (!rate || !sdate || !edate) return 0;
		const start = sdate === "dynamic" ? new Date() : new Date(sdate);
		const end = edate === "dynamic" ? new Date() : new Date(edate);
		const diffYears = (end - start) / (1000 * 3600 * 24 * 365.25);
		return principal * (parseFloat(rate) / 100) * Math.max(diffYears, 0);
	};

	const totalInterest1 = calcInterest(
		bond.interest_1_rate,
		bond.interest_1_start_date,
		bond.interest_1_end_date
	);
	const totalInterest2 = calcInterest(
		bond.interest_2_rate,
		bond.interest_2_start_date,
		bond.interest_2_end_date
	);

	const totalExpenses = Array.isArray(bond.expenses)
		? bond.expenses.reduce((sum, ex) => sum + parseFloat(ex.amount || 0), 0)
		: 0;

	const totalAmount = principal + totalInterest1 + totalInterest2 + totalExpenses;

	return (
		<section className="mb-6 p-4 rounded shadow shadow-gray-5">
			<Flex className="justify-between">
				<h2 className="font-semibold text-lg mb-3">채권 정보</h2>
				{isAdmin && (
					<Button type="button" onClick={() => setIsFormOpen(true)}>수정</Button>
				)}
			</Flex>
			<Flex justify="between" align="center">
				<Text className="text-lg font-bold text-blue-11">
					{Math.floor(totalAmount).toLocaleString()}원
				</Text>
				<Button variant="ghost" onClick={() => setIsExpanded(!isExpanded)}>
					{isExpanded ? "닫기" : "상세 보기"}
				</Button>
			</Flex>
			<motion.div
				initial={{ height: 0, opacity: 0 }}
				animate={{
					height: isExpanded ? "auto" : 0,
					opacity: isExpanded ? 1 : 0,
				}}
				transition={{ duration: 0.3 }}
				className="overflow-hidden"
			>
				<Flex className="flex flex-col bg-gray-3 rounded-lg p-4 mt-2">
					<Box>
						<ul>
							<strong className="flex items-center gap-1">
								수임 원금: <Text className="font-normal">{principal}</Text>
							</strong>

							<strong className="flex items-center gap-1">
								1차 이자{" "}
								<Text className="font-normal text-sm">
									({formatDate(bond.interest_1_start_date)} ~{" "}
									{formattedEndDate(bond.interest_1_end_date)})
								</Text>
							</strong>
							<li>이자율: {bond.interest_1_rate}%</li>
							<li>이자 총액: {Math.floor(totalInterest1).toLocaleString()}원</li>
						</ul>
					</Box>

					<Box className="py-2">
						<strong className="flex items-center gap-1">
							2차 이자{" "}
							<Text className="font-normal text-sm">
								({formatDate(bond.interest_2_start_date)} ~{" "}
								{formattedEndDate(bond.interest_2_end_date)})
							</Text>
						</strong>
						<ul>
							<li>이자율: {bond.interest_2_rate}%</li>
							<li>이자 총액: {Math.floor(totalInterest2).toLocaleString()}원</li>
						</ul>
					</Box>

					<Box className="py-2">
						<strong>비용:</strong>
						<ul>
							{bond.expenses?.length > 0
								? bond.expenses.map((expense, idx) => (
									<li key={idx}>
										{expense.item}: {parseInt(expense.amount).toLocaleString()}원
									</li>
								))
								: "비용 없음"}
						</ul>
					</Box>
				</Flex>
			</motion.div>


			{console.log(isFormOpen)}
			{
				isFormOpen &&
				<BondForm
					assignmentId={assignmentId}
					open={isFormOpen}
					onOpenChange={setIsFormOpen}
					bondData={bond}
					onSuccess={handleFormSuccess}
				/>
			}
		</section>
	);
};

export default BondDetails;

