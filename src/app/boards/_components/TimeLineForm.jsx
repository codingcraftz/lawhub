import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/utils/supabase";
import { Box, Flex, Text, Button, Select, TextArea } from "@radix-ui/themes";

const TimelineForm = ({ caseId, onSuccess, editingItem }) => {
  const [staff, setStaff] = useState([]);
  const [selectedType, setSelectedType] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    mode: "onChange",
    defaultValues: editingItem || {},
  });

  useEffect(() => {
    fetchStaff();
    fetchCurrentUser();
    if (editingItem) {
      Object.keys(editingItem).forEach((key) => {
        setValue(key, editingItem[key]);
      });
      setSelectedType(editingItem.type);
    }
  }, [editingItem, setValue]);

  const fetchStaff = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, role")
      .in("role", ["admin", "staff"]);

    if (error) {
      console.error("Error fetching staff:", error);
    } else {
      setStaff(data);
    }
  };

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const onSubmit = async (data) => {
    try {
      const timelineData = {
        type: data.type,
        description: data.description,
        case_id: caseId,
        status: "대기중",
        manager: currentUser.id,
      };

      if (
        data.type === "요청" &&
        data.requested_to &&
        data.requested_to !== "none"
      ) {
        timelineData.handler = data.requested_to;
        timelineData.requested_to = data.requested_to;
      }

      let result;
      if (editingItem) {
        result = await supabase
          .from("case_timelines")
          .update(timelineData)
          .eq("id", editingItem.id)
          .select();
      } else {
        result = await supabase
          .from("case_timelines")
          .insert(timelineData)
          .select();
      }

      if (result.error) throw result.error;

      if (
        !editingItem &&
        result.data &&
        result.data[0] &&
        data.type === "요청" &&
        data.requested_to &&
        data.requested_to !== "none"
      ) {
        await supabase.from("notifications").insert({
          user_id: data.requested_to,
          case_timeline_id: result.data[0].id,
          message: `새로운 요청이 있습니다: ${data.description}`,
          is_read: false,
        });
      }

      onSuccess();
    } catch (error) {
      console.error("Error saving timeline item:", error);
      alert("타임라인 항목 저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label htmlFor="type">유형</label>
          <select {...register("type")} id="type" onChange={(e) => setSelectedType(e.target.value)}>
            <option value="">선택하세요</option>
            <option value="요청">요청</option>
            <option value="완료">완료</option>
            <option value="상담">상담</option>
            <option value="접수">접수</option>
          </select>
          {errors.type && <p style={{ color: "red" }}>{errors.type.message}</p>}
        </div>
        {selectedType === "요청" && (
          <div>
            <label htmlFor="requested_to">요청 대상</label>
            <select {...register("requested_to")} id="requested_to">
              <option value="none">선택 안함</option>
              {staff.map(
                (s) =>
                  s.id && (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role})
                    </option>
                  )
              )}
            </select>
            {errors.requested_to && (
              <p style={{ color: "red" }}>{errors.requested_to.message}</p>
            )}
          </div>
        )}
        <div>
          <label htmlFor="description">설명</label>
          <textarea
            {...register("description")}
            id="description"
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
              minHeight: "100px",
            }}
          />
          {errors.description && (
            <p style={{ color: "red" }}>{errors.description.message}</p>
          )}
        </div>
        <button type="submit">{editingItem ? "수정" : "저장"}</button>
      </div>
    </form>
  );
};

export default TimelineForm;
