"use client";
import React from "react";
import { Box, Text, Card } from "@radix-ui/themes";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";

const Logo3D = dynamic(() => import("../components/Logo3D"), { ssr: false });

const HomePage = () => {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('Service worker registered:', registration);
      })
      .catch((error) => {
        console.error('Service worker registration failed:', error);
      });
  });
  return (
    <Box className="w-full min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8">
      <Box className="w-full h-32 sm:h-48 md:h-64 flex items-center justify-center">
        <Logo3D />
      </Box>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center justify-center text-center mt-4 px-4"
      >
        <Text size="6 sm:7 md:8" weight="bold" className="text-center mb-4">
          법률 서비스와 소통을 한곳에서
        </Text>
        <Text size="3 sm:4" className="text-center mb-8">
          고객과의 신뢰를 바탕으로 투명한 법률 서비스를 제공합니다
        </Text>
      </motion.div>

      <Box className="w-full max-w-xl md:max-w-3xl lg:max-w-4xl py-8 sm:py-16">
        <Text size="5 sm:6" weight="bold" className="text-center mb-6 sm:mb-8">
          About
        </Text>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mt-4"
        >
          {[
            {
              title: "우리의 목표",
              description:
                "쉽고 안전하게 법적 문제를 이해하고 해결할 수 있도록 돕는 것",
            },
            {
              title: "우리의 비전",
              description:
                "신뢰를 바탕으로 원활한 법률 서비스와 내부 협업을 통한 효율성 증대",
            },
            {
              title: "우리의 가치",
              description:
                "투명성, 정직, 헌신으로 고객과의 신뢰를 구축하는 법률 솔루션",
            },
          ].map((content, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05 }}
              className="transform transition-transform duration-300"
            >
              <Card
                className="p-4 sm:p-6 rounded-lg shadow-lg hover:shadow-2xl transition-shadow"
                style={{
                  backgroundColor: "var(--slate-3)",
                  border: "2px solid var(--gray-2)",
                }}
              >
                <Box>
                  <Text size="4 sm:5" weight="bold" className="mb-2">
                    {content.title}
                  </Text>
                </Box>
                <Text size="2 sm:3" className="leading-relaxed">
                  {content.description}
                </Text>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </Box>
    </Box>
  );
};

export default HomePage;
