"use client";

import { Box, Button, Flex, Text, Theme } from "@radix-ui/themes";

const OpponentForm = ({ onOpenChange, onSubmit, register, errors }) => {
  return (
    <form onSubmit={onSubmit}>
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
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          취소
        </Button>
        <Button type="submit">상대방 추가</Button>
      </Flex>
    </form>
  );
};
export default OpponentForm;
