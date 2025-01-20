"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Flex, Box, Text, Button, DropdownMenu } from "@radix-ui/themes";
import { useRouter } from "next/navigation";

const MAX_DISPLAY_COUNT = 6;

const NotificationDropdown = ({ user }) => {
	const [notifications, setNotifications] = useState([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const router = useRouter();
	const isAdmin = user?.role === "admin" || user?.role === "staff"

	useEffect(() => {
		if (user) {
			fetchNotifications();
			const channel = subscribeToNotifications();
			return () => {
				supabase.removeChannel(channel);
			};
		}
	}, [user]);

	const fetchNotifications = async () => {
		try {
			const { data, error } = isAdmin
				? await supabase
					.from("notifications")
					.select("*")
					.order("created_at", { ascending: false })
				: await supabase
					.from("notifications")
					.select("*")
					.eq("user_id", user.id)
					.order("created_at", { ascending: false });

			if (error) {
				console.error("알림을 가져오는 중 오류 발생:", error);
			} else {
				const unreadNotifications = data.filter((n) => !n.is_read);
				setNotifications(data.slice(0, MAX_DISPLAY_COUNT));
				setUnreadCount(unreadNotifications.length);
			}
		} catch (err) {
			console.error("알림을 가져오는 중 오류 발생:", err);
		}
	};


	const subscribeToNotifications = () => {
		const filterCondition = isAdmin
			? "" // 관리자: 모든 알림 구독
			: `user_id=eq.${user.id}`; // 일반 사용자: 자신의 알림만 구독

		const channel = supabase
			.channel("public:notifications")
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "notifications",
					filter: filterCondition,
				},
				(payload) => {
					const newNotification = payload.new;
					setNotifications((prev) => {
						const updatedNotifications = [newNotification, ...prev].slice(
							0,
							MAX_DISPLAY_COUNT
						);
						return updatedNotifications;
					});
					setUnreadCount((prev) => prev + 1);
				}
			)
			.subscribe();

		return channel;
	};


	const handleNotificationClick = async (notification) => {
		await markAsRead(notification.id);
		router.push(`/client/assignment/${notification.assignment_id}`);
	};

	const markAsRead = async (id) => {
		const { error } = await supabase
			.from("notifications")
			.update({ is_read: true })
			.eq("id", id);

		if (!error) {
			setNotifications((prev) =>
				prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
			);
			setUnreadCount((prev) => prev - 1);
		}
	};

	return (
		<DropdownMenu.Root>
			<DropdownMenu.Trigger asChild>
				<Button
					variant="ghost"
					style={{ position: "relative" }}
					aria-label="알림"
				>
					알림
					{unreadCount > 0 && (
						<Box
							style={{
								position: "absolute",
								top: "-8px",
								right: "-8px",
								backgroundColor: "var(--red-9)",
								borderRadius: "50%",
								width: "20px",
								height: "20px",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								color: "white",
								fontSize: "12px",
							}}
						>
							{unreadCount}
						</Box>
					)}
				</Button>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content
				className="py-1"
				style={{ minWidth: "300px", maxWidth: "600px" }}
			>
				<Flex direction="column" gap="1rem">
					{notifications.length > 0 ? (
						notifications.map((notification) => (
							<DropdownMenu.Item
								key={notification.id}
								onSelect={() => handleNotificationClick(notification)}
								style={{
									cursor: "pointer",
									whiteSpace: "normal",
								}}
							>
								<Flex
									className="gap-2 px-2 py-1 rounded-lg justify-between hover:opacity-60"
									style={{
										backgroundColor: notification.is_read
											? "var(--gray-2)"
											: "var(--sky-4)",
									}}
								>
									<Box>
										<Text>{notification.message}</Text>
										<Text size="2" color="gray">
											{notification.description}
										</Text>
									</Box>
									<Text size="1" color="gray">
										{new Date(notification.created_at).toLocaleString("ko-KR", {
											year: "numeric",
											month: "2-digit",
											day: "2-digit",
											hour: "2-digit",
											minute: "2-digit",
											hour12: true,
										})}
									</Text>
								</Flex>
							</DropdownMenu.Item>
						))
					) : (
						<DropdownMenu.Item disabled>알림이 없습니다</DropdownMenu.Item>
					)}
				</Flex>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	);
};

export default NotificationDropdown;

