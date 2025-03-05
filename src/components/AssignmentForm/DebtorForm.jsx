"use client";

import React, { useState, useEffect } from "react";
import { Box, Flex, Button, Text } from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";
import InputMask from "react-input-mask";

export default function DebtorForm({
  initialData,
  onOpenChange, // 상위 컴포넌트에서 받은 "열고/닫기" 제어함수
  onSubmit,
}) {
  // 입력 필드
  const [formData, setFormData] = useState({
    name: "",
    registration_number: "",
    phone_number: "",
    address: "",
    workplace_name: "",
    workplace_address: "",
  });

  // 에러 상태
  const [errors, setErrors] = useState({});

  // 만약 수정 모드라면, initialData 반영
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        registration_number: initialData.registration_number || "",
        phone_number: initialData.phone_number || "",
        address: initialData.address || "",
        workplace_name: initialData.workplace_name || "",
        workplace_address: initialData.workplace_address || "",
      });
    }
  }, [initialData]);

  // 유효성 검증
  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "이름은 필수입니다.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 서브밋
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    // 부모에 formData 넘기기
    onSubmit(formData);
  };

  // 입력값 핸들러
  const handleChange = (fieldName, value) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  return (
    <Box
      // CreditorForm 처럼 단순 Box로 감싸기
      style={{
        border: "1px solid var(--gray-6)",
        borderRadius: "4px",
        padding: "1rem",
        marginTop: "1rem",
        backgroundColor: "var(--gray-1)",
      }}
    >
      <Flex justify="between" align="center" mb="3">
        <Text size="4" weight="bold">
          {initialData ? "채무자 수정" : "채무자 추가"}
        </Text>
        {/* 닫기 버튼 */}
        <Button variant="ghost" color="gray" onClick={() => onOpenChange(false)}>
          <Cross2Icon width={20} height={20} />
        </Button>
      </Flex>

      <form onSubmit={handleSubmit}>
        {/* 이름 */}
        <Box mb="3">
          <Text size="2" color="gray" className="mb-1">
            이름 *
          </Text>
          <input
            name="name"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className="
              w-full p-2
              border border-gray-6
              rounded
              text-gray-12
              focus:outline-none focus:border-gray-8
            "
          />
          {errors.name && (
            <Text color="red" size="2">
              {errors.name}
            </Text>
          )}
        </Box>

        {/* 주민등록번호 */}
        <Box mb="3">
          <Text size="2" color="gray" className="mb-1">
            주민등록번호
          </Text>
          <InputMask
            mask="999999-9999999"
            maskChar={null}
            value={formData.registration_number}
            onChange={(e) => handleChange("registration_number", e.target.value)}
          >
            {(inputProps) => (
              <input
                {...inputProps}
                className="
                  w-full p-2
                  border border-gray-6
                  rounded
                  text-gray-12
                  focus:outline-none focus:border-gray-8
                "
              />
            )}
          </InputMask>
        </Box>

        {/* 전화번호 */}
        <Box mb="3">
          <Text size="2" color="gray" className="mb-1">
            전화번호
          </Text>
          <InputMask
            mask="999-9999-9999"
            maskChar={null}
            value={formData.phone_number}
            onChange={(e) => handleChange("phone_number", e.target.value)}
          >
            {(inputProps) => (
              <input
                {...inputProps}
                className="
                  w-full p-2
                  border border-gray-6
                  rounded
                  text-gray-12
                  focus:outline-none focus:border-gray-8
                "
              />
            )}
          </InputMask>
        </Box>

        {/* 집주소 */}
        <Box mb="3">
          <Text size="2" color="gray" className="mb-1">
            집주소
          </Text>
          <input
            name="address"
            value={formData.address}
            onChange={(e) => handleChange("address", e.target.value)}
            className="
              w-full p-2
              border border-gray-6
              rounded
              text-gray-12
              focus:outline-none focus:border-gray-8
            "
          />
        </Box>

        {/* 직장이름 */}
        <Box mb="3">
          <Text size="2" color="gray" className="mb-1">
            직장이름
          </Text>
          <input
            name="workplace_name"
            value={formData.workplace_name}
            onChange={(e) => handleChange("workplace_name", e.target.value)}
            className="
              w-full p-2
              border border-gray-6
              rounded
              text-gray-12
              focus:outline-none focus:border-gray-8
            "
          />
        </Box>

        {/* 직장주소 */}
        <Box mb="3">
          <Text size="2" color="gray" className="mb-1">
            직장주소
          </Text>
          <input
            name="workplace_address"
            value={formData.workplace_address}
            onChange={(e) => handleChange("workplace_address", e.target.value)}
            className="
              w-full p-2
              border border-gray-6
              rounded
              text-gray-12
              focus:outline-none focus:border-gray-8
            "
          />
        </Box>

        <Flex justify="end" gap="2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            닫기
          </Button>
          <Button type="submit" variant="solid">
            {initialData ? "수정" : "추가"}
          </Button>
        </Flex>
      </form>
    </Box>
  );
}
