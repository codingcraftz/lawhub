"use client";

import React from "react";
import { Flex } from "@radix-ui/themes";

export default function StaffSearchBar({
  searchTerm,
  setSearchTerm,
  placeholder,
}) {
  const handleChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <Flex gap="2">
      <input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleChange}
        className="border border-gray-6 rounded px-2 py-1"
      />
    </Flex>
  );
}
