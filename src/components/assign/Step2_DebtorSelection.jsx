"use client";

import React, { useState } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Flex, Button, Text } from "@radix-ui/themes";
import DebtorForm from "./DebtorForm";

const formatPhone = (phone) =>
  phone ? phone.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3") : "없음";

const Step2_DebtorSelection = ({
  selectedDebtors,
  setSelectedDebtors,
  removeDebtor,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAddingDebtor, setIsAddingDebtor] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("debtors")
      .select("*")
      .ilike("name", `%${searchTerm}%`);

    if (error) {
      console.error("채무자 검색 오류:", error);
    } else {
      setSearchResults(data || []);
    }
    setLoading(false);
  };

  // Enter 키 검색
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleAddDebtor = (debtor) => {
    if (!selectedDebtors.some((d) => d.id === debtor.id)) {
      setSelectedDebtors([...selectedDebtors, debtor]);
    }
  };

  // DebtorForm 제출 핸들러
  const handleAddNewDebtor = async (newDebtorData) => {
    try {
      const { data, error } = await supabase
        .from("debtors")
        .insert([newDebtorData])
        .select("*");

      if (error) {
        console.error("채무자 추가 오류:", error);
        alert("채무자 추가 중 오류가 발생했습니다.");
        return;
      }

      // 새 채무자를 자동 선택 목록에 추가
      if (data && data.length > 0) {
        setSelectedDebtors([...selectedDebtors, data[0]]);
      }
      setIsAddingDebtor(false);
    } catch (err) {
      console.error("채무자 추가 오류:", err);
      alert("채무자 추가 중 오류가 발생했습니다.");
    }
  };

  return (
    <>
      {isAddingDebtor ? (
        // 1) 채무자 신규 추가 폼 표시
        <DebtorForm
          onOpenChange={setIsAddingDebtor}
          onSubmit={handleAddNewDebtor}
        />
      ) : (
        // 2) 검색 UI
        <>
          <Flex className="items-center" gap="2" mb="2">
            <input
              type="text"
              placeholder="채무자 이름 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyPress}
              style={{
                flex: 1,
                padding: "0.6rem",
                border: "1px solid var(--gray-6)",
                borderRadius: "var(--radius-1)",
              }}
            />
            <Button onClick={handleSearch} disabled={loading}>
              검색
            </Button>
          </Flex>

          <Box style={{ maxHeight: "200px", overflowY: "auto" }}>
            {searchResults.map((debtor) => (
              <Flex
                key={debtor.id}
                align="center"
                justify="between"
                mt="2"
                style={{
                  borderBottom: "1px solid var(--gray-6)",
                  paddingBottom: 4,
                }}
              >
                <Text style={{ cursor: "pointer" }}>
                  {debtor.name} / {formatPhone(debtor.phone_number)} /{" "}
                  {debtor.address || "주소 없음"}
                </Text>
                <Button
                  variant="soft"
                  color="blue"
                  size="2"
                  onClick={() => handleAddDebtor(debtor)}
                >
                  추가
                </Button>
              </Flex>
            ))}
          </Box>

          {/* 선택된 채무자 목록 */}
          {selectedDebtors?.length > 0 && (
            <Box mt="4">
              <Text size="3" weight="bold" mb="2">
                선택된 채무자:
              </Text>
              <Flex wrap="wrap" gap="2">
                {selectedDebtors.map((debtor) => (
                  <Flex
                    key={debtor.id}
                    align="center"
                    style={{
                      backgroundColor: "var(--gray-2)",
                      borderRadius: 4,
                      padding: "4px 8px",
                    }}
                  >
                    <Text mr="1">{debtor.name}</Text>
                    <Button
                      variant="ghost"
                      color="gray"
                      size="2"
                      onClick={() => removeDebtor(debtor.id)}
                    >
                      <svg
                        fill="none"
                        width="15"
                        height="15"
                        viewBox="0 0 15 15"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M3.5 3.5L11.5 11.5M11.5 3.5L3.5 11.5"
                          stroke="currentColor"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </Button>
                  </Flex>
                ))}
              </Flex>
            </Box>
          )}

          {/* 채무자 신규 추가 버튼 */}
          <Flex justify="end">
            <Button onClick={() => setIsAddingDebtor(true)}>
              채무자 신규 추가
            </Button>
          </Flex>
        </>
      )}
    </>
  );
};

export default Step2_DebtorSelection;
