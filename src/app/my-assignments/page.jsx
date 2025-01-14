"use client";

import useRoleRedirect from "@/hooks/userRoleRedirect";
import Assignment from "./Assignment";
import { useUser } from "@/hooks/useUser";


const MyAssignmentPage = () => {
	useRoleRedirect(["staff", "admin", "client"], "/");

	const { user } = useUser();
	if (user?.id) {
		return (<>
			<Assignment clientId={user.id} />
		</>)
	}
	return null
}

export default MyAssignmentPage
