import { Box, Text } from "@radix-ui/themes";
import React from "react";

const DynamicSelect = ({ options, value, onChange, placeholder, label }) => {
	return (
		<Box className="flex-1">
			<Text className="font-medium">{label}</Text>
			<select
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="w-full p-2 border rounded border-gray-6"
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

