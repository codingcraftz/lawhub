"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { Flex, Button, Text, Avatar, Box, TabNav } from "@radix-ui/themes";
import { useTheme } from "next-themes";

const NAV_LIST = [
  { title: "Boards", path: "boards" },
  { title: "Todos", path: "tods" },
  { title: "Clients", path: "clients" },
];

const Header = () => {
  const [nav, setNav] = useState(0);
  const { user, logout, fetchUserData } = useUser();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <Box px="6" py="5" style={{ backgroundColor: "var(--indigo-3)" }}>
      <Flex justify="between" align="center">
        <Flex align="center" gap="4">
          <Link href="/">
            <Text size="5" weight="bold">
              LawHub
            </Text>
          </Link>
          <Flex gap="1rem" align="center">
            {NAV_LIST.map((nav) => (
              <Link
                href={nav.path}
                key={nav.path}
                style={{ display: "inline-flex" }}
              >
                <Button variant="ghost" color="gray">
                  {nav.title}
                </Button>
              </Link>
            ))}
          </Flex>
        </Flex>

        <Flex align="center" gap="4">
          <Button variant="ghost" onClick={toggleTheme}>
            {theme === "light" ? <MoonIcon /> : <SunIcon />}
          </Button>
          {user ? (
            <Flex gap="1rem">
              <Avatar
                src={user.avatar_url}
                fallback={user.email[0].toUpperCase()}
                size="2"
                radius="full"
                style={{ cursor: "pointer" }}
              />
              <Button onClick={handleLogout}>로그아웃</Button>
            </Flex>
          ) : (
            <Flex gap="1rem">
              <Button color="blue">
                <Link href="/login" style={{ textDecoration: "none" }}>
                  로그인
                </Link>
              </Button>
              <Button>
                <Link href="/signup" style={{ textDecoration: "none" }}>
                  회원가입
                </Link>
              </Button>
            </Flex>
          )}
        </Flex>
      </Flex>
    </Box>
  );
};

export default Header;
