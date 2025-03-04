"use client";
import React, { useState } from "react";
import { Box, Text, Button, Flex } from "@radix-ui/themes";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";
import { FileIcon, ChatBubbleIcon } from "@radix-ui/react-icons";
import LoginDialog from "@/components/Header/LoginDialog";

const Logo3D = dynamic(() => import("../components/Logo3D"), { ssr: false });

const HomePage = () => {
  const { user } = useUser();
  const router = useRouter();
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  const handleActionClick = (path) => {
    if (!user) {
      setShowLoginDialog(true);
      return;
    }
    router.push(path);
  };

  return (
    <Box className="w-full min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full h-32 sm:h-48 md:h-64 flex items-center justify-center"
      >
        <Logo3D />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="flex flex-col items-center justify-center text-center mt-4 px-4"
      >
        <Text size="6 sm:7 md:8" weight="bold" className="text-center mb-4 bg-gradient-to-r from-blue-9 to-violet-9 bg-clip-text text-transparent">
          법률 서비스와 소통을 한곳에서
        </Text>
        <Text size="3 sm:4" className="text-center mb-12 text-gray-11 max-w-2xl">
          고객과의 신뢰를 바탕으로 투명한 법률 서비스를 제공합니다
        </Text>

        <motion.div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1"
          >
            <Button 
              size="4"
              onClick={() => handleActionClick('/chat')}
              className="w-full bg-gradient-to-r from-blue-9 to-violet-9 text-white hover:opacity-90 transition-all shadow-lg hover:shadow-xl"
            >
              <FileIcon width="20" height="20" />
              무료 법률상담
            </Button>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1"
          >
            <Button
              size="4"
              variant="soft"
              onClick={() => handleActionClick('/my-assignments')}
              className="w-full hover:bg-gray-4 transition-all shadow-lg hover:shadow-xl"
            >
              <ChatBubbleIcon width="20" height="20" />
              나의 상담내역
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="mt-16 flex flex-col items-center gap-2"
        >
          <Text size="2" className="text-gray-11">
            24시간 365일
          </Text>
          <Text size="4" weight="bold" className="text-blue-11">
            전문 변호사가 답변해드립니다
          </Text>
        </motion.div>
      </motion.div>

      {showLoginDialog && (
        <LoginDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} />
      )}
    </Box>
  );
};

export default HomePage;
