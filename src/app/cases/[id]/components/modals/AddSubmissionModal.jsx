"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { FileCheck, Upload, X, Calendar, ArrowDown, ArrowUp } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useUser } from "@/contexts/UserContext";
import FileUploadDropzone from "@/components/ui/file-upload-dropzone";

// 스토리지 버킷 이름을 정의합니다
const BUCKET_NAME = "case-files";

// 문서 유형 예시
const DOCUMENT_TYPE_EXAMPLES = {
  송달문서: ["소장", "준비서면", "석명준비명령", "변론기일통지서", "결정문", "판결문"],
  제출문서: ["답변서", "준비서면", "증거신청서", "사실조회신청서", "항소장", "상고장"],
};

export default function AddSubmissionModal({
  open,
  onOpenChange,
  onSuccess,
  caseId,
  lawsuitId,
  parties = [],
  lawsuitType,
  editingSubmission = null,
  caseDetails = null,
  clients = null,
}) {
  const { user } = useUser();
  const isEditMode = !!editingSubmission;
  const [formData, setFormData] = useState({
    submission_type: editingSubmission?.submission_type || "송달문서",
    document_type: editingSubmission?.document_type || "",
    submission_date: editingSubmission?.submission_date
      ? new Date(editingSubmission.submission_date)
      : new Date(),
    description: editingSubmission?.description || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [lawsuitDetails, setLawsuitDetails] = useState(null);

  // 송달/제출 유형 상수
  const submissionTypes = [
    { value: "송달문서", label: "송달문서", icon: ArrowDown },
    { value: "제출문서", label: "제출문서", icon: ArrowUp },
  ];

  // 모달이 열릴 때 폼 데이터 초기화 및 사건/소송 정보 가져오기
  useEffect(() => {
    if (open) {
      if (isEditMode && editingSubmission) {
        // 수정 모드인 경우 기존 데이터로 초기화
        setFormData({
          submission_type: editingSubmission.submission_type || "송달문서",
          document_type: editingSubmission.document_type || "",
          submission_date: editingSubmission.submission_date
            ? new Date(editingSubmission.submission_date)
            : new Date(),
          description: editingSubmission.description || "",
        });
        setFileToUpload(null);
        setFormErrors({});
      } else {
        // 추가 모드인 경우 기본값으로 초기화
        setFormData({
          submission_type: "송달문서",
          document_type: "",
          submission_date: new Date(),
          description: "",
        });
        setFileToUpload(null);
        setFormErrors({});
      }

      // 사건 및 소송 정보 로드
      fetchCaseAndLawsuitDetails();
    }
  }, [open, isEditMode, editingSubmission]);

  // 사건 및 소송 정보 가져오기
  const fetchCaseAndLawsuitDetails = async () => {
    try {
      // 사건 정보 가져오기
      const { data: caseData, error: caseError } = await supabase
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

      if (caseError) throw caseError;
      setCaseDetails(caseData);

      // 소송 정보 가져오기
      const { data: lawsuitData, error: lawsuitError } = await supabase
        .from("test_case_lawsuits")
        .select(
          `
          *,
          test_lawsuit_parties!inner(
            *,
            party:party_id(*)
          )
        `
        )
        .eq("id", lawsuitId)
        .single();

      if (lawsuitError) throw lawsuitError;
      setLawsuitDetails(lawsuitData);
    } catch (error) {
      console.error("사건/소송 정보 로드 실패:", error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    });

    if (formErrors[field]) {
      setFormErrors({
        ...formErrors,
        [field]: null,
      });
    }
  };

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

  const resetFileUpload = () => {
    setFileToUpload(null);
    const fileInput = document.getElementById("submission-file");
    if (fileInput) fileInput.value = "";
  };

  const validateForm = () => {
    const errors = {};

    // 필수 필드 검증
    if (!formData.submission_type) {
      errors.submission_type = "제출 유형을 선택해주세요";
    }

    if (!formData.document_type) {
      errors.document_type = "문서 유형을 선택해주세요";
    }

    if (!formData.submission_date) {
      errors.submission_date = "제출 날짜를 선택해주세요";
    }

    // 파일 검증 (수정 모드에서는 파일이 없어도 됨)
    if (!isEditMode && !fileToUpload && !formData.description) {
      errors.file = "파일을 업로드하거나 설명을 입력해주세요";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 알림 생성 함수
  const createNotification = async (submissionData) => {
    if (!caseId) return;

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
          .eq("case_id", caseId);

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
          .eq("case_id", caseId);

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

      // 알림 제목과 내용 설정
      const title = caseDetails?.title || "사건 정보 없음";
      const message = `새로운 서류 ${submissionData.title || ""}가 제출되었습니다.`;

      // 1. 사건 알림 생성 (test_case_notifications 테이블)
      const caseNotification = {
        case_id: caseId,
        title: title,
        message: message,
        notification_type: "submission",
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
        case_id: caseId,
        title: title,
        message: message,
        notification_type: "submission",
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

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // 기존 파일 URL 유지 또는 null로 설정
      let fileUrl = isEditMode ? editingSubmission.file_url || null : null;

      // 파일 업로드 처리
      if (fileToUpload) {
        // 파일 이름에 타임스탬프 추가하여 중복 방지
        const fileExt = fileToUpload.name.split(".").pop();
        const fileName = `${caseId}/${lawsuitId}/${Math.random()
          .toString(36)
          .substring(2)}.${fileExt}`;
        const filePath = `lawsuit-submissions/${fileName}`;

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

      // 현재 사용자 ID 가져오기
      const currentUser = user?.id;

      // 데이터 준비
      const submissionData = {
        lawsuit_id: lawsuitId,
        submission_type: formData.submission_type,
        document_type: formData.document_type,
        submission_date: formData.submission_date.toISOString().split("T")[0],
        description: formData.description,
        file_url: fileUrl,
      };

      // 수정 모드인지 신규 추가인지 확인
      if (isEditMode && editingSubmission) {
        // 기존 데이터와 비교하여 변경점 확인
        const originalSubmission = editingSubmission;
        const typeChanged =
          originalSubmission.submission_type !== submissionData.submission_type ||
          originalSubmission.document_type !== submissionData.document_type;

        // 파일 URL이 변경되지 않았다면 업데이트 데이터에서 제외
        if (fileUrl === originalSubmission.file_url) {
          delete submissionData.file_url;
        }

        // 문서 업데이트
        const { data: updatedSubmission, error } = await supabase
          .from("test_lawsuit_submissions")
          .update(submissionData)
          .eq("id", editingSubmission.id)
          .select()
          .single();

        if (error) {
          console.error("문서 업데이트 실패:", error);
          throw error;
        }

        // 문서 유형이 변경된 경우에만 알림 생성
        if (typeChanged) {
          await createNotification(submissionData);
        }

        toast.success("문서가 수정되었습니다");

        if (onSuccess) onSuccess(updatedSubmission);
      } else {
        // 작성자 정보 추가
        submissionData.created_by = currentUser;

        // 새 문서 추가
        const { data: newSubmission, error } = await supabase
          .from("test_lawsuit_submissions")
          .insert(submissionData)
          .select()
          .single();

        if (error) {
          console.error("문서 추가 실패:", error);
          throw error;
        }

        // 새 문서에 대한 알림 생성
        await createNotification(submissionData);

        toast.success("문서가 추가되었습니다");

        if (onSuccess) onSuccess(newSubmission);
      }

      // 모달 닫기 및 상태 초기화
      onOpenChange(false);
    } catch (error) {
      console.error("문서 저장 실패:", error);
      toast.error(isEditMode ? "문서 수정 실패" : "문서 추가 실패", {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 현재 타입에 따른 문서 유형 예시 가져오기
  const getDocumentTypeExamples = () => {
    return DOCUMENT_TYPE_EXAMPLES[formData.submission_type] || [];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "타임라인 항목 수정" : "타임라인 항목 추가"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>문서 유형</Label>
            <div className="flex gap-2">
              {submissionTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <Button
                    key={type.value}
                    type="button"
                    variant={formData.submission_type === type.value ? "default" : "outline"}
                    className={cn("flex items-center gap-1 flex-1")}
                    onClick={() => handleInputChange("submission_type", type.value)}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{type.label}</span>
                  </Button>
                );
              })}
            </div>
            {formErrors.submission_type && (
              <p className="text-xs text-red-500">{formErrors.submission_type}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="document_type">문서 종류</Label>
            <Input
              id="document_type"
              value={formData.document_type}
              onChange={(e) => handleInputChange("document_type", e.target.value)}
              placeholder="문서 종류를 입력하세요"
              className={formErrors.document_type ? "border-red-500" : ""}
            />
            {formErrors.document_type && (
              <p className="text-xs text-red-500">{formErrors.document_type}</p>
            )}
            {getDocumentTypeExamples().length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {getDocumentTypeExamples().map((example) => (
                  <Button
                    key={example}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs px-2 py-1 h-auto"
                    onClick={() => handleInputChange("document_type", example)}
                  >
                    {example}
                  </Button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="submission_date">송달/제출일</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="submission_date"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.submission_date && "text-muted-foreground",
                    formErrors.submission_date && "border-red-500"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {formData.submission_date ? (
                    format(formData.submission_date, "yyyy년 MM월 dd일", { locale: ko })
                  ) : (
                    <span>날짜 선택</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={formData.submission_date}
                  onSelect={(date) => handleInputChange("submission_date", date)}
                  initialFocus
                  locale={ko}
                />
              </PopoverContent>
            </Popover>
            {formErrors.submission_date && (
              <p className="text-xs text-red-500">{formErrors.submission_date}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="문서에 대한 설명을 입력하세요"
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">첨부파일</Label>
            <div className="flex flex-col gap-2">
              <FileUploadDropzone
                onFileSelect={handleFileChange}
                onFileRemove={resetFileUpload}
                selectedFile={fileToUpload}
                existingFileUrl={editingSubmission?.file_url || null}
                fileUrlLabel="기존 파일이 있습니다"
                uploadLabel="파일을 이곳에 끌어서 놓거나 클릭하여 업로드"
                replaceLabel="파일을 이곳에 끌어서 놓거나 클릭하여 교체"
                id="submission-file"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                maxSizeMB={10}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="ml-2">
            {isSubmitting ? "저장 중..." : isEditMode ? "수정" : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
