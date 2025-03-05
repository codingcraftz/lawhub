"use client";

import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Box, Flex, Button, Text } from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";
import InputMask from "react-input-mask";
import { supabase } from "@/utils/supabase";

/**
 * - birth_date 제거
 * - registration_number, workplace_name, workplace_address 추가
 */
export default function CreditorForm({
  initialData,
  onOpenChange,   // 함수: 모달 열고닫기 (state set)
  onSubmit,       // 최종 저장 핸들러
  isSubmitting,
}) {
  // 폼 상태
  const [formData, setFormData] = useState({
    name: "",
    registration_number: "",
    phone_number: "",
    address: "",
    workplace_name: "",
    workplace_address: "",
  });

  // 에러
  const [errors, setErrors] = useState({});

  // -- 고객 검색 모드
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // 초기 데이터 (수정 모드) 반영
  useEffect(() => {
    if (initialData) {
      // 이미 등록된 값이 있으면 set
      setFormData({
        name: initialData.name || "",
        registration_number: initialData.registration_number || "",
        phone_number: initialData.phone_number || "",
        address: initialData.address || "",
        workplace_name: initialData.workplace_name || "",
        workplace_address: initialData.workplace_address || "",
      });
    }
  }, [initialData]);

  // 유효성 검사
  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "이름은 필수입니다.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // input 변경
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 폼 submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    // 모달 닫기 전 부모로 전달
    onSubmit(formData);
  };

  // ================ 고객 검색 기능 ================
  const handleUserSearch = async () => {
    if (!userSearchTerm.trim()) return;
    setIsSearching(true);

    // 예시: users 테이블에서 이름 검색
    const { data, error } = await supabase
      .from("users")
      .select("id, name, phone_number") // birth_date 등은 필요 없다면 제외
      .ilike("name", `%${userSearchTerm}%`);

    if (error) {
      console.error("유저 검색 오류:", error);
    } else {
      const formattedResults = data.map((user) => ({
        ...user,
        phone_number: user.phone_number?.startsWith("+82")
          ? user.phone_number.replace("+82 ", "0")
          : user.phone_number,
      }));
      setUserSearchResults(formattedResults || []);
    }
    setIsSearching(false);
  };

  const handleUserSelect = (user) => {
    // 검색 결과에서 선택 시, 폼 데이터에 적용
    setFormData((prev) => ({
      ...prev,
      name: user.name,
      phone_number: user.phone_number || "",
      // registration_number, workplace_name, workplace_address는 user 테이블에 없으면 공란
      registration_number: "",
      address: "",
      workplace_name: "",
      workplace_address: "",
    }));
    setIsSearchMode(false);
  };

  return (
    <Dialog.Root open={true} onOpenChange={onOpenChange}>
      <Dialog.Overlay className="fixed inset-0 bg-black opacity-50 z-40" />
      <Dialog.Content
        className="
          fixed
          left-1/2 top-1/2
          max-h-[85vh] min-w-[450px] max-w-[650px]
          -translate-x-1/2 -translate-y-1/2
          rounded-md p-6
          bg-gray-2 border border-gray-6
          shadow-md shadow-gray-7
          text-gray-12
          focus:outline-none
          z-50
          overflow-y-auto
        "
      >
        <Flex justify="between" align="center" className="mb-3">
          <Dialog.Title className="font-bold text-xl flex gap-4">
            {initialData ? "채권자 수정" : "채권자 등록"}
            {!isSearchMode ? (
              <Button variant="soft" onClick={() => setIsSearchMode(true)}>
                고객 검색
              </Button>
            ) : (
              <Button variant="soft" onClick={() => setIsSearchMode(false)}>
                직접 입력
              </Button>
            )}
          </Dialog.Title>
          <Dialog.Close asChild>
            <Button variant="ghost" color="gray">
              <Cross2Icon width={20} height={20} />
            </Button>
          </Dialog.Close>
        </Flex>

        <form onSubmit={handleSubmit}>
          {/* ============== 검색 모드 ============== */}
          {isSearchMode && (
            <Box mb="3">
              <Text size="2" color="gray" className="mb-1">
                유저 이름 검색
              </Text>
              <Flex className="items-center" gap="2" mb="2">
                <input
                  type="text"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  placeholder="예) 홍길동"
                  className="
                    flex-1 p-2 border border-gray-6 rounded text-gray-12
                    focus:outline-none focus:border-gray-8
                  "
                />
                <Button onClick={handleUserSearch} disabled={isSearching}>
                  {isSearching ? "검색중" : "검색"}
                </Button>
              </Flex>

              <Box style={{ maxHeight: "150px", overflowY: "auto" }}>
                {userSearchResults.map((u) => (
                  <Flex
                    key={u.id}
                    justify="between"
                    align="center"
                    className="p-2 border-b border-gray-6"
                  >
                    <Text>
                      {u.name} / {u.phone_number || "번호 없음"}
                    </Text>
                    <Button size="2" onClick={() => handleUserSelect(u)}>
                      선택
                    </Button>
                  </Flex>
                ))}
              </Box>
            </Box>
          )}

          {/* ============== 직접 입력 모드 ============== */}
          {!isSearchMode && (
            <>
              {/* 이름 */}
              <Box mb="3">
                <Text size="2" color="gray" className="mb-1">
                  이름 *
                </Text>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="홍길동"
                  className="
                    w-full p-2 border border-gray-6 rounded text-gray-12
                    focus:outline-none focus:border-gray-8
                  "
                />
                {errors.name && (
                  <Text color="red" size="2">
                    {errors.name}
                  </Text>
                )}
              </Box>

              {/* 주민등록번호 */}
              <Box mb="3">
                <Text size="2" color="gray" className="mb-1">
                  주민등록번호
                </Text>
                <InputMask
                  mask="999999-9999999"
                  maskChar={null}
                  value={formData.registration_number}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      registration_number: e.target.value,
                    }))
                  }
                >
                  {(inputProps) => (
                    <input
                      {...inputProps}
                      name="registration_number"
                      className="
                        w-full p-2 border border-gray-6 rounded text-gray-12
                        focus:outline-none focus:border-gray-8
                      "
                    />
                  )}
                </InputMask>
              </Box>

              {/* 전화번호 */}
              <Box mb="3">
                <Text size="2" color="gray" className="mb-1">
                  전화번호
                </Text>
                <InputMask
                  mask="999-9999-9999"
                  maskChar={null}
                  value={formData.phone_number}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      phone_number: e.target.value,
                    }))
                  }
                >
                  {(inputProps) => (
                    <input
                      {...inputProps}
                      name="phone_number"
                      placeholder="010-1234-5678"
                      className="
                        w-full p-2 border border-gray-6 rounded text-gray-12
                        focus:outline-none focus:border-gray-8
                      "
                    />
                  )}
                </InputMask>
              </Box>

              {/* 주소 */}
              <Box mb="3">
                <Text size="2" color="gray" className="mb-1">
                  집주소
                </Text>
                <input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="예) 서울시 강남구 ..."
                  className="
                    w-full p-2 border border-gray-6 rounded text-gray-12
                    focus:outline-none focus:border-gray-8
                  "
                />
              </Box>

              {/* 직장이름 */}
              <Box mb="3">
                <Text size="2" color="gray" className="mb-1">
                  직장이름
                </Text>
                <input
                  name="workplace_name"
                  value={formData.workplace_name}
                  onChange={handleChange}
                  placeholder="예) ABC회사"
                  className="
                    w-full p-2 border border-gray-6 rounded text-gray-12
                    focus:outline-none focus:border-gray-8
                  "
                />
              </Box>

              {/* 직장주소 */}
              <Box mb="3">
                <Text size="2" color="gray" className="mb-1">
                  직장주소
                </Text>
                <input
                  name="workplace_address"
                  value={formData.workplace_address}
                  onChange={handleChange}
                  placeholder="예) 서울시 마포구 ..."
                  className="
                    w-full p-2 border border-gray-6 rounded text-gray-12
                    focus:outline-none focus:border-gray-8
                  "
                />
              </Box>

              <Flex justify="end" gap="2" mt="3">
                <Button
                  variant="soft"
                  color="gray"
                  type="button"
                  onClick={() => onOpenChange(false)}
                >
                  닫기
                </Button>
                <Button type="submit" variant="solid" disabled={isSubmitting}>
                  {isSubmitting ? "저장 중..." : "저장"}
                </Button>
              </Flex>
            </>
          )}
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
