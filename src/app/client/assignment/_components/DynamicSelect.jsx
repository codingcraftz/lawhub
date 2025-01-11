"use client";
import { Box, Text } from "@radix-ui/themes";
import React from "react";

const DynamicSelect = ({ options, value, onChange, placeholder, label }) => {
	return (
		<Box className="flex-1">
			<Text className="font-medium text-gray-12 mb-1">{label}</Text>
			<select
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="
          w-full p-2
          border border-gray-6
          rounded text-gray-12
          focus:outline-none focus:border-gray-8
          bg-gray-1
        "
			>
				<option value="">{placeholder}</option>
				{options.map((option) => (
					<option key={option.value || option} value={option.value || option}>
						{option.label || option}
					</option>
				))}
			</select>
		</Box>
	);
};

export default DynamicSelect;

