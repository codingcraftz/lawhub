"use client";

import Assignment from "./Assignment";
import { useUser } from "@/hooks/useUser";


const MyAssignmentPage = () => {
	const { user } = useUser();

	if (user?.id) {
		return (<>
			<Assignment clientId={user.id} />
		</>)
	}
	return null
}

export default MyAssignmentPage
