//src/contexts/UserContext.jsx

"use client";

import React, { createContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const fetchUser = useCallback(async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (authUser) {
      const { data: profile, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
      } else if (!profile.is_active) {
        // is_active가 false면 로그아웃 처리
        await supabase.auth.signOut();
        setUser(null);
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
    </UserContext.Provider>
  );
};
