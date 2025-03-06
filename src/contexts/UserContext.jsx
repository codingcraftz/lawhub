"use client";

import React, { createContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@radix-ui/themes";
import { useRouter } from "next/navigation";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const router = useRouter();

  // 디버깅을 위한 로컬 스토리지 로깅 함수
  const logDebugInfo = (step, data) => {
    try {
      const debugLog = JSON.parse(
        localStorage.getItem("auth_debug_log") || "[]",
      );
      debugLog.push({
        timestamp: new Date().toISOString(),
        step,
        data,
        url: window.location.href,
      });
      localStorage.setItem("auth_debug_log", JSON.stringify(debugLog));
    } catch (e) {
      // 로깅 실패 시 무시
    }
  };

  // Fetch user profile and store it in state
  const fetchUser = useCallback(async () => {
    logDebugInfo("fetch_user_start", {});

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (authUser) {
      logDebugInfo("auth_user_found", { id: authUser.id });

      const { data: profile, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (error) {
        logDebugInfo("profile_fetch_error", { error: error.message });
        router.push("/login");
        console.error("Error fetching profile:", error);
      } else {
        logDebugInfo("profile_fetch_success", {
          hasProfile: !!profile,
          role: profile?.role,
        });
        setUser({ ...profile });
      }
    } else {
      logDebugInfo("no_auth_user", {});
      setUser(null);
    }
  }, []);

  useEffect(() => {
    fetchUser();

    // Set up an auth listener to handle session changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        logDebugInfo("auth_state_change", {
          event,
          hasSession: !!session,
          sessionUser: session?.user?.id,
        });
        fetchUser();
      },
    );

    // Cleanup the listener on component unmount
    return () => {
      listener.subscription.unsubscribe();
    };
  }, [fetchUser]);

  return (
    <UserContext.Provider value={{ user, setUser, fetchUser }}>
      {children}
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
