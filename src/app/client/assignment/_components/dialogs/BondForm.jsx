"use client";

import React, { useState } from "react";
import { Box, Flex, Button, Text, Switch } from "@radix-ui/themes";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { supabase } from "@/utils/supabase";
import CustomDatePicker from "@/components/CustomDatePicker";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";

const BondForm = ({ bondData, onSuccess, open, onOpenChange, assignmentId }) => {

	const [isSubmitting, setIsSubmitting] = useState(false);
	const {
		control,
		register,
		handleSubmit,
		watch,
		formState: { errors, isValid },
	} = useForm({
		defaultValues: {
			principal: bondData?.principal || "",
			interest1: {
				start_date: bondData?.interest_1_start_date
					? new Date(bondData.interest_1_start_date)
					: null,
				end_date:
					bondData?.interest_1_end_date === "dynamic"
						? null
						: bondData?.interest_1_end_date
							? new Date(bondData.interest_1_end_date)
							: null,
				rate: bondData?.interest_1_rate || "",
				dynamic_end: bondData?.interest_1_end_date === "dynamic" || false,
			},
			interest2: {
				start_date: bondData?.interest_2_start_date
					? new Date(bondData.interest_2_start_date)
					: null,
				end_date:
					bondData?.interest_2_end_date === "dynamic"
						? null
						: bondData?.interest_2_end_date
							? new Date(bondData.interest_2_end_date)
							: null,
				rate: bondData?.interest_2_rate || "",
				dynamic_end: bondData?.interest_2_end_date === "dynamic" || false,
			},
			expenses: bondData?.expenses || [],
		},
	});

	const { fields, append, remove } = useFieldArray({
		control,
		name: "expenses",
	});

	const validateExpenses = (expenses) => {
		return expenses.every(
			(expense) => expense.item.trim() !== "" && expense.amount > 0
		);
	};

	const onSubmit = async (data) => {

		if (!validateExpenses(data.expenses)) {
			alert("비용 항목과 금액을 정확히 입력해주세요.");
			return;
		}
		if (isSubmitting) return;
		setIsSubmitting(true);

		try {
			const bondPayload = {
				assignment_id: assignmentId,
				principal: parseFloat(data.principal),
				interest_1_start_date: data.interest1.start_date || null,
				interest_1_end_date: data.interest1.dynamic_end
					? "dynamic"
					: data.interest1.end_date || null,
				interest_1_rate: parseFloat(data.interest1.rate),
				interest_2_start_date: data.interest2.start_date || null,
				interest_2_end_date: data.interest2.dynamic_end
					? "dynamic"
					: data.interest2.end_date || null,
				interest_2_rate: parseFloat(data.interest2.rate),
				expenses: data.expenses,
			};

			if (!data.interest1.dynamic_end && !data.interest1.end_date) {
				bondPayload.interest_1_end_date = null;
			}
			if (!data.interest2.dynamic_end && !data.interest2.end_date) {
				bondPayload.interest_2_end_date = null;
			}

			const { error } = bondData
				? await supabase.from("bonds").update(bondPayload).eq("id", bondData.id)
				: await supabase.from("bonds").insert(bondPayload);

			if (error) throw error;
			alert("저장되었습니다.");
			if (onSuccess) onSuccess();
		} catch (error) {
			console.error("Error saving bond information:", error);
			alert("저장 중 오류가 발생했습니다.");
		} finally { setIsSubmitting(false) };
	};

	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Overlay className="fixed inset-0 bg-black opacity-50 z-40" />
			<Dialog.Content
				className="
          fixed
          left-1/2 top-1/2
          max-h-[85vh] min-w-[450px] max-w-[650px]
          -translate-x-1/2 -translate-y-1/2
          rounded-md p-6
          bg-gray-2 border border-gray-6
          shadow-md shadow-gray-7
          text-gray-12
          focus:outline-none
          z-50
          overflow-y-auto
        "
			>
				<Flex justify="between" align="center" className="mb-4">
					<Dialog.Title className="font-bold text-xl">
						채권 정보
					</Dialog.Title>
					<Dialog.Close asChild>
						<Button variant="ghost" color="gray">
							<Cross2Icon width={20} height={20} />
						</Button>
					</Dialog.Close>
				</Flex>

				<form onSubmit={handleSubmit(onSubmit)}>
					<Flex direction="column" gap="4" style={{ maxWidth: "600px", margin: "0 auto" }}>
						{/* 원리금 */}
						<Box>
							<Text size="2" color="gray" className="mb-1">
								원리금(원)
							</Text>
							<input
								type="number"
								placeholder="예) 1000000"
								{...register("principal", {
									required: "원리금을 입력해주세요.",
								})}
								className="
                  w-full p-2 
                  border border-gray-6
                  rounded text-gray-12
                  focus:outline-none focus:border-gray-8
                "
							/>
							{errors.principal && (
								<Text color="red" size="2" className="mt-1">
									{errors.principal.message}
								</Text>
							)}
						</Box>

						{/* 1차 이자 */}
						<Box>
							<Flex justify="between" align="center" className="mb-2">
								<Text className="font-semibold">1차 이자 정보</Text>
								<Controller
									name="interest1.dynamic_end"
									control={control}
									render={({ field }) => (
										<Flex align="center" gap="2">
											<Text size="2" color="gray">
												종기일 미정
											</Text>
											<Switch
												checked={field.value}
												onCheckedChange={field.onChange}
											/>
										</Flex>
									)}
								/>
							</Flex>
							<Flex direction="column" gap="2">
								<Flex align="center" gap="2">
									<Controller
										name="interest1.start_date"
										control={control}
										render={({ field }) => (
											<CustomDatePicker
												selectedDate={field.value}
												onDateChange={field.onChange}
												title="기산일"
											/>
										)}
									/>
									<Text size="2">-</Text>
									<Controller
										name="interest1.end_date"
										control={control}
										render={({ field }) => (
											<CustomDatePicker
												selectedDate={field.value}
												onDateChange={field.onChange}
												title={
													watch("interest1.dynamic_end")
														? "(동적 종기)"
														: "종기일"
												}
												disabled={watch("interest1.dynamic_end")}
											/>
										)}
									/>
								</Flex>
								<Text size="2" color="gray" className="mt-1">
									이자율 (%)
								</Text>
								<Controller
									name="interest1.rate"
									control={control}
									render={({ field }) => (
										<input
											type="number"
											{...field}
											placeholder="예) 5"
											className="
                        w-full p-2
                        border border-gray-6
                        rounded text-gray-12
                        focus:outline-none focus:border-gray-8
                      "
										/>
									)}
								/>
							</Flex>
						</Box>

						{/* 2차 이자 */}
						<Box>
							<Flex justify="between" align="center" className="mb-2">
								<Text className="font-semibold">2차 이자 정보</Text>
								<Controller
									name="interest2.dynamic_end"
									control={control}
									render={({ field }) => (
										<Flex align="center" gap="2">
											<Text size="2" color="gray">
												종기일 미정
											</Text>
											<Switch
												checked={field.value}
												onCheckedChange={field.onChange}
											/>
										</Flex>
									)}
								/>
							</Flex>
							<Flex direction="column" gap="2">
								<Flex align="center" gap="2">
									<Controller
										name="interest2.start_date"
										control={control}
										render={({ field }) => (
											<CustomDatePicker
												selectedDate={field.value}
												onDateChange={field.onChange}
												title="기산일"
											/>
										)}
									/>
									<Text size="2">-</Text>
									<Controller
										name="interest2.end_date"
										control={control}
										render={({ field }) => (
											<CustomDatePicker
												selectedDate={field.value}
												onDateChange={field.onChange}
												title={
													watch("interest2.dynamic_end")
														? "(동적 종기)"
														: "종기일"
												}
												disabled={watch("interest2.dynamic_end")}
											/>
										)}
									/>
								</Flex>
								<Text size="2" color="gray" className="mt-1">
									이자율 (%)
								</Text>
								<Controller
									name="interest2.rate"
									control={control}
									render={({ field }) => (
										<input
											type="number"
											{...field}
											placeholder="예) 15"
											className="
                        w-full p-2
                        border border-gray-6
                        rounded text-gray-12
                        focus:outline-none focus:border-gray-8
                      "
										/>
									)}
								/>
							</Flex>
						</Box>

						{/* 비용 정보 */}
						<Box>
							<Text className="font-semibold mb-2">비용 정보</Text>
							{fields.map((field, index) => (
								<Flex key={field.id} align="center" gap="2" mb="2">
									<input
										type="text"
										placeholder="항목 이름"
										{...register(`expenses.${index}.item`, {
											required: "항목 이름을 입력해주세요.",
										})}
										className="
                      flex-1 p-2
                      border border-gray-6
                      rounded text-gray-12
                      focus:outline-none focus:border-gray-8
                    "
									/>
									<input
										type="number"
										placeholder="금액"
										{...register(`expenses.${index}.amount`, {
											required: "금액을 입력해주세요.",
											valueAsNumber: true,
											validate: (value) => value > 0 || "0보다 큰 값을 입력해주세요.",
										})}
										className="
                      flex-1 p-2
                      border border-gray-6
                      rounded text-gray-12
                      focus:outline-none focus:border-gray-8
                    "
									/>
									<Button
										variant="ghost"
										color="red"
										onClick={() => remove(index)}
									>
										삭제
									</Button>
								</Flex>
							))}
							<Button
								variant="soft"
								onClick={() => append({ item: "", amount: 0 })}
							>
								항목 추가
							</Button>
						</Box>

						{/* 버튼 */}
						<Flex justify="end" gap="2" mt="4">
							<Button
								variant="soft"
								color="gray"
								type="button"
								onClick={() => onOpenChange(false)}
							>
								닫기
							</Button>
							<Button variant="solid" type="submit" disabled={!isValid || isSubmitting}>
								{isSubmitting ? "저장 중..." : "저장"}
							</Button>
						</Flex>
					</Flex>
				</form>
			</Dialog.Content>
		</Dialog.Root>
	);
};

export default BondForm;

