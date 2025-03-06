"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/utils/supabase";
import { useRouter } from "next/navigation";

const MAX_DISPLAY_COUNT = 6;

const NotificationDropdown = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
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

  // 바깥 영역 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(MAX_DISPLAY_COUNT);

      if (error) {
        console.error("알림을 가져오는 중 오류 발생:", error);
      } else {
        const unreadNotifications = data.filter((n) => !n.is_read);
        setNotifications(data);
        setUnreadCount(unreadNotifications.length);
      }
    } catch (err) {
      console.error("알림을 가져오는 중 오류 발생:", err);
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
            const updated = [newNotification, ...prev];
            return updated.slice(0, MAX_DISPLAY_COUNT);
          });
          setUnreadCount((prev) => prev + 1);
        },
      )
      .subscribe();

    return channel;
  };

  const handleNotificationClick = async (notification) => {
    await markAsRead(notification.id);
    // 원하는 라우팅으로 이동
    router.push(`/client/assignment/${notification.assignment_id}`);
    setIsOpen(false);
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
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 알림 버튼 */}
      <button
        className="relative px-3 py-2 rounded-md bg-gray-3 text-gray-12 hover:bg-gray-4 transition-colors"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        알림
        {unreadCount > 0 && (
          <span
            className="
              absolute
              -top-1 -right-1
              flex items-center justify-center
              w-5 h-5
              text-xs
              rounded-full
              bg-red-9 text-white
            "
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* 드롭다운 영역 */}
      {isOpen && (
        <div
          className="
            absolute
            right-0
            mt-2
            w-80
            max-h-96
            overflow-y-auto
            rounded-lg
            bg-gray-1
            shadow-lg
            border border-gray-4
            z-50
          "
        >
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`
                  cursor-pointer
                  px-4 py-3
                  hover:bg-sky-3
                  transition-colors
                  ${notification.is_read ? "bg-gray-1" : "bg-sky-2"}
                  border-b border-gray-4
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-gray-12">
                    {notification.message}
                  </div>
                  <span className="ml-4 text-xs text-gray-11 whitespace-nowrap">
                    {new Date(notification.created_at).toLocaleString("ko-KR", {
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </span>
                </div>
                <span className="font-medium text-xs text-gray-11">
                  {notification.title}
                </span>
                {notification.description && (
                  <div className="text-gray-11 text-sm break-words">
                    {notification.description}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-11">알림이 없습니다</div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
