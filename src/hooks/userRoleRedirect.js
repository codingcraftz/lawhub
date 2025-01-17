// src/hooks/useRoleRedirect.js

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";

/**
 * @param {string[]} requiredRoles - 허용된 role 리스트 (예: ["staff", "admin"])
 * @param {string[]} allowedEmployeeTypes - 허용된 employee_type 리스트 (optional)
 * @param {string} redirectPath - 권한이 없을 경우 리디렉션할 경로
 */
const useRoleRedirect = (
	requiredRoles = [],
	allowedEmployeeTypes = [],
	redirectPath
) => {
	const { user } = useUser();
	const router = useRouter();

	useEffect(() => {
		if (
			user &&
			(!requiredRoles.includes(user.role) ||
				(allowedEmployeeTypes.length > 0 &&
					!allowedEmployeeTypes.includes(user.employee_type)))
		) {
			router.push(redirectPath);
		}
	}, [user, requiredRoles, allowedEmployeeTypes, redirectPath, router]);
};

export default useRoleRedirect;

