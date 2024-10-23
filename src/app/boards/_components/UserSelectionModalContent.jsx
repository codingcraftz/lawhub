// src/app/boards/_components/UserSelectionModalContent.js

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Flex, Text, Button, Checkbox } from "@radix-ui/themes";

const UserSelectionModalContent = ({
  userType, // "client" 또는 "staff"
  selectedUsers,
  setSelectedUsers,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [localSelectedUsers, setLocalSelectedUsers] = useState([
    ...selectedUsers,
  ]);
  const [test, setTest] = useState([]);

  useEffect(() => {
    const fetchAllUsers = async () => {
      console.log("Fetching users for userType:", userType);
      let query = supabase.from("users").select("id, name, role, is_active");

      if (userType === "client") {
        query = query.eq("role", "client").eq("is_active", true);
      } else if (userType === "staff") {
        query = query.in("role", ["staff", "admin"]).eq("is_active", true);
      }

      const { data, error } = await query;
      console.log("Query result:", { data, error });

      if (error) {
        console.error("Error fetching users:", error);
      } else {
        console.log("Fetched users:", data);
        setAllUsers(data || []);
        setFilteredUsers(data || []);
      }
    };

    fetchAllUsers();
  }, [userType]);

  console.log(test);
  console.log(allUsers);
  console.log(filteredUsers);

  useEffect(() => {
    if (searchTerm === "") {
      setFilteredUsers(allUsers);
    } else {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const filtered = allUsers.filter((user) =>
        user.name.toLowerCase().includes(lowerCaseSearchTerm),
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, allUsers]);

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
        {filteredUsers.map((user) => (
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
