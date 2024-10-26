// src/app/admin/page.jsx

"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import AdminDashboard from "./_components/AdminDashboard";

const AdminPage = () => {
  const router = useRouter();
  const { user } = useUser();

  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else if (user.role !== "admin") {
      alert("접근 권한이 없습니다.");
      router.push("/");
    }
  }, [user, router]);

  return user && user.role === "admin" ? <AdminDashboard /> : null;
};

export default AdminPage;
