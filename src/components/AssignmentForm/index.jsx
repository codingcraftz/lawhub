"use client";

import React, { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Switch from "@radix-ui/react-switch";
import { Cross2Icon } from "@radix-ui/react-icons";
import { Box, Flex, Button, Text, Theme } from "@radix-ui/themes";
import { supabase } from "@/utils/supabase";

// react-hook-form + yup
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

// 스텝 컴포넌트 (4단계)
import Step2_CreditorRegistration from "./Step2_CreditorRegistration";
import Step3_DebtorRegistration from "./Step3_DebtorRegistration";
import Step4_AssignmentContent from "./Step4_AssignmentContent";
import { useRouter } from "next/navigation";
import Step1_ClientAndGroupSelection from "./Step1_ClientAndGroupSelection";

// 밸리데이션 스키마
const assignmentSchema = yup.object().shape({
	description: yup.string().required("의뢰 내용을 입력해주세요."),
});

const AssignmentForm = ({ open, onOpenChange, onSuccess }) => {
	const [step, setStep] = useState(1);
	const [noClientSelected, setNoClientSelected] = useState(false); // 의뢰인 없음 스위치
	const [selectedClients, setSelectedClients] = useState([]);
	const [selectedCreditors, setSelectedCreditors] = useState([]);
	const [selectedGroups, setSelectedGroups] = useState([]);
	const [selectedDebtors, setSelectedDebtors] = useState([]);
	const [userType, setUserType] = useState(null);
	const router = useRouter();

	// --------------------- 의뢰 내용 + react-hook-form ---------------------
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm({
		resolver: yupResolver(assignmentSchema),
		mode: "onChange",
	});

	// 모달이 열릴 때마다 State 리셋 (기존 등록 정보 초기화)
	useEffect(() => {
		if (open) {
			setStep(1);
			setNoClientSelected(false);
			setSelectedClients([]);
			setSelectedCreditors([]);
			setSelectedDebtors([]);
		}
	}, [open]);

	// --------------------- 스텝 이동 ---------------------
	const goToNextStep = () => {
		if (step === 1) {
			// Step1 검증: 의뢰인 없음 스위치가 OFF인데 아무도 선택 안 했다면 불가
			if (
				!noClientSelected &&
				selectedClients.length === 0 &&
				selectedGroups.length === 0
			) {
				alert("의뢰인을 선택하거나 '의뢰인 없음'을 켜주세요.");
				return;
			}
		}
		setStep(step + 1);
	};

	const goToPrevStep = () => {
		setStep(step - 1);
	};


	const onSubmit = async (data) => {
		try {
			// Step 1: 의뢰 생성
			const { data: assignmentData, error: assignmentError } = await supabase
				.from("assignments")
				.insert([
					{
						description: data.description,
					},
				])
				.select("*")
				.single();

			if (assignmentError) {
				console.error("Assignment 추가 오류:", assignmentError);
				alert("Assignment 추가 중 오류가 발생했습니다.");
				return;
			}

			const assignmentId = assignmentData.id;

			if (noClientSelected) {
				const { error: clientError } = await supabase
					.from("assignment_clients")
					.insert({
						assignment_id: assignmentId,
						client_id: "e8353222-07e6-4d05-ac2c-5e004c043ce6"
					});
				if (clientError) {
					console.error("Assignment Clients 추가 오류:", clientError);
					alert("Clients 추가 중 오류가 발생했습니다.");
					return;
				}


			}
			// Step 2: 의뢰인 데이터 추가
			if (!noClientSelected) {
				if (selectedClients.length > 0) {
					const clientInsertData = selectedClients.map((client) => ({
						assignment_id: assignmentId,
						client_id: client.id,
						type: userType
					}));
					const { error: clientError } = await supabase
						.from("assignment_clients")
						.insert(clientInsertData);
					if (clientError) {
						console.error("Assignment Clients 추가 오류:", clientError);
						alert("Clients 추가 중 오류가 발생했습니다.");
						return;
					}
				}

				if (selectedGroups.length > 0) {
					const groupInsertData = selectedGroups.map((group) => ({
						assignment_id: assignmentId,
						group_id: group.id,
						type: userType
					}));
					const { error: groupError } = await supabase
						.from("assignment_groups")
						.insert(groupInsertData);
					if (groupError) {
						console.error("Assignment Groups 추가 오류:", groupError);
						alert("Groups 추가 중 오류가 발생했습니다.");
						return;
					}
				}
			}

			if (selectedCreditors.length > 0) {
				const creditorsInsertData = selectedCreditors.map((creditor) => ({
					assignment_id: assignmentId,
					name: creditor.name,
					birth_date: creditor?.birth_date || null,
					phone_number: creditor?.phone_number || null,
					address: creditor?.address || null,
				}));

				const { error: creditorError } = await supabase
					.from("assignment_creditors")
					.insert(creditorsInsertData);

				if (creditorError) {
					console.error("Assignment Creditors 추가 오류:", creditorError);
					alert("Creditors 추가 중 오류가 발생했습니다.");
					return;
				}
			}

			if (selectedDebtors.length > 0) {
				const debtorsInsertData = selectedDebtors.map((debtor) => ({
					assignment_id: assignmentId,
					name: debtor.name,
					birth_date: debtor?.birth_date || null,
					phone_number: debtor?.phone_number || null,
					address: debtor.address || null,
				}));

				const { error: debtorError } = await supabase
					.from("assignment_debtors")
					.insert(debtorsInsertData);

				if (debtorError) {
					console.error("Assignment Debtors 추가 오류:", debtorError);
					alert("Debtors 추가 중 오류가 발생했습니다.");
					return;
				}
			}

			// 성공 메시지 및 페이지 이동
			alert("Assignment가 성공적으로 등록되었습니다!");
			onSuccess && onSuccess();
			onOpenChange(false);
			router.push(`/client/assignment/${assignmentId}`);
		} catch (err) {
			console.error("Assignment 추가 중 예기치 못한 오류:", err);
			alert("Assignment 추가 중 오류가 발생했습니다.");
		}
	};



	// --------------------- 전체 취소(리셋) ---------------------
	const handleCancel = () => {
		setStep(1);
		setNoClientSelected(false);
		setSelectedClients([]);
		setSelectedCreditors([]);
		setSelectedDebtors([]);
		onOpenChange(false);
	};

	// --------------------- 선택 제거 핸들러 (의뢰인) ---------------------
	const removeClient = (clientId) => {
		setSelectedClients((prev) => prev.filter((c) => c.id !== clientId));
	};

	// --------------------- 선택 제거 핸들러 (채권자) ---------------------
	const removeCreditor = (index) => {
		setSelectedCreditors((prev) => prev.filter((_, i) => i !== index));
	};

	// --------------------- 선택 제거 핸들러 (채무자) ---------------------
	const removeDebtor = (index) => {
		setSelectedDebtors((prev) => prev.filter((_, i) => i !== index));
	};

	const removeGroup = (groupId) => {
		setSelectedGroups((prev) => prev.filter((g) => g.id !== groupId));
	};


	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Portal>
				<Theme>
					<Dialog.Overlay className="fixed inset-0 bg-black opacity-75 z-30" />
					<Dialog.Content
						className="fixed bg-gray-3 left-1/2 top-1/2 max-h-[85vh] w-full max-w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-md p-[25px] shadow focus:outline-none z-40 overflow-y-auto"
						style={{ width: "90%", maxWidth: "600px" }}
					>
						<Dialog.Close asChild>
							<Button
								variant="ghost"
								color="gray"
								style={{ position: "absolute", top: 8, right: 8 }}
							>
								<Cross2Icon width={25} height={25} />
							</Button>
						</Dialog.Close>

						{/* ========== Step1: 의뢰인 선택 ========== */}
						{step === 1 && (
							<>
								<Dialog.Title className="font-bold text-xl mb-3">
									1단계: 의뢰인을 선택해주세요
								</Dialog.Title>

								{/* 의뢰인 없음 스위치 */}
								<Flex align="center" mb="3" gap="2">
									<Text>의뢰인 없음 (미가입)</Text>
									<Switch.Root
										checked={noClientSelected}
										onCheckedChange={(checked) => {
											setNoClientSelected(checked);
											if (checked) setSelectedClients([]);
										}}
										style={{ width: 42, height: 25, position: "relative" }}
									>
										<Switch.Thumb
											style={{
												display: "block",
												width: 21,
												height: 21,
												backgroundColor: "white",
												borderRadius: "50%",
												transition: "transform 100ms",
												transform: noClientSelected
													? "translateX(19px)"
													: "translateX(2px)",
											}}
										/>
									</Switch.Root>
								</Flex>

								{!noClientSelected && (
									<Step1_ClientAndGroupSelection
										noClientSelected={noClientSelected}
										selectedClients={selectedClients}
										setSelectedClients={setSelectedClients}
										removeClient={removeClient}
										selectedGroups={selectedGroups}
										setSelectedGroups={setSelectedGroups}
										removeGroup={removeGroup}
										userType={userType}
										setUserType={setUserType}
									/>
								)}

								<Flex justify="end" mt="4" gap="2">
									<Button variant="soft" color="gray" onClick={handleCancel}>
										닫기
									</Button>
									<Button
										variant="soft"
										onClick={goToNextStep}
										disabled={!noClientSelected && selectedClients.length === 0 && selectedGroups.length === 0}
									>
										다음
									</Button>
								</Flex>
							</>
						)}

						{/* ========== Step2: 채권자(Creditor) 등록 ========== */}
						{step === 2 && (
							<>
								<Dialog.Title className="font-bold text-xl mb-3">
									2단계: 채권자 정보를 입력하세요
								</Dialog.Title>

								<Step2_CreditorRegistration
									selectedCreditors={selectedCreditors}
									setSelectedCreditors={setSelectedCreditors}
									removeCreditor={removeCreditor}
								/>

								<Flex justify="end" mt="4" gap="2">
									<Button variant="soft" color="gray" onClick={goToPrevStep}>
										이전
									</Button>
									<Button variant="soft" onClick={goToNextStep}>
										다음
									</Button>
								</Flex>
							</>
						)}

						{/* ========== Step3: 채무자(Debtor) 등록 ========== */}
						{step === 3 && (
							<>
								<Dialog.Title className="font-bold text-xl mb-3">
									3단계: 채무자 정보를 입력하세요
								</Dialog.Title>

								<Step3_DebtorRegistration
									selectedDebtors={selectedDebtors}
									setSelectedDebtors={setSelectedDebtors}
									removeDebtor={removeDebtor}
								/>

								<Flex justify="end" mt="4" gap="2">
									<Button variant="soft" color="gray" onClick={goToPrevStep}>
										이전
									</Button>
									<Button variant="soft" onClick={goToNextStep}>
										다음
									</Button>
								</Flex>
							</>
						)}

						{/* ========== Step4: 의뢰 내용 입력 ========== */}
						{step === 4 && (
							<Step4_AssignmentContent
								register={register}
								goToPrevStep={goToPrevStep}
								handleSubmit={handleSubmit}
								onSubmit={onSubmit}
								errors={errors}
							/>
						)}
					</Dialog.Content>
				</Theme>
			</Dialog.Portal>
		</Dialog.Root>
	);
};

export default AssignmentForm;

