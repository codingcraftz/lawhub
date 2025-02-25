"use client";

import React from "react";
import { Button } from "@radix-ui/themes";

export default function InquiryTab({ title, isActive, onClick }) {
	return (
		<Button
			variant={isActive ? "solid" : "outline"}
			size="2"
			onClick={onClick}
			className="mb-4"
		>
			{title}
		</Button>
	);
}

