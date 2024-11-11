// src/contexts/UserContext.jsx

"use client";

import React, { createContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import * as Dialog from "@radix-ui/react-dialog"; // 알림 모달에 필요한 Dialog 가져오기
import { Button } from "@radix-ui/themes";
import { useRouter } from "next/navigation";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // 모달 상태 추가
  const [modalMessage, setModalMessage] = useState(""); // 모달 메시지 상태 추가
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    console.log(authUser);

    if (authUser) {
      const { data: profile, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
      } else if (!profile.is_active) {
        await supabase.auth.signOut();
        setUser(null);
        setModalMessage("관리자의 승인을 기다려주세요.");
        setIsModalOpen(true);
      } else {
        setUser({ ...authUser, ...profile });
      }
    } else {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    fetchUser();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      fetchUser();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [fetchUser]);

  return (
    <UserContext.Provider value={{ user, setUser, fetchUser }}>
      {children}
      {/* 모달 구현 */}
      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Content
          className="max-w-[450px] p-8 rounded-md border-2 bg-white fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-lg z-50 text-center"
          style={{
            border: "1px solid var(--gray-6)",
          }}
        >
          <Dialog.Title className="text-lg font-semibold text-blue-500 mb-4">
            알림
          </Dialog.Title>
          <Dialog.Description className="text-base text-gray-700 mb-6">
            {modalMessage}
          </Dialog.Description>
          <Dialog.Close asChild>
            <Button
              variant="soft"
              color="blue"
              className="w-full py-2 rounded-md text-base font-medium"
              onClick={() => {
                setIsModalOpen(false);
                router.push("/");
              }}
            >
              확인
            </Button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Root>
    </UserContext.Provider>
  );
};
