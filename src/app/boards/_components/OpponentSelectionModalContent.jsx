import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { supabase } from "@/utils/supabase";
import { Box, Flex, Text, Button, Checkbox, Tooltip } from "@radix-ui/themes";

// Validation Schema for opponent
const schema = yup.object().shape({
  name: yup.string().required("이름은 필수입니다"),
  registration_number: yup
    .string()
    .matches(/^\d{13}$/, "주민등록번호는 13자리 숫자여야 합니다")
    .required("주민등록번호는 필수입니다"),
  phone_number: yup
    .string()
    .matches(/^\d{10,11}$/, "전화번호는 10~11자리의 숫자여야 합니다")
    .required("전화번호는 필수입니다"),
  address: yup.string().required("주소는 필수입니다"),
});

const OpponentSelectionModalContent = ({
  selectedOpponents = [],
  setSelectedOpponents,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [allOpponents, setAllOpponents] = useState([]);
  const [filteredOpponents, setFilteredOpponents] = useState([]);
  const [localSelectedOpponents, setLocalSelectedOpponents] = useState([
    ...selectedOpponents,
  ]);
  const [isAddingOpponent, setIsAddingOpponent] = useState(false);

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    control,
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onChange", // Enable validation as user types
  });

  // Fetch opponents from the new `opponents` table
  useEffect(() => {
    const fetchOpponents = async () => {
      const { data, error } = await supabase.from("opponents").select("*");
      if (error) {
        console.error("Error fetching opponents:", error);
      } else {
        setAllOpponents(data || []);
        setFilteredOpponents(data || []);
      }
    };
    fetchOpponents();
  }, []);

  // Filter opponents based on search term
  useEffect(() => {
    if (searchTerm === "") {
      setFilteredOpponents(allOpponents);
    } else {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const filtered = allOpponents.filter((opponent) =>
        opponent.name.toLowerCase().includes(lowerCaseSearchTerm),
      );
      setFilteredOpponents(filtered);
    }
  }, [searchTerm, allOpponents]);

  const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return "없음";
    return phoneNumber.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
  };

  const formatRegistrationNumber = (registrationNumber) => {
    if (!registrationNumber) return "없음";
    return registrationNumber.replace(/(\d{6})(\d{7})/, "$1-$2");
  };

  const handleToggleOpponent = (opponent) => {
    if (localSelectedOpponents.find((o) => o.id === opponent.id)) {
      setLocalSelectedOpponents((prev) =>
        prev.filter((o) => o.id !== opponent.id),
      );
    } else {
      setLocalSelectedOpponents((prev) => [...prev, opponent]);
    }
  };

  const handleSaveSelection = () => {
    setSelectedOpponents(localSelectedOpponents);
    onClose();
  };

  const handleAddNewOpponent = async (data) => {
    try {
      const { data: newOpponentData, error } = await supabase
        .from("opponents") // Insert into opponents table
        .insert([data])
        .select("*");

      if (error) {
        console.error("Error adding opponent:", error);
        alert("상대방 추가 중 오류가 발생했습니다.");
        return;
      }

      // Add new opponent to local state
      setAllOpponents((prev) => [...prev, newOpponentData[0]]);
      setLocalSelectedOpponents((prev) => [...prev, newOpponentData[0]]);
      setIsAddingOpponent(false);
      alert("상대방이 성공적으로 추가되었습니다.");
    } catch (error) {
      console.error("Error adding opponent:", error);
      alert("상대방 추가 중 오류가 발생했습니다.");
    }
  };

  return (
    <Box>
      {!isAddingOpponent ? (
        <>
          {/* 검색 필터 */}
          <input
            type="text"
            placeholder="검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "1rem",
              border: "1px solid var(--gray-6)",
              borderRadius: "var(--radius-1)",
            }}
          />

          {/* 상대방 목록 */}
          <Box mt="3" style={{ maxHeight: "300px", overflowY: "auto" }}>
            {filteredOpponents.map((opponent) => (
              <Flex key={opponent.id} align="center" mt="2">
                <Checkbox
                  checked={
                    !!localSelectedOpponents.find((o) => o.id === opponent.id)
                  }
                  onCheckedChange={() => handleToggleOpponent(opponent)}
                />
                {/* Tooltip showing phone_number, address, and registration_number */}
                <Tooltip
                  content={
                    <Box style={{ padding: "0.5rem", fontSize: "12px" }}>
                      <p>
                        <strong>전화번호:</strong>{" "}
                        {formatPhoneNumber(opponent.phone_number)}
                      </p>
                      <p>
                        <strong>주소:</strong> {opponent.address}
                      </p>
                      <p>
                        <strong>주민등록번호:</strong>{" "}
                        {formatRegistrationNumber(opponent.registration_number)}
                      </p>
                    </Box>
                  }
                >
                  <Text ml="2" style={{ cursor: "pointer" }}>
                    {opponent.name}
                  </Text>
                </Tooltip>
              </Flex>
            ))}
          </Box>

          {/* 상대방 추가 버튼 */}
          <Flex justify="between" mt="4" gap="2">
            <Button onClick={() => setIsAddingOpponent(true)}>
              상대방 추가
            </Button>
            <Flex className="gap-6">
              <Button variant="outline" onClick={onClose}>
                취소
              </Button>
              <Button onClick={handleSaveSelection}>선택 완료</Button>
            </Flex>
          </Flex>
        </>
      ) : (
        <form onSubmit={handleSubmit(handleAddNewOpponent)}>
          <Text>새로운 상대방 추가</Text>
          <Box>
            <input
              name="name"
              placeholder="이름"
              {...register("name")}
              style={{
                width: "100%",
                padding: "0.6rem",
                marginBottom: "0.5rem",
                border: "1px solid var(--gray-6)",
                borderRadius: "var(--radius-1)",
              }}
            />
            <Text color="red">{errors.name?.message}</Text>
          </Box>

          <Box>
            <input
              name="registration_number"
              placeholder="주민등록 번호 (13자리 숫자)"
              {...register("registration_number")}
              style={{
                width: "100%",
                padding: "0.6rem",
                marginBottom: "0.5rem",
                border: "1px solid var(--gray-6)",
                borderRadius: "var(--radius-1)",
              }}
            />
            <Text color="red">{errors.registration_number?.message}</Text>
          </Box>

          <Box>
            <input
              name="address"
              placeholder="주소"
              {...register("address")}
              style={{
                width: "100%",
                padding: "0.6rem",
                marginBottom: "0.5rem",
                border: "1px solid var(--gray-6)",
                borderRadius: "var(--radius-1)",
              }}
            />
            <Text color="red">{errors.address?.message}</Text>
          </Box>

          <Box>
            <input
              name="phone_number"
              placeholder="전화번호 (10~11자리 숫자)"
              {...register("phone_number")}
              style={{
                width: "100%",
                padding: "0.6rem",
                border: "1px solid var(--gray-6)",
                borderRadius: "var(--radius-1)",
              }}
            />
            <Text color="red">{errors.phone_number?.message}</Text>
          </Box>

          <Flex justify="end" mt="3" gap="2">
            <Button
              variant="outline"
              onClick={() => setIsAddingOpponent(false)}
            >
              취소
            </Button>
            <Button type="submit" disabled={!isValid}>
              상대방 추가
            </Button>
          </Flex>
        </form>
      )}
    </Box>
  );
};

export default OpponentSelectionModalContent;
