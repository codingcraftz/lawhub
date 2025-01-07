"use client";

import React, { useState } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Flex, Button, Text } from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";

const formatPhone = (phone) =>
  phone ? phone.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3") : "없음";

const Step1_ClientSelection = ({
  selectedClients,
  setSelectedClients,
  removeClient,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("users")
      .select("id, name, phone_number, birth_date")
      .eq("role", "client")
      .eq("is_active", true)
      .ilike("name", `%${searchTerm}%`); // 부분 검색

    if (error) {
      console.error("의뢰인 검색 오류:", error);
    } else {
      setSearchResults(data || []);
    }
    setLoading(false);
  };

  // Enter 키로 검색
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleAddClient = (client) => {
    if (!selectedClients.some((c) => c.id === client.id)) {
      setSelectedClients([...selectedClients, client]);
    }
  };

  return (
    <>
      {/* 검색창 */}
      <Flex gap="2" mb="2">
        <input
          type="text"
          placeholder="의뢰인 이름 검색"
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

      {/* 검색 결과 목록 */}
      <Box style={{ maxHeight: "200px", overflowY: "auto" }}>
        {searchResults.map((client) => (
          <Flex
            key={client.id}
            align="center"
            justify="between"
            mt="2"
            style={{
              borderBottom: "1px solid var(--gray-6)",
              paddingBottom: 4,
            }}
          >
            <Text style={{ cursor: "pointer" }}>
              {client.name} / 생년월일: {client.birth_date || "미등록"} /{" "}
              {formatPhone(client.phone_number)}
            </Text>
            <Button
              variant="soft"
              color="blue"
              size="2"
              onClick={() => handleAddClient(client)}
            >
              추가
            </Button>
          </Flex>
        ))}
        {selectedClients.length > 0 && (
          <Box mt="4">
            <Text size="3" weight="bold" mb="2">
              선택된 의뢰인:
            </Text>
            <Flex wrap="wrap" gap="2">
              {selectedClients.map((client) => (
                <Flex
                  key={client.id}
                  align="center"
                  style={{
                    backgroundColor: "var(--gray-2)",
                    borderRadius: 4,
                    padding: "4px 8px",
                  }}
                >
                  <Text mr="1">{client.name}</Text>
                  <Button
                    variant="ghost"
                    color="gray"
                    size="2"
                    onClick={() => removeClient(client.id)}
                  >
                    <Cross2Icon width={15} height={15} />
                  </Button>
                </Flex>
              ))}
            </Flex>
          </Box>
        )}
      </Box>
    </>
  );
};

export default Step1_ClientSelection;
