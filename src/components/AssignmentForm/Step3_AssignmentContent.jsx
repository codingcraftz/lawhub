"use client";

import React from "react";
import { Box, Flex, Button, Text } from "@radix-ui/themes";

const Step3_AssignmentContent = ({
  register,
  goToPrevStep,
  handleSubmit,
  onSubmit,
  errors,
}) => {
  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Box mb="3">
          <textarea
            {...register("description")}
            placeholder="의뢰 내용을 입력해주세요."
            style={{
              width: "100%",
              minHeight: "120px",
              padding: "0.6rem 0.8rem",
              border: "2px solid var(--gray-6)",
              borderRadius: "var(--radius-1)",
            }}
          />
          {errors?.description && (
            <Text color="red" size="2">
              {errors.description.message}
            </Text>
          )}
        </Box>
        <Flex justify="end" gap="2">
          <Button variant="soft" color="gray" onClick={goToPrevStep}>
            이전
          </Button>
          <Button variant="soft" type="submit">
            등록
          </Button>
        </Flex>
      </form>
    </>
  );
};

export default Step3_AssignmentContent;
