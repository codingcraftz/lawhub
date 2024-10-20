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
      // 로그인되어 있지 않으면 로그인 페이지로 리디렉션
      router.push("/login");
    } else if (user.role !== "admin") {
      // 관리자가 아니면 접근 권한 없음 페이지로 리디렉션 또는 홈으로 이동
      alert("접근 권한이 없습니다.");
      router.push("/");
    }
  }, [user, router]);

  return user && user.role === "admin" ? <AdminDashboard /> : null;
};

export default AdminPage;
