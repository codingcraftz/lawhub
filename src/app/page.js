// src/app/page.jsx

"use client";
import React from "react";
import { Box, Text, Card } from "@radix-ui/themes";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";

const Logo3D = dynamic(() => import("../components/Logo3D"), { ssr: false });

const HomePage = () => {
  return (
    <Box className="w-full min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <Box className="w-full h-64 flex items-center justify-center">
        <Logo3D />
      </Box>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center justify-center text-center mt-4"
      >
        <Text size="8" weight="bold" className="text-center mb-4">
          법률 서비스와 소통을 한곳에서
        </Text>
        <Text size="4" className="text-center mb-8">
          고객과의 신뢰를 바탕으로 투명한 법률 서비스를 제공합니다
        </Text>
      </motion.div>

      <Box className="w-full max-w-4xl py-16">
        <Text size="6" weight="bold" className="text-center mb-8">
          About
        </Text>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-4"
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
                className="p-6 rounded-lg shadow-lg hover:shadow-2xl transition-shadow"
                style={{
                  backgroundColor: "var(--slate-3)",
                  border: "2px solid var(--gray-2)",
                }}
              >
                <Box>
                  <Text size="5" weight="bold" className="mb-2">
                    {content.title}
                  </Text>
                </Box>
                <Text size="3" className="leading-relaxed">
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
