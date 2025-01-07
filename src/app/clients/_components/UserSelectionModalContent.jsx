import React, { useState } from "react";
import { supabase } from "@/utils/supabase";
import {
  Box,
  Flex,
  Text,
  Button,
  Checkbox,
  Tooltip,
  Theme,
} from "@radix-ui/themes";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";

const UserSelector = ({
  open,
  onOpenChange,
  userType,
  selectedUsers,
  setSelectedUsers,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [localSelectedUsers, setLocalSelectedUsers] = useState([
    ...selectedUsers,
  ]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    let query = supabase
      .from("users")
      .select("id, name, role, is_active, birth_date, phone_number")
      .ilike("name", `%${searchTerm}%`);

    if (userType === "client") {
      query = query.eq("role", "client").eq("is_active", true);
    } else if (userType === "staff") {
      query = query.in("role", ["staff", "admin"]).eq("is_active", true);
    }

    const { data, error } = await query;

    setLoading(false);
    if (error) {
      console.error("Error fetching users:", error);
    } else {
      setSearchResults(data || []);
    }
  };

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

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      fetchUsers();
    }
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
    <Dialog.Root open={open} onOpenChange={onOpenChange} className="bg-red-2">
      <Dialog.Portal>
        <Theme>
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-75 z-30" />
          <Dialog.Content className="fixed bg-gray-3 left-1/2 top-1/2 max-h-[85vh] min-w-[500px] max-w-[650px] -translate-x-1/2 -translate-y-1/2 rounded-md p-[25px] shadow focus:outline-none data-[state=open]:animate-contentShow z-40">
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                color="gray"
                style={{ position: "absolute", top: 8, right: 8 }}
              >
                <Cross2Icon width={25} height={25} />
              </Button>
            </Dialog.Close>
            <Dialog.Title>사용자 선택</Dialog.Title>

            <Box>
              <Flex align="center" gap="2" mb="3">
                <input
                  type="text"
                  placeholder="이름으로 검색"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  style={{
                    flex: 1,
                    padding: "1rem",
                    border: "1px solid var(--gray-6)",
                    borderRadius: "var(--radius-1)",
                  }}
                />
                <Button onClick={fetchUsers} disabled={loading}>
                  검색
                </Button>
              </Flex>

              <Box mt="3" style={{ maxHeight: "300px", overflowY: "auto" }}>
                {searchResults.map((user) => (
                  <Flex key={user.id} align="center" mt="2">
                    <Checkbox
                      checked={
                        !!localSelectedUsers.find((u) => u.id === user.id)
                      }
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
                            <strong>생년월일: </strong>{" "}
                            {formatDate(user.birth_date)}
                          </p>
                          <p style={{ color: "var(--gray-12)" }}>
                            <strong>전화번호:</strong>{" "}
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
          </Dialog.Content>
        </Theme>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default UserSelector;
