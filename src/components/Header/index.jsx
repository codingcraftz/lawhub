"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/utils/supabase";
import { MoonIcon, SunIcon, HamburgerMenuIcon, Cross2Icon } from "@radix-ui/react-icons";
import { Flex, Button, Text, Box, Separator } from "@radix-ui/themes";
import { useTheme } from "next-themes";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import NotificationDropdown from "./NotificationDropdown";
import LoginDialog from "./LoginDialog";
import { useRouter } from "next/navigation";
import Hero from "../Hero";

const Header = () => {
	const { user, setUser } = useUser();
	const { theme, setTheme } = useTheme();
	const [menuOpen, setMenuOpen] = useState(false);
	const router = useRouter();

	const NAV_LIST = [
		{ title: "의뢰 관리", path: `/clients`, roles: ["admin", "staff"] },
		{ title: "일정 관리", path: "/todos", roles: [] },
		{ title: "나의 의뢰", path: "/my-assignments", roles: ["client"] },
		{ title: "공지사항", path: "/news", roles: ["admin", "staff", "client"] },
	];

	const handleLogout = async () => {
		const { error } = await supabase.auth.signOut();
		if (error) {
			console.error("Logout failed:", error.message);
		} else {
			setUser(null);
		}
		router.push("/");
	};

	const toggleTheme = () => {
		setTheme(theme === "light" ? "dark" : "light");
	};

	return (
		<Box className="border-b border-b-gray-9 px-4 py-3 md:px-12 md:py-5 flex justify-between items-center w-full">
			{/* Logo */}
			<Flex className="items-center">
				<Link href="/">
					<Text className="font-bold text-xl md:text-2xl">LawHub</Text>
				</Link>
			</Flex>

			{/* Desktop Navigation */}
			<Flex className="hidden md:flex gap-4 items-center">
				{NAV_LIST.filter((nav) => nav.roles.includes(user?.role)).map((nav) => (
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
				))}
				{user && user.role !== "client" && (
					<Link href="/group">
						<Button variant="ghost" color="red">
							그룹 관리
						</Button>
					</Link>
				)}
				{user && user.role === "admin" && (
					<Link href="/admin">
						<Button variant="ghost" color="red">
							관리자
						</Button>
					</Link>
				)}
			</Flex>

			{/* Mobile Menu */}
			<DropdownMenu.Root open={menuOpen} onOpenChange={setMenuOpen}>
				<DropdownMenu.Trigger asChild>
					<Button className="md:hidden">
						<HamburgerMenuIcon />
					</Button>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content
					className="bg-gray-3 p-4 rounded-lg shadow-md"
					sideOffset={5}
					style={{ minWidth: "200px" }}
				>
					{NAV_LIST.filter((nav) => nav.roles.includes(user?.role)).map((nav) => (
						<DropdownMenu.Item key={nav.path}>
							<Link href={nav.path}>
								<Text size="2" style={{ display: "block", padding: "0.5rem 0" }}>
									{nav.title}
								</Text>
							</Link>
						</DropdownMenu.Item>
					))}
					<Separator className="my-2" />
					{user && user.role !== "client" && (
						<DropdownMenu.Item>
							<Link href="/group">
								<Text size="2" style={{ display: "block", padding: "0.5rem 0" }}>
									그룹 관리
								</Text>
							</Link>
						</DropdownMenu.Item>
					)}
					{user && user.role === "admin" && (
						<DropdownMenu.Item>
							<Link href="/admin">
								<Text size="2" style={{ display: "block", padding: "0.5rem 0" }}>
									관리자
								</Text>
							</Link>
						</DropdownMenu.Item>
					)}
					{user && (
						<DropdownMenu.Item onClick={handleLogout}>
							<Text size="2" style={{ display: "block", padding: "0.5rem 0", color: "red" }}>
								로그아웃
							</Text>
						</DropdownMenu.Item>
					)}
				</DropdownMenu.Content>
			</DropdownMenu.Root>

			{/* Right Actions */}
			<Flex align="center" gap="4">
				<Button
					className="focus:outline-none hidden md:block"
					variant="ghost"
					color="gray"
					onClick={toggleTheme}
				>
					{theme === "light" ? <MoonIcon width={20} height={20} /> : <SunIcon width={20} height={20} />}
				</Button>
				{user && <NotificationDropdown user={user} />}
				{user ? (
					<Hero user={user} onLogout={handleLogout} />
				) : (
					<LoginDialog />
				)}
			</Flex>
		</Box>
	);
};

export default Header;

