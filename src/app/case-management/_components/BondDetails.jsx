// src/app/case-mangement/_components/BondDetails.jsx

"use client";

import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Box, Flex, Button, Text } from "@radix-ui/themes";
import { supabase } from "@/utils/supabase";
import { Cross2Icon } from "@radix-ui/react-icons";
import BondForm from "./BonForm";
import LoadingSpinner from "@/components/LoadingSpinner";

const BondDetails = ({ caseId, onClose, isAdmin, onSuccess }) => {
  const [bondData, setBondData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);

  const fetchBondData = async () => {
    try {
      const { data, error } = await supabase
        .from("bonds")
        .select("*")
        .eq("case_id", caseId)
        .single();

      if (error) throw error;
      setBondData(data);
    } catch (error) {
      console.error("Error fetching bond data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteBond = async () => {
    if (!bondData?.id) {
      alert("삭제할 채권 정보가 없습니다.");
      return;
    }

    const confirmDelete = confirm("채권 정보를 삭제하시겠습니까?");
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from("bonds")
        .delete()
        .eq("id", bondData.id);

      if (error) throw error;
      alert("채권 정보가 삭제되었습니다.");
      setBondData(null); // 삭제 후 데이터를 초기화
    } catch (error) {
      console.error("Error deleting bond information:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    fetchBondData();
  }, [caseId]);

  const getDate = (date) => (date === "dynamic" ? new Date() : new Date(date));

  const formatDate = (date) => {
    if (!date) return ""; // 값이 없을 경우 "N/A"로 표시
    const parsedDate = getDate(date);
    return parsedDate.toISOString().split("T")[0];
  };

  const formattedEndDate = (date) => {
    if (!date) return "미등록"; // 값이 없을 경우 "N/A"로 표시

    return date === "dynamic" ? formatDate(new Date()) : formatDate(date);
  };

  const calculateInterest = (principal, rate, startDate, endDate) => {
    if (!startDate || !endDate || isNaN(principal) || isNaN(rate)) return 0;

    const start = getDate(startDate).getTime();
    const end = getDate(endDate).getTime();
    const durationInYears = (end - start) / (1000 * 60 * 60 * 24 * 365.25);

    return principal * (rate / 100) * Math.max(durationInYears, 0);
  };

  const handleSave = () => {
    fetchBondData();
    onSuccess();
    setIsEditMode(false);
  };

  if (isLoading) {
    return (
      <Dialog.Root>
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-75 z-10" />
        <Dialog.Content className="fixed bg-gray-3 left-1/2 top-1/2 max-h-[85vh] min-w-[420px] max-w-[650px] -translate-x-1/2 -translate-y-1/2 rounded-md p-[25px] shadow focus:outline-none data-[state=open]:animate-contentShow z-20">
          <LoadingSpinner />
        </Dialog.Content>
      </Dialog.Root>
    );
  }

  if (!bondData) {
    return (
      <>
        {isEditMode ? (
          <BondForm
            caseId={caseId}
            onSuccess={handleSave}
            onClose={() => setIsEditMode(false)}
          />
        ) : (
          <Dialog.Root open={true} onOpenChange={onClose}>
            <Dialog.Overlay className="fixed inset-0 bg-black opacity-75 z-10" />
            <Dialog.Content className="fixed bg-gray-3 left-1/2 top-1/2 max-h-[85vh] min-w-[420px] max-w-[650px] -translate-x-1/2 -translate-y-1/2 rounded-md p-[25px] shadow focus:outline-none data-[state=open]:animate-contentShow z-20">
              <Dialog.Title className="font-bold text-xl">제목</Dialog.Title>
              <p className="py-4">등록된 채권 정보가 없습니다.</p>
              <Flex justify="end" gap="2">
                {isAdmin && (
                  <Button onClick={() => setIsEditMode(true)}>
                    채권 정보 추가
                  </Button>
                )}
                <Button onClick={onClose}>확인</Button>
              </Flex>
            </Dialog.Content>
          </Dialog.Root>
        )}
      </>
    );
  }

  const totalInterest1 = Math.floor(
    calculateInterest(
      bondData.principal,
      bondData.interest_1_rate,
      bondData.interest_1_start_date,
      bondData.interest_1_end_date,
    ),
  );

  const totalInterest2 = Math.floor(
    calculateInterest(
      bondData.principal,
      bondData.interest_2_rate,
      bondData.interest_2_start_date,
      bondData.interest_2_end_date,
    ),
  );

  const totalExpenses = bondData.expenses
    ? bondData.expenses.reduce(
        (sum, expense) => sum + parseFloat(expense.amount || 0),
        0,
      )
    : 0;

  const totalAmount = Math.floor(
    parseFloat(bondData.principal || 0) +
      totalInterest1 +
      totalInterest2 +
      totalExpenses,
  );

  return (
    <Dialog.Root open={true} onOpenChange={onClose}>
      <Dialog.Overlay className="fixed inset-0 bg-black opacity-75" />
      <Dialog.Content className="fixed bg-gray-3 left-1/2 top-1/2 max-h-[85vh] min-w-[420px] max-w-[650px] -translate-x-1/2 -translate-y-1/2 rounded-md p-[25px] shadow focus:outline-none data-[state=open]:animate-contentShow">
        <Dialog.Title className="font-bold text-xl pb-1">
          채권 정보
        </Dialog.Title>
        {isEditMode ? (
          <BondForm
            caseId={caseId}
            bondData={bondData || {}}
            onSuccess={handleSave}
            onClose={() => setIsEditMode(false)}
          />
        ) : (
          <>
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                color="gray"
                style={{ position: "absolute", top: 24, right: 24 }}
              >
                <Cross2Icon width={25} height={25} />
              </Button>
            </Dialog.Close>
            <Flex direction="column" gap="2">
              <p className="text-sm text-gray-10">
                원리금: <Text>{totalAmount.toLocaleString()}원</Text>
              </p>

              <Flex
                className="text-sm"
                style={{ color: "var(--gray-10)" }}
                gap="5"
              >
                <sapn>
                  원금:{" "}
                  {Math.floor(
                    parseFloat(bondData.principal || 0),
                  ).toLocaleString()}
                  원
                </sapn>
                {totalInterest1 + totalInterest2 > 0 && (
                  <sapn>
                    이자: {(totalInterest1 + totalInterest2).toLocaleString()}원
                  </sapn>
                )}
                {totalExpenses > 0 && (
                  <sapn>비용: {totalExpenses.toLocaleString()}원</sapn>
                )}
              </Flex>

              <Box>
                <strong>
                  1차 이자{"  "}
                  <Text className="font-normal text-sm">
                    ({formatDate(bondData.interest_1_start_date)} ~{" "}
                    {formattedEndDate(bondData.interest_1_end_date)})
                  </Text>
                </strong>
                <ul>
                  <li>이자율: {bondData.interest_1_rate}%</li>
                  <li>이자 총액: {totalInterest1.toLocaleString()} 원</li>
                </ul>
              </Box>
              <Box>
                <strong>
                  2차 이자{"  "}
                  <Text className="font-normal text-sm">
                    ({formatDate(bondData.interest_2_start_date)} ~{" "}
                    {formattedEndDate(bondData.interest_2_end_date)})
                  </Text>
                </strong>
                <ul>
                  <li>이자율: {bondData.interest_2_rate}%</li>
                  <li>이자 총액: {totalInterest2.toLocaleString()} 원</li>
                </ul>
              </Box>
              <Box>
                <strong className="font-semibold">비용</strong>
                {bondData.expenses && bondData.expenses.length > 0 ? (
                  <>
                    <ul>
                      {bondData.expenses.map((expense, index) => (
                        <li key={index}>
                          {expense.item}:{" "}
                          {Math.floor(
                            parseFloat(expense.amount),
                          ).toLocaleString()}{" "}
                          원
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <Box>비용 항목이 없습니다.</Box>
                )}
              </Box>
              {isAdmin ? (
                <Flex justify="between" mt="3">
                  <Button variant="soft" color="red" onClick={deleteBond}>
                    삭제
                  </Button>
                  <Flex gap="2">
                    <Button variant="soft" onClick={() => setIsEditMode(true)}>
                      수정
                    </Button>
                    <Button variant="soft" onClick={onClose}>
                      확인
                    </Button>
                  </Flex>
                </Flex>
              ) : (
                <Flex justify="end" mt="3">
                  <Button variant="soft" onClick={onClose}>
                    확인
                  </Button>
                </Flex>
              )}
            </Flex>
          </>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default BondDetails;
