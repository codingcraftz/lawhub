"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, Upload, FileCheck, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const activityTypes = [
  { value: "kcb", label: "KCB조회" },
  { value: "message", label: "메세지" },
  { value: "call", label: "전화" },
  { value: "visit", label: "방문" },
  { value: "payment", label: "납부" },
  { value: "letter", label: "통지서 발송" },
  { value: "legal", label: "법적 조치" },
  { value: "other", label: "기타" },
];

const statusOptions = [
  { value: "predicted", label: "예정" },
  { value: "completed", label: "완료" },
];

export default function RecoveryActivityModal({
  open,
  onOpenChange,
  onSuccess,
  caseId,
  user,
  parties = [],
  activity = null, // 수정 시 전달되는 활동 데이터
  isEditing = false, // 수정 모드 여부
}) {
  const [formData, setFormData] = useState({
    activity_type: "",
    date: new Date(),
    description: "",
    amount: "",
    notes: "",
    status: "completed",
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [caseDetails, setCaseDetails] = useState(null);

  // 모달이 열릴 때 데이터 초기화
  useEffect(() => {
    if (open) {
      if (isEditing && activity) {
        // 수정 모드: 기존 데이터로 초기화
        setFormData({
          activity_type: activity.activity_type,
          date: new Date(activity.date),
          description: activity.description,
          amount: activity.amount ? activity.amount.toString() : "",
          notes: activity.notes || "",
          status: activity.status || "predicted",
        });
      } else {
        // 추가 모드: 기본값으로 초기화
        setFormData({
          activity_type: "",
          date: new Date(),
          description: "",
          amount: "",
          notes: "",
          status: "predicted",
        });
      }
      setFileToUpload(null);
      setFilePreview(null);
      setFormErrors({});

      // 사건 정보 불러오기
      fetchCaseDetails();
    }
  }, [open, isEditing, activity]);

  // 사건 정보 불러오기
  const fetchCaseDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("test_cases")
        .select(
          `
          *,
          clients:test_case_clients(
            individual_id(id, name, email),
            organization_id(id, name)
          ),
          parties:test_case_parties(*)
        `
        )
        .eq("id", caseId)
        .single();

      if (error) throw error;
      setCaseDetails(data);
    } catch (error) {
      console.error("사건 정보 불러오기 실패:", error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    });
    // 입력 시 오류 초기화
    if (formErrors[field]) {
      setFormErrors({
        ...formErrors,
        [field]: null,
      });
    }
  };

  const handleDateChange = (date) => {
    setFormData({
      ...formData,
      date,
    });
    if (formErrors.date) {
      setFormErrors({
        ...formErrors,
        date: null,
      });
    }
  };

  const handleTypeChange = (value) => {
    setFormData((prev) => ({ ...prev, activity_type: value }));

    if (formErrors.activity_type) {
      setFormErrors((prev) => ({ ...prev, activity_type: "" }));
    }
  };

  const handleStatusChange = (value) => {
    setFormData((prev) => ({ ...prev, status: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      setFileToUpload(file);

      // 파일 미리보기 처리
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }

      if (formErrors.file) {
        setFormErrors({
          ...formErrors,
          file: null,
        });
      }
    }
  };

  const resetFileUpload = () => {
    setFileToUpload(null);
    setFilePreview(null);
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.activity_type) errors.activity_type = "활동 유형을 선택해주세요";
    if (!formData.date) errors.date = "날짜를 선택해주세요";
    if (!formData.description) errors.description = "내용을 입력해주세요";

    if (
      formData.activity_type === "payment" &&
      (!formData.amount || isNaN(Number(formData.amount)))
    ) {
      errors.amount = "올바른 금액을 입력해주세요";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const uploadFile = async (file, caseId, activityId) => {
    if (!file) return null;

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${caseId}/${activityId}/${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;
      const filePath = `recovery-activities/${fileName}`;

      const { data, error } = await supabase.storage.from("case-files").upload(filePath, file);

      if (error) throw error;

      // 파일 URL 생성
      const { data: urlData } = supabase.storage.from("case-files").getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error("파일 업로드 오류:", error);
      throw error;
    }
  };

  const getActivityMessage = (activityType, amount, status) => {
    const statusText = status === "predicted" ? "예정되어 있습니다" : "진행되었습니다";

    switch (activityType) {
      case "kcb":
        return `kcb 조회가 ${statusText}.`;
      case "message":
        return `메세지가 ${statusText}.`;
      case "call":
        return `전화 연락이 ${statusText}.`;
      case "visit":
        return `방문 상담이 ${statusText}.`;
      case "payment":
        if (amount) {
          const formattedAmount = new Intl.NumberFormat("ko-KR", {
            style: "currency",
            currency: "KRW",
          }).format(amount);
          return `${formattedAmount} 납부가 ${statusText}.`;
        }
        return `납부가 ${statusText}.`;
      case "letter":
        return `통지서가 발송되었습니다.`;
      case "legal":
        return `법적 조치가 ${statusText}.`;
      default:
        return `회수 활동이 ${statusText}.`;
    }
  };

  // 알림 생성 함수
  const createNotification = async (activityData, actionType, oldStatus = null) => {
    if (!caseId) return;

    try {
      console.log("Notification parties:", parties);

      // props로 받은 parties 배열을 사용하여 채권자와 채무자 찾기
      let creditor = null;
      let debtor = null;

      if (parties && parties.length > 0) {
        console.log("Using props parties for notification");
        parties.forEach((party) => {
          console.log("Party:", party);
          if (["creditor", "plaintiff", "applicant"].includes(party.party_type)) {
            creditor = party;
            console.log("Found creditor:", creditor);
          } else if (["debtor", "defendant", "respondent"].includes(party.party_type)) {
            debtor = party;
            console.log("Found debtor:", debtor);
          }
        });
      }

      if (!creditor || !debtor) {
        console.log("Falling back to caseDetails parties");
        // props에서 찾지 못한 경우 caseDetails에서 시도
        if (caseDetails && caseDetails.parties) {
          caseDetails.parties.forEach((party) => {
            console.log("CaseDetails party:", party);
            if (["creditor", "plaintiff", "applicant"].includes(party.party_type)) {
              creditor = party;
              console.log("Found creditor from caseDetails:", creditor);
            } else if (["debtor", "defendant", "respondent"].includes(party.party_type)) {
              debtor = party;
              console.log("Found debtor from caseDetails:", debtor);
            }
          });
        }
      }

      // 알림 제목 및 내용 구성
      let creditorName = "미지정";
      let debtorName = "미지정";

      if (creditor) {
        // entity_type 또는 party_entity_type 중 하나를 체크
        const isIndividual =
          creditor.entity_type === "individual" || creditor.party_entity_type === "individual";

        if (isIndividual) {
          creditorName = creditor.name || "미지정";
        } else {
          creditorName = creditor.company_name || "미지정";
        }
      }

      if (debtor) {
        // entity_type 또는 party_entity_type 중 하나를 체크
        const isIndividual =
          debtor.entity_type === "individual" || debtor.party_entity_type === "individual";

        if (isIndividual) {
          debtorName = debtor.name || "미지정";
        } else {
          debtorName = debtor.company_name || "미지정";
        }
      }

      console.log("Final notification title data:", { creditorName, debtorName });

      // 알림 생성 여부 결정
      let shouldCreateNotification = true;

      // 수정일 때 상태 변경 시에만 알림 생성
      if (actionType === "update") {
        shouldCreateNotification = oldStatus !== activityData.status;
      }

      if (!shouldCreateNotification) return;

      const title = `채권자 ${creditorName} | 채무자 ${debtorName}`;
      const message = getActivityMessage(
        activityData.activity_type,
        activityData.amount,
        activityData.status
      );

      // =======================================================================
      // 알림 대상자(의뢰인 + 담당자) 수집
      // =======================================================================

      // 모든 의뢰인 정보를 수집하기 위한 작업 배열
      const clientFetchPromises = [];
      const userIds = new Set(); // 중복 방지를 위해 Set 사용

      // 개인 및 법인/그룹 의뢰인 모두 처리
      if (caseDetails.clients) {
        caseDetails.clients.forEach((client) => {
          if (client.individual_id) {
            // 개인 의뢰인
            userIds.add(client.individual_id.id);
          } else if (client.organization_id) {
            // 조직 의뢰인인 경우 조직 멤버 조회 작업 추가
            const promise = supabase
              .from("test_organization_members")
              .select("user_id")
              .eq("organization_id", client.organization_id.id)
              .then(({ data, error }) => {
                if (error) {
                  console.error(`조직 ${client.organization_id.id} 멤버 조회 실패:`, error);
                  return [];
                }
                return data || [];
              });

            clientFetchPromises.push(promise);
          }
        });
      }

      // 모든 조직 멤버 조회 작업 실행
      const orgMembersResults = await Promise.all(clientFetchPromises);

      // 조직 멤버 ID 추가
      orgMembersResults.forEach((members) => {
        members.forEach((member) => {
          if (member.user_id) {
            userIds.add(member.user_id);
          }
        });
      });

      // 사건 담당자 조회 및 추가
      const { data: handlersData, error: handlersError } = await supabase
        .from("test_case_handlers")
        .select("user_id")
        .eq("case_id", caseId);

      if (!handlersError && handlersData) {
        handlersData.forEach((handler) => {
          if (handler.user_id) {
            userIds.add(handler.user_id);
          }
        });
      } else if (handlersError) {
        console.error("사건 담당자 조회 실패:", handlersError);
      }

      // Set을 배열로 변환
      const uniqueUserIds = Array.from(userIds);

      if (uniqueUserIds.length === 0) return;

      // 각 사용자에 대한 알림 생성
      const notificationPromises = uniqueUserIds.map(async (userId) => {
        const notification = {
          user_id: userId,
          case_id: caseId,
          title: title,
          message: message,
          notification_type: "recovery_activity",
          is_read: false,
        };

        try {
          const { error } = await supabase.from("test_case_notifications").insert(notification);

          if (error) {
            console.error(`사용자 ${userId}에 대한 알림 생성 실패:`, error);
            return { success: false, userId, error };
          } else {
            return { success: true, userId };
          }
        } catch (err) {
          console.error(`사용자 ${userId}에 대한 알림 생성 중 예외 발생:`, err);
          return { success: false, userId, error: err };
        }
      });

      await Promise.all(notificationPromises);
      console.log("회수 활동 알림이 생성되었습니다");
    } catch (error) {
      console.error("알림 생성 실패:", error);
    }
  };

  // 알림 생성 함수 (기존 test_case_notifications 테이블용 - 호환성 유지)
  const createNotificationForClients = async (caseId, activity) => {
    try {
      // 해당 사건의 의뢰인 목록 조회
      const { data: clientsData, error: clientsError } = await supabase
        .from("test_case_clients")
        .select("*")
        .eq("case_id", caseId);

      if (clientsError) throw clientsError;
      if (!clientsData || clientsData.length === 0) return;

      // 활동 유형에 따른 알림 제목 설정
      const activityTypeText = getActivityTypeText(activity.activity_type);
      const statusText = activity.status === "predicted" ? "예정" : "완료";
      const title = `${activityTypeText} 활동이 ${statusText}되었습니다`;

      // 활동 내용 설정
      let message = activity.description;

      // 납부 금액이 있는 경우 메시지에 추가
      if (activity.amount) {
        message += `\n금액: ${formatCurrency(activity.amount)}`;
      }

      // 각 의뢰인에 대해 알림 생성
      for (const client of clientsData) {
        const notification = {
          case_id: caseId,
          title: title,
          message: message,
          notification_type: "general",
          is_read: false,
          user_id: client.user_id, // 의뢰인의 사용자 ID
        };

        const { error: notificationError } = await supabase
          .from("test_case_notifications")
          .insert(notification);

        if (notificationError) {
          console.error("알림 생성 실패:", notificationError);
        }
      }
    } catch (error) {
      console.error("의뢰인 알림 생성 실패:", error);
    }
  };

  const getActivityTypeText = (type) => {
    const found = activityTypes.find((item) => item.value === type);
    return found ? found.label : type;
  };

  // 금액 형식 변환
  const formatCurrency = (amount) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(amount);
  };

  // 당사자 유형에 따른 색상 반환 함수
  const getPartyTypeColor = (type) => {
    switch (type) {
      case "plaintiff":
      case "creditor":
      case "applicant":
        return "text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800";
      case "defendant":
      case "debtor":
      case "respondent":
        return "text-red-600 dark:text-red-400 border-red-200 dark:border-red-800";
      default:
        return "text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800";
    }
  };

  // 추가 모드 - 데이터 저장
  const handleAdd = async () => {
    try {
      // 납부 금액은 납부 유형일 경우만 저장
      const newActivity = {
        case_id: caseId,
        activity_type: formData.activity_type,
        date: formData.date.toISOString(),
        description: formData.description,
        amount: formData.activity_type === "payment" ? Number(formData.amount) : null,
        notes: formData.notes,
        status: formData.status,
        // created_by를 UUID로 저장
        created_by: user.id,
      };

      // 활동 정보 데이터베이스에 저장
      const { data, error } = await supabase
        .from("test_recovery_activities")
        .insert(newActivity)
        .select();

      if (error) throw error;

      // 파일이 있으면 업로드
      if (fileToUpload) {
        try {
          const fileUrl = await uploadFile(fileToUpload, caseId, data[0].id);

          // file_url 필드 업데이트
          if (fileUrl) {
            const { error: updateError } = await supabase
              .from("test_recovery_activities")
              .update({ file_url: fileUrl })
              .eq("id", data[0].id);

            if (updateError) throw updateError;
          }
        } catch (fileError) {
          console.error("파일 업로드 실패:", fileError);
          toast.error("파일 업로드 실패", {
            description: "활동은 추가되었지만, 파일 업로드에 실패했습니다.",
          });
        }
      }

      // 알림 생성
      await createNotificationForClients(caseId, data[0]);
      await createNotification(data[0], "create");

      toast.success("회수 활동이 추가되었습니다", {
        description: "회수 활동이 성공적으로 추가되었습니다.",
      });

      return true;
    } catch (error) {
      console.error("회수 활동 추가 실패:", error);
      toast.error("회수 활동 추가 실패", {
        description: error.message,
      });
      return false;
    }
  };

  // 수정 모드 - 데이터 업데이트
  const handleUpdate = async () => {
    try {
      // 현재 상태와 새 상태 비교를 위해 기존 활동 정보 가져오기
      const { data: oldActivityData, error: oldActivityError } = await supabase
        .from("test_recovery_activities")
        .select("*")
        .eq("id", activity.id)
        .single();

      if (oldActivityError) throw oldActivityError;

      // 업데이트할 데이터 구성
      const updatedActivity = {
        activity_type: formData.activity_type,
        date: formData.date.toISOString(),
        description: formData.description,
        amount: formData.amount ? Number(formData.amount) : null,
        notes: formData.notes,
        status: formData.status,
      };

      // 활동 정보 데이터베이스에 업데이트
      const { data, error } = await supabase
        .from("test_recovery_activities")
        .update(updatedActivity)
        .eq("id", activity.id)
        .select();

      if (error) throw error;

      // 파일이 있으면 업로드 및 업데이트
      if (fileToUpload) {
        try {
          const fileUrl = await uploadFile(fileToUpload, caseId, activity.id);

          // file_url 필드 업데이트
          if (fileUrl) {
            const { error: updateError } = await supabase
              .from("test_recovery_activities")
              .update({ file_url: fileUrl })
              .eq("id", activity.id);

            if (updateError) throw updateError;
          }
        } catch (fileError) {
          console.error("파일 업로드 실패:", fileError);
          toast.error("파일 업로드 실패", {
            description: "활동은 수정되었지만, 파일 업로드에 실패했습니다.",
          });
        }
      }

      // 상태 변경 확인 - 상태가 변경된 경우에만 알림 생성
      const statusChanged = oldActivityData.status !== updatedActivity.status;
      if (statusChanged) {
        await createNotificationForClients(caseId, data[0]);
      }

      // 새로운 알림 시스템에도 알림 생성
      await createNotification(data[0], "update", oldActivityData.status);

      toast.success("회수 활동이 수정되었습니다", {
        description: "회수 활동이 성공적으로 수정되었습니다.",
      });

      return true;
    } catch (error) {
      console.error("회수 활동 수정 실패:", error);
      toast.error("회수 활동 수정 실패", {
        description: error.message,
      });
      return false;
    }
  };

  // 통합된 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user || (user.role !== "admin" && user.role !== "staff")) {
      toast.error("권한이 없습니다", {
        description: "관리자 또는 직원만 회수 활동을 추가/수정할 수 있습니다",
      });
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);

    let success = false;
    if (isEditing) {
      success = await handleUpdate();
    } else {
      success = await handleAdd();
    }

    if (success) {
      // 폼 초기화 및 다이얼로그 닫기
      setFormData({
        activity_type: "",
        date: new Date(),
        description: "",
        amount: "",
        notes: "",
        status: "completed",
      });
      resetFileUpload();
      onOpenChange(false);

      // 성공 콜백 호출
      if (onSuccess) onSuccess();
    }

    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "회수 활동 수정" : "회수 활동 추가"}</DialogTitle>
        </DialogHeader>

        {/* 당사자 정보 섹션 */}
        {parties && parties.length > 0 && (
          <div className="mb-4 border rounded-md p-3 bg-gray-50/50 dark:bg-gray-900/50">
            <h3 className="text-sm font-medium mb-2">당사자 정보</h3>
            <div className="space-y-2">
              {parties.slice(0, 3).map((party, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn("text-xs", getPartyTypeColor(party.party_type))}
                  >
                    {party.party_type === "plaintiff"
                      ? "원고"
                      : party.party_type === "defendant"
                      ? "피고"
                      : party.party_type === "creditor"
                      ? "채권자"
                      : party.party_type === "debtor"
                      ? "채무자"
                      : party.party_type === "applicant"
                      ? "신청인"
                      : party.party_type === "respondent"
                      ? "피신청인"
                      : party.party_type}
                  </Badge>
                  <span className="font-medium truncate">{party.name || party.company_name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">활동 유형</label>
            <Select value={formData.activity_type} onValueChange={handleTypeChange}>
              <SelectTrigger className={formErrors.activity_type ? "border-red-500" : ""}>
                <SelectValue placeholder="활동 유형 선택" />
              </SelectTrigger>
              <SelectContent>
                {activityTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors.activity_type && (
              <p className="text-xs text-red-500">{formErrors.activity_type}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">상태</label>
            <Select value={formData.status} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="상태 선택" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">날짜</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full justify-start text-left font-normal ${
                    formErrors.date ? "border-red-500" : ""
                  }`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.date ? (
                    format(formData.date, "PPP", { locale: ko })
                  ) : (
                    <span>날짜 선택</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.date}
                  onSelect={handleDateChange}
                  locale={ko}
                />
              </PopoverContent>
            </Popover>
            {formErrors.date && <p className="text-xs text-red-500">{formErrors.date}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">내용</label>
            <Textarea
              name="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="활동 내용을 입력하세요"
              className={formErrors.description ? "border-red-500" : ""}
            />
            {formErrors.description && (
              <p className="text-xs text-red-500">{formErrors.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              납부 금액 {formData.activity_type !== "payment" && "(선택사항)"}
            </label>
            <Input
              name="amount"
              type="number"
              value={formData.amount}
              onChange={(e) => handleInputChange("amount", e.target.value)}
              placeholder="금액을 입력하세요"
              className={formErrors.amount ? "border-red-500" : ""}
            />
            {formErrors.amount && <p className="text-xs text-red-500">{formErrors.amount}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">비고</label>
            <Textarea
              name="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="추가 내용이 있다면 입력하세요 (선택사항)"
            />
          </div>

          {/* 파일 첨부 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              첨부 파일 {isEditing && activity?.file_url ? "(기존 파일 교체)" : ""}
            </label>
            <div className="flex flex-col gap-2">
              {isEditing && activity?.file_url && !fileToUpload && (
                <div className="border rounded p-2 flex items-center justify-between">
                  <div className="flex items-center">
                    <FileCheck className="h-4 w-4 mr-2 text-blue-500" />
                    <span className="text-sm">
                      기존 파일이 있습니다.{" "}
                      <Link
                        href={activity.file_url}
                        target="_blank"
                        className="text-blue-500 hover:underline"
                      >
                        보기
                      </Link>
                    </span>
                  </div>
                </div>
              )}
              {fileToUpload ? (
                <div className="border rounded p-2 flex items-center justify-between">
                  <div className="flex items-center">
                    <FileCheck className="h-4 w-4 mr-2 text-green-500" />
                    <span className="text-sm truncate max-w-[280px]">{fileToUpload.name}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={resetFileUpload}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <div className="border border-dashed rounded-md p-4 flex flex-col items-center justify-center gap-2 hover:bg-muted/40 transition-colors">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {isEditing && activity?.file_url
                        ? "새 파일을 업로드하여 기존 파일 교체"
                        : "파일을 여기에 끌어다 놓거나 클릭하여 업로드하세요"}
                    </p>
                    <input type="file" className="hidden" onChange={handleFileChange} />
                  </div>
                </label>
              )}
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "처리 중..." : isEditing ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
