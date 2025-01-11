// src/components/Header/index.jsx

"use client";

import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/utils/supabase";
import { MoonIcon, SunIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { Flex, Button, Text, Box } from "@radix-ui/themes";
import { useTheme } from "next-themes";
import * as HoverCard from "@radix-ui/react-hover-card"; // HoverCard import
import NotificationDropdown from "./NotificationDropdown";
import LoginDialog from "./LoginDialog";

const Header = () => {
	const { user, setUser } = useUser();
	const { theme, setTheme } = useTheme();

	const NAV_LIST = [
		{
			title: "의뢰 관리",
			path: `/clients`,
			roles: ["admin", "staff"],
		},
		{ title: "일정 관리", path: "/todos", roles: [] },
		{ title: "나의 의뢰", path: '/my-assignments', roles: ["client"] },
		{
			title: "공지사항",
			path: "/news",
			roles: ["admin", "staff", "client"],
		},
	];

	const handleLogout = async () => {
		const { error } = await supabase.auth.signOut();
		if (error) {
			console.error("Logout failed:", error.message);
		} else {
			console.log("User logged out");
			setUser(null);
		}
	};

	const toggleTheme = () => {
		setTheme(theme === "light" ? "dark" : "light");
	};

	return (
		<Box className="border-b border-b-gray-9 px-12 py-5 flex justify-center w-full">
			<Flex className="justify-between items-center max-w-screen-lg w-full">
				<Flex className="items-center gap-4">
					<Link
						className="hover:scale-105 transition-transform duration-300"
						href="/"
					>
						<Text className="font-bold text-2xl">LawHub</Text>
					</Link>
					<Flex className="gap-4 items-cneter">
						{NAV_LIST.filter((nav) => nav.roles.includes(user?.role)).map(
							(nav) => {
								if (nav.subItems) {
									return (
										<HoverCard.Root key={nav.title}>
											<HoverCard.Trigger asChild>
												<Link href={nav.path}>
													<Button
														className="flex items-center cursor-pointer"
														variant="ghost"
														color="gray"
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
						{user && user.role !== "client" && (
							<Link href="/group">
								<Button
									variant="ghost"
									color="red"
									style={{
										display: "flex",
										alignItems: "center",
									}}
								>
									그룹 관리
								</Button>
							</Link>
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
					<Button
						className="focus:outline-none"
						variant="ghost"
						color="gray"
						onClick={toggleTheme}
					>
						{theme === "light" ? (
							<MoonIcon width={20} height={20} />
						) : (
							<SunIcon width={20} height={20} />
						)}
					</Button>
					{user && (user.role === "admin" || user.role === "staff") && (
						<NotificationDropdown />
					)}
					{user ? (
						<Button
							onClick={handleLogout}
							variant="ghost"
							color="red"
							className="px-4 py-2 rounded-lg"
						>
							로그아웃
						</Button>
					) : (
						<LoginDialog />
					)}
				</Flex>
			</Flex>
		</Box>
	);
};

export default Header;
