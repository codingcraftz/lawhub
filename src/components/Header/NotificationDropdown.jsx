import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { useUser } from "@/hooks/useUser";
import { Flex, Box, Text, Button, DropdownMenu } from "@radix-ui/themes";
import { useRouter } from "next/navigation";

const MAX_DISPLAY_COUNT = 6;

const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useUser();
  const router = useRouter();

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
      .select(
        `*, 
      case:case_id (
        court_name,
        case_year,
        case_type,
        case_number,
        case_subject
      )`,
      )
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

      // 사건 정보 텍스트 생성 및 추가
      const notificationsWithCaseInfo = limitedNotifications.map(
        (notification) => {
          if (notification.case) {
            const caseInfo = notification.case;
            notification.case_info = [
              caseInfo.court_name || "",
              caseInfo.case_year || "",
              caseInfo.case_type || "",
              caseInfo.case_number || "",
              caseInfo.case_subject || "",
            ]
              .filter(Boolean)
              .join(" ");
          } else {
            notification.case_info = null;
          }
          return notification;
        },
      );

      setNotifications(notificationsWithCaseInfo);
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
          const newNotification = payload.new;
          setNotifications((prev) => {
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
    if (notification.type === "배정") {
      router.push(`/cases/${notification.case_id}`);
    } else if (notification.type === "요청") {
      router.push(`/cases/${notification.case_id}`);
    }
  };

  const markAsRead = async (id) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
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
        <Flex className="" direction="column" gap="1rem">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <DropdownMenu.Item
                className="mx-0 px-0 hover:bg-none"
                key={notification.id}
                onSelect={() => handleNotificationClick(notification)}
                style={{
                  cursor: "pointer",
                  whiteSpace: "normal",
                }}
              >
                <Flex
                  className="flex-1 gap-2 px-2 py-1 rounded-lg justify-between hover:opacity-60"
                  direction="row"
                  align="flex-start"
                  style={{
                    backgroundColor: notification.is_read
                      ? "var(--gray-2)"
                      : "var(--sky-4)",
                  }}
                >
                  {notification.type === "배정" ? (
                    <Box>
                      <Text>사건에 배정되었습니다</Text>
                      <Text
                        className="block text-sm"
                        style={{
                          color: "var(--gray-9)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "block",
                          width: "200px",
                        }}
                      >
                        {notification.case_info}
                      </Text>
                    </Box>
                  ) : notification.type === "요청" ||
                    notification.type === "요청 승인" ? (
                    <Box>
                      <Text>
                        {notification.type === "요청"
                          ? "요청이 있습니다"
                          : "요청이 완료되었습니다."}
                      </Text>
                      <Text
                        className="block text-sm"
                        style={{
                          color: "var(--gray-9)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "block",
                          width: "200px",
                        }}
                      >
                        {notification.message}
                      </Text>
                    </Box>
                  ) : (
                    <Text>{notification.message}</Text>
                  )}
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
