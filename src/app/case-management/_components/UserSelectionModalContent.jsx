import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Flex, Text, Button, Checkbox, Tooltip } from "@radix-ui/themes";

const UserSelectionModalContent = ({
  userType,
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

  useEffect(() => {
    const fetchAllUsers = async () => {
      let query = supabase
        .from("users")
        .select("id, name, role, is_active, birth_date, phone_number");

      if (userType === "client") {
        query = query.eq("role", "client").eq("is_active", true);
      } else if (userType === "staff") {
        query = query.in("role", ["staff", "admin"]).eq("is_active", true);
      }

      const { data, error } = await query;
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  };

  const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return "없음";
    return phoneNumber.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
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
            <Tooltip
              content={
                <Box
                  style={{
                    padding: "0.5rem",
                    fontSize: "12px",
                  }}
                >
                  <p style={{ color: "var(--gray-12)" }}>
                    <strong>생년월일: </strong> {formatDate(user.birth_date)}
                  </p>
                  <p style={{ color: "var(--gray-12)" }}>
                    <strong>전화번호:</strong>
                    {formatPhoneNumber(user.phone_number)}
                  </p>
                </Box>
              }
            >
              <Text ml="2" style={{ cursor: "pointer" }}>
                {user.name}
              </Text>
            </Tooltip>
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
