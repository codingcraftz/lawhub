"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { supabase } from "@/utils/supabase";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";

export default function ScheduleFormModal({
  open,
  onOpenChange,
  lawsuit,
  onSuccess,
  editingSchedule,
}) {
  const { user } = useUser();
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scheduleFormData, setScheduleFormData] = useState({
    title: "",
    event_type: "",
    event_date: new Date(),
    location: "",
    description: "",
  });

  const isEditMode = !!editingSchedule;

  // 모달이 열릴 때 폼 초기화
  useEffect(() => {
    if (open) {
      if (editingSchedule && editingSchedule.id) {
        // 수정 모드일 경우 기존 데이터로 폼 초기화
        setScheduleFormData({
          title: editingSchedule.title || "",
          event_type: editingSchedule.event_type || "",
          event_date: editingSchedule.event_date
            ? new Date(editingSchedule.event_date)
            : new Date(),
          location: editingSchedule.location || "",
          description: editingSchedule.description || "",
        });
      } else {
        // 추가 모드일 경우 기본값으로 폼 초기화
        resetScheduleForm();

        // 소송 정보가 있을 때 당사자 정보를 가져와서 설명에 미리 채워넣기
        if (lawsuit && lawsuit.id) {
          (async () => {
            try {
              // 당사자 정보 가져오기
              const { creditor, debtor } = await getLawsuitParties(lawsuit.id);

              // 당사자 정보 문자열 생성
              let partyInfoText = "";
              if (creditor || debtor) {
                const parts = [];

                if (creditor) {
                  const creditorLabel = getPartyTypeLabel(creditor.party_type);
                  const creditorName =
                    creditor.entity_type === "individual"
                      ? creditor.name
                      : creditor.company_name || "이름 정보 없음";
                  parts.push(`${creditorLabel}: ${creditorName}`);
                }

                if (debtor) {
                  const debtorLabel = getPartyTypeLabel(debtor.party_type);
                  const debtorName =
                    debtor.entity_type === "individual"
                      ? debtor.name
                      : debtor.company_name || "이름 정보 없음";
                  parts.push(`${debtorLabel}: ${debtorName}`);
                }

                if (parts.length > 0) {
                  partyInfoText = `당사자: ${parts.join(", ")}`;

                  // 설명란에 당사자 정보 미리 채우기
                  setScheduleFormData((prev) => ({
                    ...prev,
                    description: partyInfoText,
                  }));
                }
              }
            } catch (error) {
              console.error("당사자 정보 조회 실패:", error);
            }
          })();
        }
      }
    }
  }, [open, lawsuit, editingSchedule]);

  // 폼 초기화
  const resetScheduleForm = () => {
    const defaultTitle = lawsuit && lawsuit.case_number ? `${lawsuit.case_number} ` : "";

    setScheduleFormData({
      title: defaultTitle,
      event_type: "",
      event_date: new Date(),
      location: "",
      description: "",
    });

    setFormErrors({});
  };

  // 입력 처리
  const handleScheduleInputChange = (field, value) => {
    let updatedFormData = {
      ...scheduleFormData,
      [field]: value,
    };

    // event_type이 변경될 때 제목에 자동으로 기일 유형 추가
    if (field === "event_type" && value) {
      const currentTitle = scheduleFormData.title || "";
      // 현재 제목이 사건번호만 있거나 비어있으면 기일 유형 추가
      if (
        lawsuit &&
        (currentTitle.trim() === lawsuit.case_number.trim() || currentTitle.trim() === "")
      ) {
        updatedFormData.title = `${lawsuit.case_number} ${value}`;
      }
    }

    setScheduleFormData(updatedFormData);

    // 입력 시 오류 초기화
    if (formErrors[field]) {
      setFormErrors({
        ...formErrors,
        [field]: null,
      });
    }
  };

  // 폼 유효성 검사
  const validateScheduleForm = () => {
    const errors = {};

    if (!scheduleFormData.title) errors.title = "제목을 입력해주세요";
    if (!scheduleFormData.event_type) errors.event_type = "기일 유형을 입력해주세요";
    if (!scheduleFormData.event_date) errors.event_date = "날짜를 선택해주세요";
    if (!scheduleFormData.location) errors.location = "장소를 입력해주세요";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 당사자 유형 라벨 얻기
  const getPartyTypeLabel = (type) => {
    const labels = {
      plaintiff: "원고",
      defendant: "피고",
      creditor: "채권자",
      debtor: "채무자",
      applicant: "신청인",
      respondent: "피신청인",
    };
    return labels[type] || type;
  };

  // 알림 생성
  const createNotificationsForSchedule = async (schedule) => {
    try {
      // 알림을 받을 사용자 목록 조회 (사건 담당자들)
      const { data: handlers, error: handlersError } = await supabase
        .from("test_case_handlers")
        .select("user_id")
        .eq("case_id", schedule.case_id);

      if (handlersError) throw handlersError;

      // 사건의 클라이언트 목록 조회
      const { data: clients, error: clientsError } = await supabase
        .from("test_case_clients")
        .select(
          `
          individual_id,
          organization_id
        `
        )
        .eq("case_id", schedule.case_id);

      if (clientsError) throw clientsError;

      // 알림 대상 사용자 ID 목록 생성
      const userIds = new Set();

      // 담당자 추가
      if (handlers && handlers.length > 0) {
        handlers.forEach((handler) => {
          if (handler.user_id) userIds.add(handler.user_id);
        });
      }

      // 개인 클라이언트 추가
      if (clients && clients.length > 0) {
        clients.forEach((client) => {
          if (client.individual_id) userIds.add(client.individual_id);
        });
      }

      // 알림 메시지 생성
      const title = `${schedule.case_number} 기일`;
      const message = `${schedule.event_type} 기일이 등록되었습니다. (${format(
        new Date(schedule.event_date),
        "yyyy년 MM월 dd일",
        { locale: ko }
      )})`;

      // Set을 배열로 변환
      const uniqueUserIds = Array.from(userIds);

      // 사용자 ID가 비어있는지 확인
      if (uniqueUserIds.length === 0) {
        console.error("알림 생성 실패: 알림 수신자가 없습니다.");
        return;
      }

      // 각 사용자에 대한 알림 데이터 생성
      const notifications = uniqueUserIds.map((userId) => ({
        user_id: userId,
        case_id: schedule.case_id,
        title: title,
        message: message,
        notification_type: "schedule",
        is_read: false,
        created_at: new Date().toISOString(),
      }));

      // 알림 저장
      const { error: notifyError } = await supabase
        .from("test_case_notifications")
        .insert(notifications);

      if (notifyError) {
        console.error("알림 저장 실패:", notifyError);
        throw notifyError;
      }
    } catch (error) {
      console.error("알림 생성 실패:", error);
      // 알림 실패는 기일 추가 자체를 중단시키지 않음
    }
  };

  // 소송의 당사자 정보 가져오기
  const getLawsuitParties = async (lawsuitId) => {
    try {
      if (!lawsuitId) {
        return { creditor: null, debtor: null };
      }

      // 소송 당사자 관계 조회
      const { data: lawsuitParties, error: lawsuitPartiesError } = await supabase
        .from("test_lawsuit_parties")
        .select("party_id, party_type")
        .eq("lawsuit_id", lawsuitId);

      if (lawsuitPartiesError) {
        throw lawsuitPartiesError;
      }

      if (!lawsuitParties || lawsuitParties.length === 0) {
        return { creditor: null, debtor: null };
      }

      // 당사자 ID 목록 추출
      const partyIds = lawsuitParties.map((p) => p.party_id);

      // 당사자 상세 정보 조회
      const { data: partiesData, error: partiesError } = await supabase
        .from("test_case_parties")
        .select("*")
        .in("id", partyIds);

      if (partiesError) {
        throw partiesError;
      }

      if (!partiesData || partiesData.length === 0) {
        return { creditor: null, debtor: null };
      }

      // 당사자 관계와 상세 정보 결합
      const parties = partiesData.map((party) => {
        const lawsuitParty = lawsuitParties.find((lp) => lp.party_id === party.id);
        return {
          ...party,
          party_type: lawsuitParty?.party_type,
        };
      });

      // 원고/채권자/신청인 및 피고/채무자/피신청인 찾기
      let creditor = null;
      let debtor = null;

      parties.forEach((party) => {
        if (["plaintiff", "creditor", "applicant"].includes(party.party_type)) {
          creditor = party;
        } else if (["defendant", "debtor", "respondent"].includes(party.party_type)) {
          debtor = party;
        }
      });

      return { creditor, debtor };
    } catch (error) {
      console.error("당사자 정보 조회 실패:", error);
      return { creditor: null, debtor: null };
    }
  };

  // 기일 추가 제출 처리
  const handleSubmitSchedule = async (e) => {
    e.preventDefault();

    if (!user || (user.role !== "admin" && user.role !== "staff")) {
      toast.error("권한이 없습니다", {
        description: "관리자 또는 직원만 기일을 추가할 수 있습니다",
      });
      return;
    }

    if (!validateScheduleForm()) return;

    setIsSubmitting(true);

    try {
      if (!lawsuit || !lawsuit.id) {
        throw new Error("유효한 소송 정보가 없습니다.");
      }

      if (isEditMode && editingSchedule && editingSchedule.id) {
        // 수정 모드
        const updatedSchedule = {
          title: scheduleFormData.title,
          event_type: scheduleFormData.event_type,
          event_date: scheduleFormData.event_date.toISOString(),
          end_date: scheduleFormData.event_date.toISOString(), // 기본적으로 같은 날짜로 설정
          location: scheduleFormData.location,
          description: scheduleFormData.description.trim() || null,
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from("test_schedules")
          .update(updatedSchedule)
          .eq("id", editingSchedule.id)
          .select()
          .single();

        if (error) {
          console.error("기일 수정 실패:", error);
          throw error;
        }

        toast.success("기일이 수정되었습니다", {
          description: "기일이 성공적으로 수정되었습니다.",
        });

        // 수정된 데이터로 성공 콜백 호출
        if (onSuccess) {
          onSuccess(data);
        }
      } else {
        // 추가 모드
        const newSchedule = {
          title: scheduleFormData.title,
          event_type: scheduleFormData.event_type,
          event_date: scheduleFormData.event_date.toISOString(),
          end_date: scheduleFormData.event_date.toISOString(), // 기본적으로 같은 날짜로 설정
          case_id: lawsuit.case_id,
          lawsuit_id: lawsuit.id,
          location: scheduleFormData.location,
          description: scheduleFormData.description.trim() || null,
          is_important: true, // 소송 기일은 중요하게 표시
          court_name: lawsuit.court_name,
          case_number: lawsuit.case_number,
          created_by: user.id,
        };

        const { data, error } = await supabase
          .from("test_schedules")
          .insert(newSchedule)
          .select()
          .single();

        if (error) {
          console.error("기일 추가 실패:", error);
          throw error;
        }

        // 알림 생성
        await createNotificationsForSchedule(data);

        toast.success("기일이 추가되었습니다", {
          description: "기일이 성공적으로 등록되었습니다.",
        });

        // 추가된 데이터로 성공 콜백 호출
        if (onSuccess) {
          onSuccess(data);
        }
      }

      // 폼 초기화 및 다이얼로그 닫기
      resetScheduleForm();
      onOpenChange(false);
    } catch (error) {
      console.error("기일 처리 실패:", error);
      toast.error("기일 처리 실패", {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {isEditMode ? "기일 수정" : "기일 추가"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isEditMode ? "기일 정보를 수정해주세요" : "새로운 기일 정보를 입력해주세요"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmitSchedule} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="title">제목</Label>
            <Input
              id="title"
              value={scheduleFormData.title}
              onChange={(e) => handleScheduleInputChange("title", e.target.value)}
              placeholder="예: 2023가단12345 변론기일"
            />
            <p className="text-xs text-muted-foreground">
              사건번호가 자동으로 포함됩니다. 뒤에 기일 유형을 추가해주세요.
            </p>
            {formErrors.title && <p className="text-sm text-red-500">{formErrors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="event_type">기일 유형</Label>
            <Select
              value={scheduleFormData.event_type}
              onValueChange={(value) => handleScheduleInputChange("event_type", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="기일 유형 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="변론기일">변론기일</SelectItem>
                <SelectItem value="선고기일">선고기일</SelectItem>
                <SelectItem value="준비기일">준비기일</SelectItem>
                <SelectItem value="조정기일">조정기일</SelectItem>
                <SelectItem value="심문기일">심문기일</SelectItem>
                <SelectItem value="기타">기타</SelectItem>
              </SelectContent>
            </Select>
            {scheduleFormData.event_type === "기타" && (
              <Input
                className="mt-2"
                placeholder="직접 입력"
                onChange={(e) => handleScheduleInputChange("event_type", e.target.value)}
              />
            )}
            {formErrors.event_type && (
              <p className="text-sm text-red-500">{formErrors.event_type}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event_date">날짜</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduleFormData.event_date ? (
                      format(scheduleFormData.event_date, "yyyy-MM-dd")
                    ) : (
                      <span>날짜 선택</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={scheduleFormData.event_date}
                    onSelect={(date) => handleScheduleInputChange("event_date", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {formErrors.event_date && (
                <p className="text-sm text-red-500">{formErrors.event_date}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">시간</Label>
              <div className="flex gap-2">
                <Input
                  id="hours"
                  type="number"
                  min="0"
                  max="23"
                  placeholder="시"
                  value={
                    scheduleFormData.event_date
                      ? String(scheduleFormData.event_date.getHours()).padStart(2, "0")
                      : "09"
                  }
                  onChange={(e) => {
                    const newDate = new Date(scheduleFormData.event_date);
                    newDate.setHours(parseInt(e.target.value) || 0);
                    handleScheduleInputChange("event_date", newDate);
                  }}
                  className="w-1/2"
                />
                <Input
                  id="minutes"
                  type="number"
                  min="0"
                  max="59"
                  placeholder="분"
                  value={
                    scheduleFormData.event_date
                      ? String(scheduleFormData.event_date.getMinutes()).padStart(2, "0")
                      : "00"
                  }
                  onChange={(e) => {
                    const newDate = new Date(scheduleFormData.event_date);
                    newDate.setMinutes(parseInt(e.target.value) || 0);
                    handleScheduleInputChange("event_date", newDate);
                  }}
                  className="w-1/2"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">장소</Label>
            <Input
              id="location"
              value={scheduleFormData.location}
              onChange={(e) => handleScheduleInputChange("location", e.target.value)}
              placeholder="예: 서울중앙지방법원 제303호 법정"
            />
            {formErrors.location && <p className="text-sm text-red-500">{formErrors.location}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              value={scheduleFormData.description}
              onChange={(e) => handleScheduleInputChange("description", e.target.value)}
              placeholder="기일에 대한 추가 설명을 입력해주세요"
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">
              당사자 정보는 자동으로 불러와져 있으며, 필요 시 수정할 수 있습니다.
            </p>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : isEditMode ? (
                "수정"
              ) : (
                "저장"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
