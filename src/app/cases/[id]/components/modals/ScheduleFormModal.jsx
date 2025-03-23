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
import FileUploadDropzone from "@/components/ui/file-upload-dropzone";

// 스토리지 버킷 이름 정의
const BUCKET_NAME = "case-files";

export default function ScheduleFormModal({
  open,
  onOpenChange,
  lawsuit,
  onSuccess,
  editingSchedule,
  caseDetails = null,
  clients = null,
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
  const [fileToUpload, setFileToUpload] = useState(null);

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
        setFileToUpload(null);
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

    setFileToUpload(null);
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

  // 일정에 대한 알림 생성 함수
  const createNotificationsForSchedule = async (scheduleData) => {
    if (!lawsuit || !lawsuit.id) {
      console.error("알림 생성: 사건 ID가 없습니다");
      return;
    }

    try {
      // 모든 의뢰인과 담당자의 ID를 수집하기 위한 Set
      const userIds = new Set();

      // 사건 담당자 조회 - 전달받은 caseDetails를 사용하거나, 없으면 직접 조회
      if (caseDetails && caseDetails.handlers) {
        // props로 전달된 handlers 배열 사용
        caseDetails.handlers.forEach((handler) => {
          if (handler.user_id) {
            userIds.add(handler.user_id);
          }
        });
      } else {
        // 직접 API로 조회
        const { data: handlersData, error: handlersError } = await supabase
          .from("test_case_handlers")
          .select("user_id")
          .eq("case_id", lawsuit.id);

        if (handlersError) {
          console.error("사건 담당자 조회 실패:", handlersError);
        } else if (handlersData) {
          handlersData.forEach((handler) => {
            if (handler.user_id) {
              userIds.add(handler.user_id);
            }
          });
        }
      }

      // 개인 및 법인 의뢰인 처리 - 전달받은 clients를 사용하거나, 없으면 직접 조회
      if (clients && clients.length > 0) {
        // props로 전달된 clients 배열 사용
        clients.forEach((client) => {
          if (client.client_type === "individual" && client.individual_id) {
            userIds.add(client.individual_id);
          }
        });

        // 법인 의뢰인의 경우 멤버 정보도 필요하므로 조직 ID 수집
        const orgIds = clients
          .filter((client) => client.client_type === "organization" && client.organization_id)
          .map((client) => client.organization_id);

        if (orgIds.length > 0) {
          // 법인 멤버 조회
          const { data: orgMembers, error: orgMembersError } = await supabase
            .from("test_organization_members")
            .select("user_id")
            .in("organization_id", orgIds);

          if (orgMembersError) {
            console.error("조직 멤버 조회 실패:", orgMembersError);
          } else if (orgMembers) {
            orgMembers.forEach((member) => {
              if (member.user_id) {
                userIds.add(member.user_id);
              }
            });
          }
        }
      } else {
        // 직접 API로 조회
        const { data: clientsData, error: clientsError } = await supabase
          .from("test_case_clients")
          .select(
            `
            client_type,
            individual_id, 
            organization_id
          `
          )
          .eq("case_id", lawsuit.id);

        if (clientsError) {
          console.error("의뢰인 조회 실패:", clientsError);
        } else if (clientsData) {
          // 개인 의뢰인 ID 추가
          clientsData.forEach((client) => {
            if (client.client_type === "individual" && client.individual_id) {
              userIds.add(client.individual_id);
            }
          });

          // 법인 의뢰인의 멤버 조회 및 추가
          const orgIds = clientsData
            .filter((client) => client.client_type === "organization" && client.organization_id)
            .map((client) => client.organization_id);

          if (orgIds.length > 0) {
            const { data: orgMembers, error: orgMembersError } = await supabase
              .from("test_organization_members")
              .select("user_id")
              .in("organization_id", orgIds);

            if (orgMembersError) {
              console.error("조직 멤버 조회 실패:", orgMembersError);
            } else if (orgMembers) {
              orgMembers.forEach((member) => {
                if (member.user_id) {
                  userIds.add(member.user_id);
                }
              });
            }
          }
        }
      }

      // 사건 제목 또는 기본값 설정
      const caseTitle = lawsuit.case_number ? `${lawsuit.case_number} ` : "사건 일정";

      // 알림 메시지 생성
      const formattedDate = format(new Date(scheduleData.event_date), "yyyy년 MM월 dd일 HH:mm", {
        locale: ko,
      });

      const title = `${caseTitle} - 일정`;
      const message = `${formattedDate}에 ${scheduleData.title} 일정이 ${
        isEditMode ? "수정" : "추가"
      }되었습니다.`;

      // 1. 사건 알림 생성 (test_case_notifications 테이블)
      const caseNotification = {
        case_id: lawsuit.id,
        title: title,
        message: message,
        notification_type: "schedule",
        created_at: new Date().toISOString(),
      };

      const { error: caseNotificationError } = await supabase
        .from("test_case_notifications")
        .insert(caseNotification);

      if (caseNotificationError) {
        console.error("사건 알림 생성 실패:", caseNotificationError);
      } else {
        console.log("사건 알림이 생성되었습니다");
      }

      // 2. 개인 알림 생성 (test_individual_notifications 테이블)
      const uniqueUserIds = Array.from(userIds);

      if (uniqueUserIds.length === 0) {
        console.log("알림을 받을 사용자가 없습니다");
        return;
      }

      console.log(`${uniqueUserIds.length}명의 사용자에게 개인 알림을 생성합니다`);

      // 각 사용자에 대한 알림 생성
      const individualNotifications = uniqueUserIds.map((userId) => ({
        user_id: userId,
        case_id: lawsuit.id,
        title: title,
        message: message,
        notification_type: "schedule",
        created_at: new Date().toISOString(),
      }));

      const { error: individualNotificationError } = await supabase
        .from("test_individual_notifications")
        .insert(individualNotifications);

      if (individualNotificationError) {
        console.error("개인 알림 생성 실패:", individualNotificationError);
      } else {
        console.log(`${uniqueUserIds.length}개의 개인 알림이 생성되었습니다`);
      }
    } catch (error) {
      console.error("알림 생성 중 오류 발생:", error);
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

  // 파일 선택 핸들러
  const handleFileChange = (file) => {
    if (!file) return;

    // 파일 사이즈 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("파일 크기 초과", {
        description: "10MB 이하의 파일만 업로드할 수 있습니다.",
      });
      return;
    }

    setFileToUpload(file);
  };

  // 파일 삭제 핸들러
  const resetFileUpload = () => {
    setFileToUpload(null);
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

      // 파일 업로드 처리
      let fileUrl = isEditMode ? editingSchedule?.file_url || null : null;

      if (fileToUpload) {
        // 파일 이름에 타임스탬프 추가하여 중복 방지
        const fileExt = fileToUpload.name.split(".").pop();
        const fileName = `${lawsuit.case_id}/${lawsuit.id}/${Math.random()
          .toString(36)
          .substring(2)}.${fileExt}`;
        const filePath = `schedule-files/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, fileToUpload);

        if (uploadError) {
          console.error("파일 업로드 오류:", uploadError);
          throw uploadError;
        }

        // 파일 URL 생성
        const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
        fileUrl = urlData.publicUrl;
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
          file_url: fileUrl,
          updated_at: new Date().toISOString(),
        };

        // 파일 URL이 변경되지 않았다면 업데이트 데이터에서 제외
        if (fileUrl === editingSchedule.file_url) {
          delete updatedSchedule.file_url;
        }

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
          file_url: fileUrl,
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
            <Input
              id="event_type"
              value={scheduleFormData.event_type}
              onChange={(e) => handleScheduleInputChange("event_type", e.target.value)}
              placeholder="기일 유형을 입력하세요"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleScheduleInputChange("event_type", "변론기일")}
              >
                변론기일
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleScheduleInputChange("event_type", "선고기일")}
              >
                선고기일
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleScheduleInputChange("event_type", "준비기일")}
              >
                준비기일
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleScheduleInputChange("event_type", "조정기일")}
              >
                조정기일
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleScheduleInputChange("event_type", "심문기일")}
              >
                심문기일
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              자주 사용하는 유형을 버튼으로 선택하거나 직접 입력하세요.
            </p>
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

          {/* 파일 업로드 영역 추가 */}
          <div className="space-y-2">
            <Label htmlFor="file">첨부파일</Label>
            <FileUploadDropzone
              onFileSelect={handleFileChange}
              onFileRemove={resetFileUpload}
              selectedFile={fileToUpload}
              existingFileUrl={editingSchedule?.file_url || null}
              fileUrlLabel="기존 파일이 있습니다"
              uploadLabel="파일을 이곳에 끌어서 놓거나 클릭하여 업로드"
              replaceLabel="파일을 이곳에 끌어서 놓거나 클릭하여 교체"
              id="schedule-file"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              maxSizeMB={10}
            />
            <p className="text-xs text-muted-foreground">
              기일 관련 문서를 첨부할 수 있습니다. (최대 10MB)
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
