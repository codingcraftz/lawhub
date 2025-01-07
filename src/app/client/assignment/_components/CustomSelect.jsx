import * as Select from "@radix-ui/react-select";
import React from "react";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons";
import { Box, Text } from "@radix-ui/themes";

const DynamicSelect = ({ options, value, onChange, placeholder, label }) => {
	return (

		<Box>
			<Text className="font-medium mb-1">{label}</Text>
			<Select.Root value={value} onValueChange={onChange}>
				<Select.Trigger className="w-full p-2 border rounded border-gray-6 flex items-center justify-between">
					<Select.Value placeholder={placeholder} />
					<Select.Icon>
						<ChevronDownIcon />
					</Select.Icon>
				</Select.Trigger>
				<Select.Portal>
					<Select.Content className="z-50 bg-gray-2 border border-gray-300 rounded shadow-lg">
						<Select.ScrollUpButton className="flex items-center justify-center p-2">
							<ChevronUpIcon />
						</Select.ScrollUpButton>
						<Select.Viewport className="bg-black">
							{options.map((option) => (
								<Select.Item
									key={option.value || option}
									value={option.value || option}
									className="p-2 cursor-pointer hover:bg-gray-100 flex items-center justify-between bg-black"
								>
									<Select.ItemText>{option.label || option}</Select.ItemText>
									<Select.ItemIndicator className="text-green-600">
										<CheckIcon />
									</Select.ItemIndicator>
								</Select.Item>
							))}
						</Select.Viewport>
						<Select.ScrollDownButton className="flex items-center justify-center p-2">
							<ChevronDownIcon />
						</Select.ScrollDownButton>
					</Select.Content>
				</Select.Portal>
			</Select.Root>
		</Box>
	);
};

export default DynamicSelect;


