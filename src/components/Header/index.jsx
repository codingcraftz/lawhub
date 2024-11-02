// src/components/Header/index.jsx

"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/utils/supabase";
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { Flex, Button, Text, Avatar, Box } from "@radix-ui/themes";
import { useTheme } from "next-themes";
import NotificationDropdown from "./NotificationDropdown";

const NAV_LIST = [
  { title: "사건 관리", path: "/case-management", roles: ["admin", "staff"] },
  { title: "일정 관리", path: "/todos", roles: ["admin", "staff"] },
  { title: "나의 사건", path: "/client/cases", roles: ["client"] },
  {
    title: "공지 및 피드백",
    path: "/updates",
    roles: ["admin", "staff", "client"],
  },
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
    setUser(null);
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
            {NAV_LIST.filter((nav) => nav.roles.includes(user?.role)).map(
              (nav) => (
                <Link href={nav.path} key={nav.path}>
                  <Button variant="ghost" color="gray">
                    {nav.title}
                  </Button>
                </Link>
              ),
            )}
            {user && user.role === "admin" && (
              <Link href="/admin">
                <Button variant="ghost" color="red">
                  관리자
                </Button>
              </Link>
            )}
          </Flex>
        </Flex>

        <Flex align="center" gap="4">
          <Button variant="ghost" onClick={toggleTheme}>
            {theme === "light" ? <MoonIcon /> : <SunIcon />}
          </Button>
          {user && (user.role === "admin" || user.role === "staff") && (
            <NotificationDropdown />
          )}
          {user ? (
            <Flex gap="1rem" align="center">
              <Avatar
                src={user.avatar_url}
                fallback={user.email ? user.email[0].toUpperCase() : "U"}
                size="2"
                radius="full"
              />
              <Button onClick={handleLogout}>로그아웃</Button>
            </Flex>
          ) : (
            <Flex gap="1rem">
              <Link href="/login">
                <Button>로그인</Button>
              </Link>
              <Link href="/signup">
                <Button>회원가입</Button>
              </Link>
            </Flex>
          )}
        </Flex>
      </Flex>
    </Box>
  );
};

export default Header;
