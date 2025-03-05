"use client";

import React, { useState, useEffect } from "react";
import { Box, Flex, Button, Text } from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";
import InputMask from "react-input-mask";

export default function CreditorForm({ initialData, onOpenChange, onSubmit }) {
  const [formData, setFormData] = useState({
    name: "",
    phone_number: "",
    address: "",
    registration_number: "",
    workplace_name: "",
    workplace_address: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        phone_number: initialData.phone_number || "",
        address: initialData.address || "",
        registration_number: initialData.registration_number || "",
        workplace_name: initialData.workplace_name || "",
        workplace_address: initialData.workplace_address || "",
      });
    }
  }, [initialData]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "이름은 필수입니다.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Box
      style={{
        marginTop: "1rem",
        padding: "1rem",
        border: "1px solid var(--gray-6)",
        borderRadius: 6,
        backgroundColor: "var(--gray-1)",
      }}
    >
      <Flex justify="between" align="center" mb="3">
        <Text size="4" weight="bold">
          {initialData ? "채권자 수정" : "채권자 추가"}
        </Text>
        <Button variant="ghost" color="gray" onClick={() => onOpenChange(false)}>
          <Cross2Icon width={20} height={20} />
        </Button>
      </Flex>

      <form onSubmit={handleSubmit}>
        {/* 이름 */}
        <Box mb="3">
          <Text size="2" color="gray">
            이름 *
          </Text>
          <input
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className="w-full p-2 border border-gray-6 rounded text-gray-12
                       focus:outline-none focus:border-gray-8"
          />
          {errors.name && (
            <Text color="red" size="2">
              {errors.name}
            </Text>
          )}
        </Box>

        {/* 주민등록번호 */}
        <Box mb="3">
          <Text size="2" color="gray">
            주민등록번호
          </Text>
          <InputMask
            mask="999999-9999999"
            maskChar={null}
            value={formData.registration_number}
            onChange={(e) =>
              handleChange("registration_number", e.target.value)
            }
          >
            {(inputProps) => (
              <input
                {...inputProps}
                className="w-full p-2 border border-gray-6 rounded text-gray-12
                           focus:outline-none focus:border-gray-8"
              />
            )}
          </InputMask>
        </Box>

        {/* 전화번호 */}
        <Box mb="3">
          <Text size="2" color="gray">
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
                className="w-full p-2 border border-gray-6 rounded text-gray-12
                           focus:outline-none focus:border-gray-8"
              />
            )}
          </InputMask>
        </Box>

        {/* 주소 */}
        <Box mb="3">
          <Text size="2" color="gray">
            집주소
          </Text>
          <input
            value={formData.address}
            onChange={(e) => handleChange("address", e.target.value)}
            className="w-full p-2 border border-gray-6 rounded text-gray-12
                       focus:outline-none focus:border-gray-8"
          />
        </Box>

        {/* 직장이름 */}
        <Box mb="3">
          <Text size="2" color="gray">
            직장이름
          </Text>
          <input
            value={formData.workplace_name}
            onChange={(e) => handleChange("workplace_name", e.target.value)}
            className="w-full p-2 border border-gray-6 rounded text-gray-12
                       focus:outline-none focus:border-gray-8"
          />
        </Box>

        {/* 직장주소 */}
        <Box mb="3">
          <Text size="2" color="gray">
            직장주소
          </Text>
          <input
            value={formData.workplace_address}
            onChange={(e) => handleChange("workplace_address", e.target.value)}
            className="w-full p-2 border border-gray-6 rounded text-gray-12
                       focus:outline-none focus:border-gray-8"
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
