import React from "react";
import { Box, Flex, Text, IconButton } from "@radix-ui/themes";
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
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <Box
        style={{
          backgroundColor: "var(--slate-7)",
          borderRadius: "8px",
          padding: "20px",
          maxWidth: "600px",
          width: "100%",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        <Flex justify="between" align="center" mb="4">
          <Text size="5" weight="bold">
            {title}
          </Text>
          <IconButton variant="ghost" onClick={onClose}>
            <Cross1Icon />
          </IconButton>
        </Flex>
        {children}
      </Box>
    </Box>
  );
};

export default Modal;
