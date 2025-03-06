import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Box, Flex, Button, Text } from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";
import InputMask from "react-input-mask";

export default function DebtorForm({
  onOpenChange,
  onSubmit,
  initialData = null,
  isSubmitting,
}) {
  const [formData, setFormData] = useState({
    name: "",
    registration_number: "",
    phone_number: "",
    address: "",
    workplace_name: "",
    workplace_address: "",
  });
  const [errors, setErrors] = useState({});

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

  const handleChangeRaw = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Dialog.Root open={true} onOpenChange={onOpenChange}>
      <Dialog.Overlay className="fixed inset-0 bg-black opacity-50 z-40" />
      <Dialog.Content className="fixed left-1/2 top-1/2 max-h-[85vh] w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-md p-6 bg-gray-2 border border-gray-6 shadow-md shadow-gray-7 focus:outline-none z-50 overflow-y-auto text-gray-12">
        <Flex justify="between" align="center" className="mb-3">
          <Dialog.Title className="font-bold text-xl">
            {initialData ? "채무자 수정" : "채무자 추가"}
          </Dialog.Title>
          <Dialog.Close asChild>
            <Button variant="ghost" color="gray">
              <Cross2Icon width={20} height={20} />
            </Button>
          </Dialog.Close>
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
              onChange={(e) => handleChangeRaw("name", e.target.value)}
              className="w-full p-2 border border-gray-6 rounded text-gray-12 focus:outline-none focus:border-gray-8"
              required
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
              onChange={(e) =>
                handleChangeRaw("registration_number", e.target.value)
              }
            >
              {(inputProps) => (
                <input
                  {...inputProps}
                  className="w-full p-2 border border-gray-6 rounded text-gray-12 focus:outline-none focus:border-gray-8"
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
              onChange={(e) => handleChangeRaw("phone_number", e.target.value)}
            >
              {(inputProps) => (
                <input
                  {...inputProps}
                  className="w-full p-2 border border-gray-6 rounded text-gray-12 focus:outline-none focus:border-gray-8"
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
              onChange={(e) => handleChangeRaw("address", e.target.value)}
              className="w-full p-2 border border-gray-6 rounded text-gray-12 focus:outline-none focus:border-gray-8"
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
              onChange={(e) =>
                handleChangeRaw("workplace_name", e.target.value)
              }
              className="w-full p-2 border border-gray-6 rounded text-gray-12 focus:outline-none focus:border-gray-8"
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
              onChange={(e) =>
                handleChangeRaw("workplace_address", e.target.value)
              }
              className="w-full p-2 border border-gray-6 rounded text-gray-12 focus:outline-none focus:border-gray-8"
            />
          </Box>

          <Flex justify="end" gap="2">
            <Button
              variant="soft"
              color="gray"
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "저장 중..." : "저장"}
            </Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
