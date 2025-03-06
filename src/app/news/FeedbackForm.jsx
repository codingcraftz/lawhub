"use client";

import React, { useState } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Flex, Text, Button, TextArea } from "@radix-ui/themes";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

const FeedbackForm = ({ user, onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  const schema = yup.object().shape({
    title: yup.string().required("제목을 입력해주세요."),
    message: yup.string().required("피드백 내용을 입력해주세요."),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const submitFeedback = async (data) => {
    setIsSubmitting(true);

    const feedbackData = {
      name: user.name,
      email: user.email,
      title: data.title,
      message: data.message,
    };

    const { error } = await supabase.from("feedback").insert([feedbackData]);

    if (error) {
      console.error("피드백 제출 오류:", error);
      alert("피드백 제출 중 오류가 발생했습니다.");
    } else {
      setFeedbackSent(true);
    }
    setIsSubmitting(false);
  };

  return (
    <Box>
      {feedbackSent ? (
        <Flex direction="column">
          <Text as="p" size="4" color="green">
            피드백이 성공적으로 제출되었습니다! 🔥
          </Text>
          <Text as="p" size="4" color="green" mb="4">
            감사합니다! 🙏
          </Text>
          <Button
            className="ml-full"
            variant="solid"
            color="green"
            onClick={onClose}
          >
            확인
          </Button>
        </Flex>
      ) : (
        <form onSubmit={handleSubmit(submitFeedback)}>
          <Flex direction="column" gap="3">
            <Box>
              <label htmlFor="name">이름</label>
              <input
                id="name"
                name="name"
                value={user.name}
                disabled
                placeholder="이름을 입력해주세요."
                {...register("name")}
                style={{
                  width: "100%",
                  padding: "0.6rem 0.8rem",
                  border: "1px solid var(--gray-6)",
                  borderRadius: "var(--radius-1)",
                }}
              />
              {errors.name && (
                <Text color="red" size="2">
                  {errors.name.message}
                </Text>
              )}
            </Box>

            <Box>
              <label htmlFor="email">이메일</label>
              <input
                id="email"
                type="email"
                name="email"
                disabled
                value={user.email}
                placeholder="이메일을 입력해주세요."
                {...register("email")}
                style={{
                  width: "100%",
                  padding: "0.6rem 0.8rem",
                  border: "1px solid var(--gray-6)",
                  borderRadius: "var(--radius-1)",
                }}
              />
              {errors.email && (
                <Text color="red" size="2">
                  {errors.email.message}
                </Text>
              )}
            </Box>
            <Box>
              <label htmlFor="title">제목</label>
              <input
                id="title"
                name="title"
                placeholder="제목을 입력해주세요."
                {...register("title")}
                style={{
                  width: "100%",
                  padding: "0.6rem 0.8rem",
                  border: "2px solid var(--gray-6)",
                  borderRadius: "var(--radius-1)",
                }}
              />
              {errors.title && (
                <Text color="red" size="2">
                  {errors.title.message}
                </Text>
              )}
            </Box>

            <Box>
              <label htmlFor="message">메시지</label>
              <textarea
                id="message"
                name="message"
                rows="5"
                placeholder="피드백 내용을 입력해주세요."
                {...register("message")}
                style={{
                  width: "100%",
                  padding: "0.6rem 0.8rem",
                  border: "2px solid var(--gray-6)",
                  borderRadius: "var(--radius-1)",
                }}
              />
              {errors.message && (
                <Text color="red" size="2">
                  {errors.message.message}
                </Text>
              )}
            </Box>

            <Flex gap="3" justify="end" mt="4">
              <Button
                type="button"
                variant="soft"
                color="gray"
                onClick={onClose}
              >
                닫기
              </Button>
              <Button
                type="submit"
                variant="solid"
                color="blue"
                disabled={isSubmitting}
              >
                {isSubmitting ? "제출 중..." : "제출"}
              </Button>
            </Flex>
          </Flex>
        </form>
      )}
    </Box>
  );
};

export default FeedbackForm;
