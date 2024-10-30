import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { useUser } from "@/hooks/useUser";
import { Flex, Box, Text, Button, DropdownMenu } from "@radix-ui/themes";
import { useRouter } from "next/navigation"; // 추가

const MAX_DISPLAY_COUNT = 6;

const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useUser();
  const router = useRouter(); // 추가

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
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("알림을 가져오는 중 오류 발생:", error);
    } else {
      const unreadNotifications = data.filter((n) => !n.is_read);
      const readNotifications = data.filter((n) => n.is_read);

      const limitedNotifications = [
        ...unreadNotifications.slice(0, MAX_DISPLAY_COUNT),
        ...readNotifications.slice(
          0,
          MAX_DISPLAY_COUNT - unreadNotifications.length,
        ),
      ];

      setNotifications(limitedNotifications);
      setUnreadCount(unreadNotifications.length);
    }
  };

  const subscribeToNotifications = () => {
    const channel = supabase
      .channel("public:notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => {
            const newNotification = payload.new;
            const updatedNotifications = [newNotification, ...prev];
            const unreadNotifications = updatedNotifications.filter(
              (n) => !n.is_read,
            );
            const readNotifications = updatedNotifications.filter(
              (n) => n.is_read,
            );

            return [
              ...unreadNotifications.slice(0, MAX_DISPLAY_COUNT),
              ...readNotifications.slice(
                0,
                MAX_DISPLAY_COUNT - unreadNotifications.length,
              ),
            ];
          });
          setUnreadCount((prev) => prev + 1);
        },
      )
      .subscribe();

    return channel;
  };

  const handleNotificationClick = async (notification) => {
    await markAsRead(notification.id);

    if (notification.message.includes("배정")) {
      router.push("/boards");
    } else if (notification.message.includes("요청")) {
      router.push("/todos");
    }
  };

  const markAsRead = async (id) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (error) {
      console.error("알림을 읽음 처리하는 중 오류 발생:", error);
    } else {
      setNotifications((prev) => {
        const updatedNotifications = prev.map((n) =>
          n.id === id ? { ...n, is_read: true } : n,
        );
        const unreadNotifications = updatedNotifications.filter(
          (n) => !n.is_read,
        );
        const readNotifications = updatedNotifications.filter((n) => n.is_read);

        return [
          ...unreadNotifications.slice(0, MAX_DISPLAY_COUNT),
          ...readNotifications.slice(
            0,
            MAX_DISPLAY_COUNT - unreadNotifications.length,
          ),
        ];
      });
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
      <DropdownMenu.Content style={{ minWidth: "300px" }}>
        <Flex direction="column" gap="1rem">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <DropdownMenu.Item
                key={notification.id}
                onSelect={() => handleNotificationClick(notification)}
                style={{
                  backgroundColor: notification.is_read
                    ? "transparent"
                    : "var(--gray-3)",
                  padding: "8px",
                  cursor: "pointer",
                }}
              >
                <Flex direction="row" align="center">
                  {!notification.is_read && (
                    <Box
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: "var(--blue-9)",
                        marginRight: "8px",
                      }}
                    />
                  )}
                  <Flex direction="column">
                    <Text
                      size="2"
                      weight={notification.is_read ? "normal" : "bold"}
                    >
                      {notification.message}
                    </Text>
                    <Text size="1" color="gray">
                      {new Date(notification.created_at).toLocaleString(
                        "ko-KR",
                        {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        },
                      )}
                    </Text>
                  </Flex>
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
