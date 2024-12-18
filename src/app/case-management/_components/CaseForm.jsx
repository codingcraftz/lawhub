// src/app/boards/_components/CaseForm.jsx

"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Flex, Text, Button, Dialog, Switch } from "@radix-ui/themes";
import * as yup from "yup";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import UserSelectionModalContent from "./UserSelectionModalContent";
import OpponentSelectionModalContent from "./OpponentSelectionModalContent";
import CustomDatePicker from "@/components/CustomDatePicker";
import { COURT_CITIES, COURT_LIST } from "@/utils/courtList";
import { CASE_TYPE_OPTIONS } from "@/utils/caseType";
import { Cross2Icon } from "@radix-ui/react-icons";
import useRoleRedirect from "@/hooks/userRoleRedirect";

const schema = yup.object().shape({
  isDateUndefined: yup.boolean(),
  start_date: yup
    .date()
    .nullable()
    .when("isDateUndefined", {
      is: false,
      then: (schema) => schema.nullable(),
      otherwise: (schema) => schema.notRequired(),
    }),
  category_id: yup.string().nullable(),
  court_name: yup.string().nullable(),
  case_year: yup.number().nullable().typeError("숫자만 입력 가능합니다."),
  case_type: yup.string().nullable(),
  case_subject: yup.string().nullable(),
  case_number: yup.number().nullable().typeError("숫자만 입력 가능합니다."),
  description: yup.string().nullable(),
});

const clientRoles = [
  "미정",
  "원고",
  "피고",
  "신청인",
  "피신청인",
  "고소인",
  "피고소인",
  "채권자",
  "채무자",
];

