"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import { Box, Button, Flex, Text } from "@radix-ui/themes";

const OpponentForm = ({ open, onOpenChange, onSubmit, register, errors }) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Overlay className="fixed inset-0 bg-black opacity-75 z-30" />
      <Dialog.Content className="fixed bg-gray-3 left-1/2 top-1/2 max-h-[85vh] min-w-[500px] max-w-[650px] -translate-x-1/2 -translate-y-1/2 rounded-md p-[25px] shadow focus:outline-none data-[state=open]:animate-contentShow z-40">
        <Dialog.Close asChild>
          <Button
            variant="ghost"
            color="gray"
            style={{ position: "absolute", top: 8, right: 8 }}
          >
            <Cross2Icon width={25} height={25} />
          </Button>
        </Dialog.Close>
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
            <Button
              variant="outline"
              onClick={() => setIsAddingOpponent(false)}
            >
              취소
            </Button>
            <Button type="submit">상대방 추가</Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
};
export default OpponentForm;
