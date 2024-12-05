// src/hooks/useAuthRedirect.js

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "./useUser";

const useAuthRedirect = (requiredRoles = [], redirectPath = "/login") => {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push(redirectPath); // 로그인하지 않은 경우 리다이렉트
      return;
    }

    if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
      router.push("/"); // 권한이 없는 경우 메인 페이지로 리다이렉트
    }
  }, [user, requiredRoles, redirectPath, router]);
};

export default useAuthRedirect;