const CaseForm = ({ caseData, onSuccess, onClose }) => {
  const [categories, setCategories] = useState([]);
  const [filteredCaseTypes, setFilteredCaseTypes] = useState([]);
  const [selectedClients, setSelectedClients] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [selectedOpponents, setSelectedOpponents] = useState([]);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isOpponentModalOpen, setIsOpponentModalOpen] = useState(false);
  const [isDateUndefined, setIsDateUndefined] = useState(
    caseData?.start_date === null,
  );
  const [clientRole, setClientRole] = useState("미정");
  const [isScheduled, setIsScheduled] = useState(
    caseData?.status === "scheduled",
  );
  const [selectedCity, setSelectedCity] = useState("");
  const [filteredCourts, setFilteredCourts] = useState([]);
  useRoleRedirect(["staff", "admin"], "/");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: caseData || {},
  });
  const selectedCategoryId = watch("category_id");

  const handleDateUndefinedChange = (checked) => {
    setIsDateUndefined(checked);
    setValue("isDateUndefined", checked);
    if (checked) {
      setValue("start_date", null);
    }
  };

  useEffect(() => {
    fetchCategories();
    if (caseData) {
      fetchCaseRelations();
      setClientRole(caseData.client_role || clientRoles[0]);
    }
  }, [caseData]);

  useEffect(() => {
    if (categories.length > 0 && selectedCategoryId) {
      const selectedCategory = categories.find(
        (category) => category.id === selectedCategoryId,
      );
      if (selectedCategory && CASE_TYPE_OPTIONS[selectedCategory?.name]) {
        setFilteredCaseTypes(CASE_TYPE_OPTIONS[selectedCategory?.name]);
      } else {
        setFilteredCaseTypes([]);
      }
    }
  }, [categories, selectedCategoryId]);

  useEffect(() => {
    // city 설정
    if (caseData?.court_name) {
      const court = COURT_LIST.find((c) => c.name === caseData.court_name);
      if (court && court.city) {
        setSelectedCity(court.city);
      }
    }
  }, [caseData]);

  useEffect(() => {
    if (selectedCity) {
      const courts = COURT_LIST.filter((court) => court.city === selectedCity);
      setFilteredCourts(courts);
      if (!caseData?.court_name) {
        setValue("court_name", "");
      }
    } else {
      setFilteredCourts([]);
      if (!caseData?.court_name) {
        setValue("court_name", "");
      }
    }
  }, [selectedCity, setValue, caseData]);

  useEffect(() => {
    // filteredCourts가 준비되면 court_name 설정
    if (caseData?.court_name && filteredCourts.length > 0) {
      const courtExists = filteredCourts.find(
        (court) => court.name === caseData.court_name,
      );
      if (courtExists) {
        setValue("court_name", caseData.court_name);
      } else {
        // court_name이 리스트에 없으면 빈값
        setValue("court_name", "");
      }
    }
  }, [caseData, filteredCourts, setValue]);

  useEffect(() => {
    // case_type 설정
    if (caseData?.case_type && filteredCaseTypes.length > 0) {
      const typeExists = filteredCaseTypes.find(
        (t) => t.name === caseData.case_type,
      );
      if (typeExists) {
        setValue("case_type", caseData.case_type);
      } else {
        setValue("case_type", "");
      }
    }
  }, [caseData, filteredCaseTypes, setValue]);

  useEffect(() => {
    // isDateUndefined 설정
    if (caseData && caseData.start_date === null) {
      setIsDateUndefined(true);
      setValue("isDateUndefined", true);
    } else {
      setIsDateUndefined(false);
      setValue("isDateUndefined", false);
    }
  }, [caseData, setValue]);

  const fetchCategories = async () => {
    const { data, error } = await supabase.from("case_categories").select("*");
    if (error) {
      console.error("카테고리 불러오기 오류:", error);
    } else {
      setCategories(data);
      if (caseData?.category_id) {
        setValue("category_id", caseData.category_id);
      }
    }
  };

  const fetchCaseRelations = async () => {
    const { data: clientData, error: clientError } = await supabase
      .from("case_clients")
      .select("client_id, client:users(name)")
      .eq("case_id", caseData.id);

    if (!clientError) {
      const clients = clientData.map((item) => ({
        id: item.client_id,
        name: item.client.name,
      }));
      setSelectedClients(clients);
    }

    const { data: staffData, error: staffError } = await supabase
      .from("case_staff")
      .select("staff_id, staff:users(name)")
      .eq("case_id", caseData.id);

    if (!staffError) {
      const staff = staffData.map((item) => ({
        id: item.staff_id,
        name: item.staff.name,
      }));
      setSelectedStaff(staff);
    }

    const { data: opponentData, error: opponentError } = await supabase
      .from("case_opponents")
      .select(
        "opponent_id, opponent:opponents(name, registration_number, address, phone_number)",
      )
      .eq("case_id", caseData.id);

    if (!opponentError) {
      const opponents = opponentData.map((item) => ({
        id: item.opponent_id,
        name: item.opponent.name,
        registration_number: item.opponent.registration_number,
        address: item.opponent.address,
        phone_number: item.opponent.phone_number,
      }));
      setSelectedOpponents(opponents);
    }
  };

  const onSubmit = async (data) => {
    try {
      let casePayload = {
        court_name: data.court_name || null,
        case_year: data.case_year || null,
        case_type: data.case_type || null,
        case_subject: data.case_subject || null,
        description: data.description || null,
        start_date: data.start_date || null,
        category_id: data.category_id || null,
        status: isScheduled ? "scheduled" : "ongoing",
        client_role: clientRole,
        case_number: data.case_number || null,
      };

      let insertedCase;
      if (caseData) {
        const { data: updatedCase, error } = await supabase
          .from("cases")
          .update(casePayload)
          .eq("id", caseData.id)
          .select("*");

        if (error) throw error;
        insertedCase = updatedCase[0];
        await supabase.from("case_clients").delete().eq("case_id", caseData.id);
        await supabase.from("case_staff").delete().eq("case_id", caseData.id);
        await supabase
          .from("case_opponents")
          .delete()
          .eq("case_id", caseData.id);
      } else {
        const { data: newCase, error } = await supabase
          .from("cases")
          .insert([casePayload])
          .select("*");

        if (error) throw error;
        insertedCase = newCase[0];
      }

      const clientEntries = selectedClients.map((client) => ({
        case_id: insertedCase.id,
        client_id: client.id,
        role: clientRole,
      }));
      const staffEntries = selectedStaff.map((staff) => ({
        case_id: insertedCase.id,
        staff_id: staff.id,
      }));
      const opponentEntries = selectedOpponents.map((opponent) => ({
        case_id: insertedCase.id,
        opponent_id: opponent.id,
      }));

      if (clientEntries.length > 0) {
        await supabase.from("case_clients").insert(clientEntries);
      } else {
        // 의뢰인이 없을 경우 기본 클라이언트 설정 또는 그냥 넘어갈 수도 있음.
        // 여기서는 기본 의뢰인 insert 예시(원치않으면 제거)
        await supabase.from("case_clients").insert({
          case_id: insertedCase.id,
          client_id: "e8353222-07e6-4d05-ac2c-5e004c043ce6",
        });
      }
      if (staffEntries.length > 0) {
        await supabase.from("case_staff").insert(staffEntries);
      }
      if (opponentEntries.length > 0) {
        await supabase.from("case_opponents").insert(opponentEntries);
      }

      if (!caseData) {
        for (const staff of selectedStaff) {
          await supabase.from("notifications").insert({
            user_id: staff.id,
            case_id: insertedCase.id,
            type: "배정",
            message: `${insertedCase.title}`,
            is_read: false,
          });
        }
      }

      onSuccess();
    } catch (error) {
      console.error("사건 저장 중 오류:", error);
      alert("사건 정보 저장 중 오류가 발생했습니다.");
    }
  };

  const onDelete = async () => {
    if (!caseData?.id) return;
    if (window.confirm("정말로 이 사건을 삭제하시겠습니까?")) {
      try {
        const { error } = await supabase
          .from("cases")
          .delete()
          .eq("id", caseData.id);

        if (error) {
          console.error("삭제 오류:", error);
          alert(`삭제 중 오류가 발생했습니다: ${error.message}`);
          throw error;
        }

        onSuccess();
      } catch (error) {
        console.error("사건 삭제 중 오류:", error);
        alert("사건 삭제 중 오류가 발생했습니다.");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        type="hidden"
        {...register("isDateUndefined")}
        value={isDateUndefined}
      />
      <Flex direction="column" gap="4">
        <Flex className="ml-auto" align="center" gap="2">
          <Text size="3">진행 예정</Text>
          <Switch
            checked={isScheduled}
            onCheckedChange={(checked) => setIsScheduled(checked)}
          />
        </Flex>
        <Box className="flex flex-col gap-2">
          <Text size="3">사건 유형 (필수 X)</Text>
          <select
            {...register("category_id")}
            style={{
              width: "100%",
              padding: "0.6rem 0.8rem",
              border: "2px solid var(--gray-6)",
              borderRadius: "var(--radius-1)",
            }}
          >
            <option value="">카테고리 선택</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.category_id && (
            <Text color="red" size="2">
              {errors.category_id.message}
            </Text>
          )}
        </Box>

        <Box className="flex flex-col gap-2">
          <Text size="3" mb="2">
            법원 선택 (필수 X)
          </Text>
          <Flex gap="2">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              style={{
                width: "100%",
                padding: "0.6rem 0.8rem",
                border: "2px solid var(--gray-6)",
                borderRadius: "var(--radius-1)",
              }}
            >
              <option value="">도시 선택</option>
              {COURT_CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <select
              {...register("court_name")}
              style={{
                width: "100%",
                padding: "0.6rem 0.8rem",
                border: "2px solid var(--gray-6)",
                borderRadius: "var(--radius-1)",
              }}
            >
              <option value="">법원 선택</option>
              {filteredCourts.map((court) => (
                <option key={court.id} value={court.name}>
                  {court.name}
                </option>
              ))}
            </select>
            {errors.court_name && (
              <Text color="red">{errors.court_name.message}</Text>
            )}
          </Flex>
        </Box>

        {/* 사건 정보 */}
        <Box className="flex flex-col gap-2">
          <Text size="3" mb="2">
            사건 번호 (필수 X)
          </Text>
          <Flex gap="4" align="center">
            <label>사건 연도</label>
            <input
              placeholder="(예: 2023)"
              {...register("case_year")}
              style={{
                flex: 1,
                padding: "0.6rem",
                border: "2px solid var(--gray-6)",
                borderRadius: "var(--radius-1)",
              }}
            />
            <label>사건 구분</label>
            <select
              {...register("case_type")}
              style={{
                flex: 1,
                padding: "0.6rem",
                border: "2px solid var(--gray-6)",
                borderRadius: "var(--radius-1)",
              }}
            >
              <option value="">사건 타입</option>
              {filteredCaseTypes.map((type) => (
                <option key={type.code} value={type.name}>
                  {type.name}
                </option>
              ))}
            </select>
          </Flex>
          <Flex gap="4" align={"center"}>
            <label>사건 번호</label>
            <input
              placeholder="(예: 75902)"
              {...register("case_number")}
              style={{
                flex: 1,
                padding: "0.6rem",
                border: "2px solid var(--gray-6)",
                borderRadius: "var(--radius-1)",
              }}
            />
            <label>사건 세부</label>
            <input
              placeholder="(예: 손해배상(기))"
              {...register("case_subject")}
              style={{
                flex: 1,
                padding: "0.6rem",
                border: "2px solid var(--gray-6)",
                borderRadius: "var(--radius-1)",
              }}
            />
          </Flex>
          {(errors.case_year || errors.case_type || errors.case_number) && (
            <Text color="red">
              {errors.case_year?.message ||
                errors.case_type?.message ||
                errors.case_number?.message}
            </Text>
          )}
        </Box>

        <Box>
          <textarea
            placeholder="사건 설명 (필수 X)"
            {...register("description")}
            style={{
              width: "100%",
              padding: "0.6rem 0.8rem",
              border: "2px solid var(--gray-6)",
              borderRadius: "var(--radius-1)",
              minHeight: "100px",
            }}
          />
        </Box>

        <Box className="flex flex-col gap-2">
          <Flex align="center" gap="3">
            <Text size="3">의뢰 개시일 (필수 X)</Text>
            <Box>
              <input
                className="mr-1"
                type="checkbox"
                checked={isDateUndefined}
                onChange={(e) => handleDateUndefinedChange(e.target.checked)}
              />
              <label htmlFor="date-undefined-checkbox">미정</label>
            </Box>
          </Flex>
          {!isDateUndefined && (
            <Controller
              control={control}
              name="start_date"
              render={({ field }) => (
                <CustomDatePicker
                  title="의뢰 개시 날짜 선택"
                  selectedDate={field.value}
                  onDateChange={(date) => field.onChange(date)}
                />
              )}
            />
          )}
          {errors.start_date && (
            <Text color="red">{errors.start_date.message}</Text>
          )}
        </Box>
        <Box className="flex flex-col gap-2">
          <label htmlFor="client-role">의뢰인 역할 (필수 X)</label>
          <select
            id="client-role"
            value={clientRole}
            onChange={(e) => setClientRole(e.target.value)}
            style={{
              width: "100%",
              padding: "0.6rem 0.8rem",
              border: "2px solid var(--gray-6)",
              borderRadius: "var(--radius-1)",
            }}
          >
            {clientRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </Box>

        <Box>
          <Button
            className="mr-2"
            type="button"
            onClick={() => setIsClientModalOpen(true)}
          >
            의뢰인 선택
          </Button>
          {selectedClients.length > 0 && (
            <Text>{selectedClients.map((c) => c.name).join(", ")}</Text>
          )}
        </Box>
        {/* 담당자 선택 */}
        <Box>
          <Button
            className="mr-2"
            type="button"
            onClick={() => setIsStaffModalOpen(true)}
          >
            담당자 선택
          </Button>
          {selectedStaff.length > 0 && (
            <Text>{selectedStaff.map((s) => s.name).join(", ")}</Text>
          )}
        </Box>

        {/* 상대방 선택 */}
        <Box>
          <Button
            className="mr-2"
            type="button"
            onClick={() => setIsOpponentModalOpen(true)}
          >
            상대방 선택
          </Button>
          {selectedOpponents.length > 0 && (
            <Text>{selectedOpponents.map((o) => o.name).join(", ")}</Text>
          )}
        </Box>

        <Flex gap="3" mt="4" justify="end">
          {caseData && (
            <Button type="button" variant="soft" color="red" onClick={onDelete}>
              삭제
            </Button>
          )}
          <Button type="button" variant="soft" color="gray" onClick={onClose}>
            취소
          </Button>
          <Button type="submit">등록</Button>
        </Flex>
      </Flex>

      {/* 의뢰인 선택 모달 */}
      <Dialog.Root open={isClientModalOpen} onOpenChange={setIsClientModalOpen}>
        <Dialog.Content style={{ maxWidth: 450 }}>
          <Dialog.Title>의뢰인 선택</Dialog.Title>
          <Dialog.Close asChild>
            <Button
              variant="ghost"
              color="gray"
              size="1"
              style={{ position: "absolute", top: 8, right: 8 }}
            >
              <Cross2Icon />
            </Button>
          </Dialog.Close>
          <UserSelectionModalContent
            userType="client"
            selectedUsers={selectedClients}
            setSelectedUsers={setSelectedClients}
            onClose={() => setIsClientModalOpen(false)}
          />
        </Dialog.Content>
      </Dialog.Root>

      {/* 담당자 선택 모달 */}
      <Dialog.Root open={isStaffModalOpen} onOpenChange={setIsStaffModalOpen}>
        <Dialog.Content style={{ maxWidth: 450 }}>
          <Dialog.Title>담당자 선택</Dialog.Title>
          <Dialog.Close asChild>
            <Button
              variant="ghost"
              color="gray"
              size="1"
              style={{ position: "absolute", top: 8, right: 8 }}
            >
              <Cross2Icon />
            </Button>
          </Dialog.Close>
          <UserSelectionModalContent
            userType="staff"
            selectedUsers={selectedStaff}
            setSelectedUsers={setSelectedStaff}
            onClose={() => setIsStaffModalOpen(false)}
          />
        </Dialog.Content>
      </Dialog.Root>

      {/* 상대방 선택 모달 */}
      <Dialog.Root
        open={isOpponentModalOpen}
        onOpenChange={setIsOpponentModalOpen}
      >
        <Dialog.Content style={{ maxWidth: 450 }}>
          <Dialog.Title>상대방 추가</Dialog.Title>
          <Dialog.Close asChild>
            <Button
              variant="ghost"
              color="gray"
              size="1"
              style={{ position: "absolute", top: 8, right: 8 }}
            >
              <Cross2Icon />
            </Button>
          </Dialog.Close>
          <OpponentSelectionModalContent
            selectedOpponents={selectedOpponents}
            setSelectedOpponents={setSelectedOpponents}
            onClose={() => setIsOpponentModalOpen(false)}
          />
        </Dialog.Content>
      </Dialog.Root>
    </form>
  );
};

export default CaseForm;
