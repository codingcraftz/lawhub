"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons";
import { Box, Button, Flex, Text } from "@radix-ui/themes";

const Hero = ({ user, onLogout }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (!user) return null;

  const { name } = user;

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  return (
    <Box className="relative">
      {/* Profile Display */}
      <Flex
        align="center"
        gap="3"
        className="
					cursor-pointer
					hover:opacity-90
					transition-opacity
					bg-gray-2
					rounded-full
					shadow-md
					px-3 py-2
					border border-gray-6
				"
        onClick={toggleDropdown}
      >
        <Text className="font-semibold text-gray-12">{name}</Text>
        {dropdownOpen ? (
          <ChevronUpIcon width={20} height={20} />
        ) : (
          <ChevronDownIcon width={20} height={20} />
        )}
      </Flex>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <Box
          className="
						absolute right-0 mt-2
						bg-gray-2 border border-gray-6
						rounded-lg shadow-xl
						py-2 w-48 z-50
						overflow-hidden
					"
        >
          <Link href="/my-page" onClick={() => setDropdownOpen(false)}>
            <Flex
              align="center"
              px="3"
              py="2"
              className="
								hover:bg-gray-3
								transition
								cursor-pointer
								justify-center
								rounded
							"
            >
              <Text size="2" className="text-gray-12">
                마이페이지
              </Text>
            </Flex>
          </Link>
          <Button
            variant="ghost"
            color="red"
            className="
							w-full text-left px-3 py-2
							hover:bg-gray-3
							transition
						"
            onClick={() => {
              onLogout();
              setDropdownOpen(false);
            }}
          >
            로그아웃
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default Hero;
