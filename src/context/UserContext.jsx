"use client";

import React, { createContext, useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";

export const UserContext = createContext(); // UserContext를 내보냅니다.

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // 사용자 정보 가져오기
  const fetchUser = async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (authUser) {
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
      } else {
        setUser({ ...authUser, ...profileData });
      }
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    fetchUser();

    // Auth 상태 변화 감지하여 사용자 정보 갱신
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      fetchUser();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, fetchUser }}>
      {children}
    </UserContext.Provider>
  );
};
