"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/utils/supabase";
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { Flex, Button, Text, Avatar, Box } from "@radix-ui/themes";
import { useTheme } from "next-themes";

const NAV_LIST = [
  { title: "Boards", path: "boards" },
  { title: "Todos", path: "todos" }, // 'tods'에서 'todos'로 수정
  { title: "Clients", path: "clients" },
];

const Header = () => {
  const router = useRouter();
  const { user, setUser } = useUser();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null); // Context의 사용자 정보 초기화
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
                href={`/${nav.path}`}
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
            <Flex gap="1rem" align="center">
              <Avatar
                src={user.avatar_url}
                fallback={user.email ? user.email[0].toUpperCase() : "U"}
                size="2"
                radius="full"
                style={{ cursor: "pointer" }}
              />
              <Button onClick={handleLogout}>로그아웃</Button>
            </Flex>
          ) : (
            <Flex gap="1rem">
              <Button>
                <Link
                  href="/login"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  로그인
                </Link>
              </Button>
              <Button>
                <Link
                  href="/signup"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
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
