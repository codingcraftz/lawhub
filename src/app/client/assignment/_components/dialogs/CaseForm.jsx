"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Flex, Text, Button } from "@radix-ui/themes";
import * as Dialog from "@radix-ui/react-dialog";
import { useForm } from "react-hook-form";

import { COURT_LIST, COURT_CITIES } from "@/utils/courtList";
import { CASE_TYPE_OPTIONS } from "@/utils/caseType";
import { CASE_CATEGORIES } from "@/utils/caseCategory";
import DynamicSelect from "../DynamicSelect";
import { Cross2Icon } from "@radix-ui/react-icons";

const clientRoles = [
	"미정",
	"원고",
	"피고",
	"신청인",
	"피신청인",
	"고소인",
	"피고소인",
	"채권자",
	"채무자",
];

const CaseForm = ({
	caseData,
	onSuccess,
	onClose,
	open,
	onOpenChange,
	assignmentId,
}) => {
	const {
		register,
		handleSubmit,
		setValue,
		watch,
		formState: { errors },
	} = useForm({
		defaultValues: {
			category: "",
			city: "",
			court_name: "",
			case_year: "",
			case_number: "",
			case_type: "",
			case_subject: "",
			description: "",
			client_role: clientRoles[0],
		},
	});

	const [filteredCaseTypes, setFilteredCaseTypes] = useState([]);
	const [filteredCourts, setFilteredCourts] = useState([]);

	const categoryWatch = watch("category");
	const cityWatch = watch("city");

	// 초기값 설정
	useEffect(() => {
		if (caseData) {
			const foundCourt = COURT_LIST.find((c) => c.name === caseData.court_name);
			setValue("city", foundCourt?.city || "");
			setValue("category", caseData.category || "");
			setValue("court_name", caseData.court_name || "");
			setValue("case_type", caseData.case_type || "");
			setValue("case_year", caseData.case_year || "");
			setValue("case_number", caseData.case_number || "");
			setValue("case_subject", caseData.case_subject || "");
			setValue("description", caseData.description || "");
			setValue("client_role", caseData.client_role || clientRoles[0]);
		}
	}, [caseData, setValue]);

	useEffect(() => {
		if (!categoryWatch) {
			setFilteredCaseTypes([]);
		} else {
			setFilteredCaseTypes(CASE_TYPE_OPTIONS[categoryWatch] || []);
		}
	}, [categoryWatch]);

	// 도시 변경 -> 법원 필터링
	useEffect(() => {
		if (!cityWatch) {
			setFilteredCourts([]);
		} else {
			setFilteredCourts(COURT_LIST.filter((court) => court.city === cityWatch));
		}
	}, [cityWatch]);

	const onSubmit = async (formValues) => {
		try {
			const payload = {
				category: formValues.category || null,
				city: formValues.city || null,
				court_name: formValues.court_name || null,
				case_year: formValues.case_year || null,
				case_number: formValues.case_number || null,
				case_type: formValues.case_type || null,
				case_subject: formValues.case_subject || null,
				description: formValues.description || null,
				client_role: formValues.client_role || null,
				status: "ongoing",
				assignment_id: assignmentId || null,
			};

			let savedCase;
			if (caseData) {
				const { data, error } = await supabase
					.from("cases")
					.update(payload)
					.eq("id", caseData.id)
					.select("*")
					.single();
				if (error) throw error;
				savedCase = data;
			} else {
				const { data, error } = await supabase
					.from("cases")
					.insert([payload])
					.select("*")
					.single();
				if (error) throw error;
				savedCase = data;
			}
			if (onSuccess) onSuccess(savedCase);
		} catch (err) {
			console.error(err);
			alert("저장 실패");
		}
	};

	const handleDelete = async () => {

		if (!caseData?.id) {
			alert("삭제할 항목이 없습니다.");
			return;
		}

		const confirmation = confirm("정말로 이 항목을 삭제하시겠습니까?");
		if (!confirmation) return;

		try {
			const { error } = await supabase
				.from("cases")
				.delete()
				.eq("id", caseData.id);

			if (error) {
				throw new Error("소송 항목 삭제 중 오류가 발생했습니다.");
			}

			alert("항목이 성공적으로 삭제되었습니다.");
			if (onSuccess) onSuccess(); // 부모 컴포넌트에서 상태를 갱신
			onOpenChange(false); // 다이얼로그 닫기
		} catch (error) {
			console.error("Error deleting timeline item:", error);
			alert("항목 삭제 중 오류가 발생했습니다.");
		}
	};


	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Overlay className="fixed inset-0 bg-black opacity-50 z-30" />
			<Dialog.Content className="fixed bg-gray-3 left-1/2 top-1/2 max-h-[85vh] w-full max-w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-md p-[25px] shadow focus:outline-none z-40 overflow-y-auto">
				<Dialog.Title className="font-bold text-xl">
					{caseData ? "소송 수정" : "소송 등록"}
				</Dialog.Title>

				<Dialog.Close asChild>
					<Button
						variant="ghost"
						color="gray"
						style={{ position: "absolute", top: 24, right: 24 }}
					>
						<Cross2Icon />
					</Button>
				</Dialog.Close>

				<Box className="py-2 text-md">
					<form onSubmit={handleSubmit(onSubmit)}>
						<Flex direction="column" gap="4">
							<DynamicSelect
								label="카테고리"
								placeholder="카테고리를 선택하세요"
								options={CASE_CATEGORIES.map((cat) => ({ label: cat, value: cat }))}
								value={categoryWatch}
								onChange={(value) => setValue("category", value)}
							/>

							<div className="flex gap-2">
								<DynamicSelect
									label="도시"
									placeholder="도시를 선택하세요"
									options={COURT_CITIES.map((city) => ({ label: city, value: city }))}
									value={cityWatch}
									onChange={(value) => setValue("city", value)}
								/>

								<DynamicSelect
									label="법원"
									placeholder="법원을 선택하세요"
									options={filteredCourts.map((court) => ({
										label: court.name,
										value: court.name,
									}))}
									value={watch("court_name")}
									onChange={(value) => setValue("court_name", value)}
								/>
							</div>

							<div className="flex gap-2">
								<Box className="flex-1">
									<Text>사건 연도</Text>
									<input
										type="number"
										{...register("case_year")}
										placeholder="예) 2025"
										className="w-full mt-1 p-2 border rounded border-gray-6"
									/>
								</Box>

								<DynamicSelect
									label="사건 유형"
									placeholder="사건 유형을 선택하세요"
									options={filteredCaseTypes.map((type) => ({
										label: type.name,
										value: type.name,
									}))}
									value={watch("case_type")}
									onChange={(value) => setValue("case_type", value)}
								/>

							</div>

							<div className="flex gap-2">

								<Box className="flex-1">
									<Text>사건 번호</Text>
									<input
										type="number"
										{...register("case_number")}
										className="w-full mt-1 p-2 border rounded border-gray-6"
										placeholder="예) 1234"
									/>
								</Box>

								<Box className="flex-1">
									<Text>사건 세부</Text>
									<input
										type="text"
										{...register("case_subject")}
										placeholder="예) 손해배상(기)"
										className="w-full mt-1 p-2 border rounded border-gray-6"
									/>
								</Box>

							</div>
							<DynamicSelect
								label="의뢰인 역할"
								placeholder="역할을 선택하세요"
								options={clientRoles.map((role) => ({ label: role, value: role }))}
								value={watch("client_role")}
								onChange={(value) => setValue("client_role", value)}
							/>

							<Box>
								<Text>소송 설명</Text>
								<textarea
									{...register("description")}
									className="w-full mt-1 p-2 border rounded border-gray-6"
								/>
							</Box>

							<Flex justify="end" gap="2">
								{caseData &&
									<Button type="button" color="red" variant="soft" onClick={handleDelete}>삭제</Button>
								}

								<Button variant="soft" color="gray" onClick={onClose}>
									취소
								</Button>
								<Button variant="solid" type="submit">
									저장
								</Button>
							</Flex>
						</Flex>
					</form>
				</Box>
			</Dialog.Content>
		</Dialog.Root>
	);
};

export default CaseForm;

