// UserSelectionModalContent.js

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Flex, Text, Button, Checkbox } from "@radix-ui/themes";
import debounce from "@/utils/debounce";

const UserSelectionModalContent = ({
  userType, // "client" 또는 "staff"
  selectedUsers,
  setSelectedUsers,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [localSelectedUsers, setLocalSelectedUsers] = useState([
    ...selectedUsers,
  ]);

  // 사용자 검색 함수
  const fetchUsers = async (term) => {
    let query = supabase.from("profiles").select("id, name");
    if (userType === "client") {
      query = query.eq("role", "client");
    } else if (userType === "staff") {
      query = query.in("role", ["staff", "admin"]);
    }

    if (term) {
      query = query.ilike("name", `%${term}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching users:", error);
    } else {
      setSearchResults(data || []);
    }
  };

  const debouncedFetchUsers = useCallback(
    debounce((term) => fetchUsers(term), 300),
    [],
  );

  useEffect(() => {
    debouncedFetchUsers(searchTerm);
  }, [searchTerm]);

  // 사용자 선택 토글 함수
  const handleToggleUser = (user) => {
    if (localSelectedUsers.find((u) => u.id === user.id)) {
      setLocalSelectedUsers((prev) => prev.filter((u) => u.id !== user.id));
    } else {
      setLocalSelectedUsers((prev) => [...prev, user]);
    }
  };

  const handleSaveSelection = () => {
    setSelectedUsers(localSelectedUsers);
    onClose();
  };

  return (
    <Box>
      <input
        type="text"
        placeholder="검색"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          width: "100%",
          padding: "1rem",
          border: "1px solid var(--gray-6)",
          borderRadius: "var(--radius-1)",
        }}
      />
      <Box mt="3" style={{ maxHeight: "300px", overflowY: "auto" }}>
        {searchResults.map((user) => (
          <Flex key={user.id} align="center" mt="2">
            <Checkbox
              checked={!!localSelectedUsers.find((u) => u.id === user.id)}
              onCheckedChange={() => handleToggleUser(user)}
            />
            <Text ml="2">{user.name}</Text>
          </Flex>
        ))}
      </Box>
      <Flex justify="end" mt="4" gap="2">
        <Button variant="outline" onClick={onClose}>
          취소
        </Button>
        <Button onClick={handleSaveSelection}>선택 완료</Button>
      </Flex>
    </Box>
  );
};

export default UserSelectionModalContent;
