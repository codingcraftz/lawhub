// src/hooks/useRoleRedirect.js

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";

const useRoleRedirect = (requiredRoles = [], redirectPath) => {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user && !requiredRoles.includes(user.role)) {
      router.push(redirectPath);
    }
  }, [user, requiredRoles, redirectPath, router]);
};

export default useRoleRedirect;
