"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createContext } from "react";
import { supabase } from "@/utils/supabase";

export const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const fetchUserData = useCallback(async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;

      if (session?.user) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (profileError) {
          if (profileError.code === 'PGRST116') {
            console.log("Profile not found, user might be inactive");
            setUser(null);
          } else {
            throw profileError;
          }
        } else {
          if (profileData.is_active) {
            setUser({ ...session.user, ...profileData });
          } else {
            console.log("User is not active");
            setUser(null);
          }
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchUserData();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchUserData]);

  return (
    <UserContext.Provider value={{ user, setUser, loading, logout, fetchUserData }}>
      {children}
    </UserContext.Provider>
  );
};
