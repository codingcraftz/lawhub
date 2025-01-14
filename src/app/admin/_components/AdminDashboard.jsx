// src/app/admin/_components/AdminDashboard.jsx

"use client";

import React from "react";
import { Box, Text } from "@radix-ui/themes";

const AdminDashboard = () => {
	return (
		<Box className="p-4 max-w-7xl w-full mx-auto">
			<Text size="8" weight="bold" className="mb-4">
				관리자 페이지입니다.
			</Text>
		</Box>
	);
};

export default AdminDashboard;
