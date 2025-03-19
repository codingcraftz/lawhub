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
}) {
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
  const [caseDetails, setCaseDetails] = useState(null);
  const [lawsuitDetails, setLawsuitDetails] = useState(null);

  // 송달/제출 유형 상수
  const submissionTypes = [
    { value: "송달문서", label: "송달문서", icon: ArrowDown },
    { value: "제출문서", label: "제출문서", icon: ArrowUp },
  ];

  // 모달이 열릴 때 폼 데이터 초기화 및 사건/소송 정보 가져오기
  useEffect(() => {
    if (open) {
      if (!editingSubmission) {
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
  }, [open, editingSubmission]);

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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 파일 사이즈 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("파일 크기 초과", {
        description: "10MB 이하의 파일만 업로드할 수 있습니다.",
      });
      e.target.value = "";
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

    if (!formData.submission_type) errors.submission_type = "유형을 선택해주세요";
    if (!formData.document_type) errors.document_type = "문서 유형을 입력해주세요";
    if (!formData.submission_date) errors.submission_date = "송달/제출일을 선택해주세요";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 알림 생성 함수
  const createNotification = async (actionType) => {
    if (!caseDetails || !lawsuitDetails) {
      console.error("사건/소송 정보가 없습니다.", { caseDetails, lawsuitDetails });
      return;
    }

    try {
      const LAWSUIT_TYPES = {
        civil: { label: "민사소송", variant: "default" },
        payment_order: { label: "지급명령", variant: "secondary" },
        property_disclosure: { label: "재산명시", variant: "outline" },
        execution: { label: "강제집행", variant: "destructive" },
      };

      const lawsuitTypeLabel = LAWSUIT_TYPES[lawsuitType]?.label || lawsuitType;

      const creditorsApplicants = parties
        .filter((party) => ["plaintiff", "creditor", "applicant"].includes(party.party_type))
        .map((party) => (party.entity_type === "individual" ? party.name : party.company_name));

      console.log("parties", parties);

      const debtorsRespondents = parties
        .filter((party) => ["defendant", "debtor", "respondent"].includes(party.party_type))
        .map((party) => (party.entity_type === "individual" ? party.name : party.company_name));

      // 쉼표로 연결
      const plaintiffFormatted = creditorsApplicants.join(", ");
      const defendantFormatted = debtorsRespondents.join(", ");

      // 원고 & 피고 그룹이 없으면 알림 생성 X
      if (!plaintiffFormatted || !defendantFormatted) return;

      // 알림 제목 형식: [타입] 사건번호_원고(피고)
      let title = `[${lawsuitTypeLabel}] ${lawsuitDetails.case_number}`;

      let message = "";
      if (formData.submission_type === "송달문서") {
        message = `${formData.document_type}_${plaintiffFormatted}(${defendantFormatted})을(를) 송달 받았습니다.`;
      } else {
        message = `${formData.document_type}_${plaintiffFormatted}(${defendantFormatted})을(를) 제출했습니다.`;
      }

      console.log("생성할 알림:", {
        title,
        message,
      });

      // 모든 의뢰인 정보를 수집하기 위한 작업 배열
      const clientFetchPromises = [];
      const clientIds = new Set(); // 중복 방지를 위해 Set 사용

      // 개인 및 법인/그룹 의뢰인 모두 처리
      if (!caseDetails.clients || caseDetails.clients.length === 0) {
        console.warn("의뢰인 정보가 없습니다:", caseDetails);
        return;
      }

      caseDetails.clients.forEach((client) => {
        if (client.individual_id) {
          // 개인 의뢰인
          clientIds.add(client.individual_id.id);
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

      // 모든 조직 멤버 조회 작업 실행
      const orgMembersResults = await Promise.all(clientFetchPromises);

      // 조직 멤버 ID 추가
      orgMembersResults.forEach((members) => {
        members.forEach((member) => {
          if (member.user_id) {
            clientIds.add(member.user_id);
          }
        });
      });

      // Set을 배열로 변환
      const uniqueClientIds = Array.from(clientIds);

      if (uniqueClientIds.length === 0) {
        console.warn("알림을 받을 의뢰인이 없습니다.");
        return;
      }

      console.log("알림을 받을 의뢰인:", uniqueClientIds);

      // 각 클라이언트에 대한 알림 생성
      const notificationPromises = uniqueClientIds.map(async (clientId) => {
        // 생성된 제출 정보의 ID 가져오기
        let submissionId = null;

        if (isEditMode && editingSubmission) {
          submissionId = editingSubmission.id;
        } else {
          // 최근 생성된 제출 정보 가져오기
          const { data: latestSubmission, error: latestError } = await supabase
            .from("test_lawsuit_submissions")
            .select("id")
            .eq("lawsuit_id", lawsuitId)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          if (latestError) {
            console.error("최근 생성된 제출 정보 조회 실패:", latestError);
          } else if (latestSubmission) {
            submissionId = latestSubmission.id;
          }
        }

        const notification = {
          user_id: clientId,
          case_id: caseId,
          title: title,
          message: message,
          notification_type: "lawsuit_update",
          is_read: false,
          related_entity: "submission",
          related_id: submissionId,
        };

        try {
          const { data, error } = await supabase
            .from("test_case_notifications")
            .insert(notification);

          if (error) {
            console.error(`클라이언트 ${clientId}에 대한 알림 생성 실패:`, error);
            return { success: false, clientId, error };
          } else {
            return { success: true, clientId };
          }
        } catch (err) {
          console.error(`클라이언트 ${clientId}에 대한 알림 생성 중 예외 발생:`, err);
          return { success: false, clientId, error: err };
        }
      });

      const results = await Promise.all(notificationPromises);
      console.log("알림 생성 결과:", results);

      // 성공/실패 카운트
      const successCount = results.filter((r) => r.success).length;
      console.log(`알림 생성 완료: ${successCount}/${results.length} 성공`);
    } catch (error) {
      console.error("알림 생성 실패:", error);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      let fileUrl = editingSubmission?.file_url || null;

      // 파일이 있는 경우 업로드
      if (fileToUpload) {
        try {
          // 파일 이름에 타임스탬프 추가하여 중복 방지
          const fileExt = fileToUpload.name.split(".").pop();
          const fileName = `${caseId}/${lawsuitId}/${Math.random()
            .toString(36)
            .substring(2)}.${fileExt}`;
          const filePath = `lawsuit-submissions/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, fileToUpload);

          if (uploadError) throw uploadError;

          // 파일 URL 생성
          const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
          fileUrl = urlData.publicUrl;
        } catch (uploadError) {
          console.error("파일 업로드 실패:", uploadError);
          toast.error("파일 업로드 실패", {
            description: "내역은 저장되지만, 파일 업로드에 실패했습니다.",
          });
        }
      }

      if (isEditMode) {
        // 수정 모드
        const { error } = await supabase
          .from("test_lawsuit_submissions")
          .update({
            submission_type: formData.submission_type,
            document_type: formData.document_type,
            submission_date: formData.submission_date.toISOString().split("T")[0],
            description: formData.description,
            file_url: fileUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingSubmission.id);

        if (error) throw error;

        toast.success("타임라인 항목이 수정되었습니다");

        // 문서 유형이나 제출 유형이 변경된 경우에만 알림 생성
        if (
          formData.submission_type !== editingSubmission.submission_type ||
          formData.document_type !== editingSubmission.document_type
        ) {
          await createNotification("update");
        }
      } else {
        // 추가 모드
        const currentUser = JSON.parse(localStorage.getItem("supabase.auth.token"))?.currentSession
          ?.user?.id;

        const { error } = await supabase.from("test_lawsuit_submissions").insert({
          lawsuit_id: lawsuitId,
          submission_type: formData.submission_type,
          document_type: formData.document_type,
          submission_date: formData.submission_date.toISOString().split("T")[0],
          description: formData.description.trim() || null,
          file_url: fileUrl,
          created_by: currentUser,
        });

        if (error) throw error;

        toast.success("타임라인 항목이 추가되었습니다");

        // 알림 생성
        await createNotification("create");
      }

      // 성공 콜백 호출
      if (onSuccess) onSuccess();

      // 모달 닫기
      onOpenChange(false);
    } catch (error) {
      console.error("타임라인 항목 저장 실패:", error);
      toast.error("타임라인 항목 저장 실패", {
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
              {editingSubmission?.file_url && !fileToUpload && (
                <div className="border rounded p-2 flex items-center justify-between">
                  <div className="flex items-center">
                    <FileCheck className="h-4 w-4 mr-2 text-blue-500" />
                    <span className="text-sm">
                      기존 파일이 있습니다.{" "}
                      <Link
                        href={editingSubmission.file_url}
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
                      {editingSubmission?.file_url
                        ? "새 파일을 업로드하여 기존 파일 교체"
                        : "클릭하여 파일 업로드"}
                    </p>
                    <input
                      type="file"
                      id="submission-file"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                </label>
              )}
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
