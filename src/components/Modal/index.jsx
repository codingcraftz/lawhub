import React from "react";
import { Box, Flex, Text, IconButton, Button } from "@radix-ui/themes";
import { Cross1Icon } from "@radix-ui/react-icons";

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <Box
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)", // 배경의 투명도 수정
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <Box
        style={{
          backgroundColor: "#1f2937", // 더 부드러운 어두운 색
          borderRadius: "10px",
          padding: "30px", // 패딩 조정
          maxWidth: "400px",
          width: "100%",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)", // 그림자 효과 추가
        }}
      >
        <Flex justify="between" align="center" mb="4">
          <Text size="6" weight="bold" color="white">
            {title}
          </Text>
          <IconButton variant="ghost" onClick={onClose}>
            <Cross1Icon color="white" />
          </IconButton>
        </Flex>
        <Box mb="4">
          <Text color="white">{children}</Text>
        </Box>
      </Box>
    </Box>
  );
};

export default Modal;
