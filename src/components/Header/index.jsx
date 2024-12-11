// src/components/Header/index.jsx

"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/utils/supabase";
import { MoonIcon, SunIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { Flex, Button, Text, Avatar, Box, Separator } from "@radix-ui/themes";
import { useTheme } from "next-themes";
import * as HoverCard from "@radix-ui/react-hover-card"; // HoverCard import
import NotificationDropdown from "./NotificationDropdown";

const NAV_LIST = [
  {
    title: "사건 관리",
    path: "/case-management",
    roles: ["admin", "staff"],
    // subItems: [
    //   { title: "소송관리", path: "/case-management/litigation" },
    //   { title: "채권관리", path: "/case-management/debt" },
    // ],
  },
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
    <Box px="6" py="5" style={{ backgroundColor: "var(--gray-3)" }}>
      <Flex justify="between" align="center">
        <Flex align="center" gap="4" style={{ alignItems: "center" }}>
          <Link href="/">
            <Text size="5" weight="bold">
              LawHub
            </Text>
          </Link>
          <Flex gap="1rem" align="center" style={{ alignItems: "center" }}>
            {NAV_LIST.filter((nav) => nav.roles.includes(user?.role)).map(
              (nav) => {
                if (nav.subItems) {
                  return (
                    <HoverCard.Root key={nav.title}>
                      <HoverCard.Trigger asChild>
                        <Link href={nav.path}>
                          <Button
                            variant="ghost"
                            color="gray"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              cursor: "pointer",
                            }}
                          >
                            {nav.title}
                          </Button>
                        </Link>
                      </HoverCard.Trigger>
                      <HoverCard.Content
                        side="bottom"
                        sideOffset={5}
                        style={{
                          backgroundColor: "var(--gray-2)",
                          borderRadius: "8px",
                          boxShadow: "0px 2px 10px rgba(0,0,0,0.15)",
                          padding: "0.5rem 0",
                          minWidth: "180px",
                          zIndex: 1000,
                        }}
                      >
                        {nav.subItems.map((sub) => (
                          <Link
                            href={sub.path}
                            key={sub.path}
                            style={{ textDecoration: "none" }}
                          >
                            <Flex
                              align="center"
                              justify="between"
                              px="3"
                              py="2"
                              style={{ cursor: "pointer" }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  "var(--gray-3)")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  "var(--gray-2)")
                              }
                            >
                              <Text size="2">{sub.title}</Text>
                              <ChevronRightIcon />
                            </Flex>
                          </Link>
                        ))}
                      </HoverCard.Content>
                    </HoverCard.Root>
                  );
                } else {
                  // 하위 메뉴가 없는 경우 기본 Link
                  return (
                    <Link href={nav.path} key={nav.path}>
                      <Button
                        variant="ghost"
                        color="gray"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          cursor: "pointer",
                        }}
                      >
                        {nav.title}
                      </Button>
                    </Link>
                  );
                }
              },
            )}
            {user && user.role === "admin" && (
              <Link href="/admin">
                <Button
                  variant="ghost"
                  color="red"
                  style={{
                    display: "flex",
                    alignItems: "center",
                  }}
                >
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
            <HoverCard.Root>
              <HoverCard.Trigger asChild>
                <Link href="/my-page">
                  <Box style={{ cursor: "pointer" }}>
                    <Avatar
                      src={user.avatar_url}
                      fallback={user.email ? user.email[0].toUpperCase() : "U"}
                      size="2"
                      radius="full"
                    />
                  </Box>
                </Link>
              </HoverCard.Trigger>
              <HoverCard.Content
                side="bottom"
                sideOffset={10}
                style={{
                  backgroundColor: "var(--gray-2)",
                  borderRadius: "8px",
                  boxShadow: "0px 2px 10px rgba(0,0,0,0.15)",
                  minWidth: "160px",
                  padding: "0.5rem 0",
                  zIndex: 1000,
                }}
              >
                <Link href="/my-page" style={{ textDecoration: "none" }}>
                  <Flex
                    px="3"
                    py="2"
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "var(--gray-3)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "var(--gray-2)")
                    }
                    style={{ cursor: "pointer" }}
                  >
                    <Text size="2">마이페이지</Text>
                  </Flex>
                </Link>
                <Separator />
                <Flex
                  px="3"
                  py="2"
                  style={{ cursor: "pointer" }}
                  onClick={handleLogout}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "var(--gray-3)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "var(--gray-2)")
                  }
                >
                  <Text size="2">로그아웃</Text>
                </Flex>
              </HoverCard.Content>
            </HoverCard.Root>
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
