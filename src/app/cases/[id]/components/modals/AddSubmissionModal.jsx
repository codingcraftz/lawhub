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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileCheck, Upload, X, Calendar } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

// 스토리지 버킷 이름을 정의합니다
const BUCKET_NAME = "case-files";

// 문서 유형 목록
const DOCUMENT_TYPES = [
  { value: "소장", label: "소장" },
  { value: "답변서", label: "답변서" },
  { value: "준비서면", label: "준비서면" },
  { value: "결정문", label: "결정문" },
  { value: "판결문", label: "판결문" },
  { value: "기타", label: "기타" },
];

export default function AddSubmissionModal({
  open,
  onOpenChange,
  onSuccess,
  caseId,
  lawsuitId,
  editingSubmission = null,
}) {
  const isEditMode = !!editingSubmission;

  const [formData, setFormData] = useState({
    submission_type: editingSubmission?.submission_type || "",
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

  // 모달이 열릴 때 폼 데이터 초기화 및 사건/소송 정보 가져오기
  useEffect(() => {
    if (open) {
      if (!editingSubmission) {
        setFormData({
          submission_type: "",
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
    if (!formData.document_type) errors.document_type = "문서 유형을 선택해주세요";
    if (!formData.submission_date) errors.submission_date = "송달/제출일을 선택해주세요";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 알림 생성 함수
  const createNotification = async (actionType, submissionData) => {
    if (!caseDetails || !lawsuitDetails) return;

    try {
      // 채권자와 채무자 찾기
      let creditor = null;
      let debtor = null;

      // 소송 당사자 정보에서 원고(채권자)와 피고(채무자) 구분
      lawsuitDetails.test_lawsuit_parties.forEach((lp) => {
        if (["plaintiff", "creditor", "applicant"].includes(lp.party_type)) {
          creditor = lp.party;
        } else if (["defendant", "debtor", "respondent"].includes(lp.party_type)) {
          debtor = lp.party;
        }
      });

      if (!creditor || !debtor) return;

      // 알림 제목 및 내용 구성
      const creditorName =
        creditor.party_entity_type === "individual" ? creditor.name : creditor.company_name;

      const debtorName =
        debtor.party_entity_type === "individual" ? debtor.name : debtor.company_name;

      let title = `채권자 ${creditorName} | 채무자 ${debtorName}`;

      let message = "";
      if (formData.submission_type === "송달문서") {
        message = `${formData.document_type}을(를) 송달 받았습니다.`;
      } else {
        message = `${formData.document_type}을(를) 제출했습니다.`;
      }

      // 모든 의뢰인 정보를 수집하기 위한 작업 배열
      const clientFetchPromises = [];
      const clientIds = new Set(); // 중복 방지를 위해 Set 사용

      // 개인 및 법인/그룹 의뢰인 모두 처리
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

      if (uniqueClientIds.length === 0) return;

      // 각 클라이언트에 대한 알림 생성
      const notificationPromises = uniqueClientIds.map(async (clientId) => {
        const notification = {
          user_id: clientId,
          case_id: caseId,
          title: title,
          message: message,
          notification_type: "lawsuit_update",
          is_read: false,
          related_entity: "submission",
          related_id: submissionData.id,
        };

        try {
          const { data, error } = await supabase.from("test_notifications").insert(notification);

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

      await Promise.all(notificationPromises);
      console.log("알림이 생성되었습니다");
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

      let submissionData;

      if (isEditMode) {
        // 수정 모드
        const { data, error } = await supabase
          .from("test_lawsuit_submissions")
          .update({
            submission_type: formData.submission_type,
            document_type: formData.document_type,
            submission_date: formData.submission_date.toISOString().split("T")[0],
            description: formData.description,
            file_url: fileUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingSubmission.id)
          .select();

        if (error) throw error;
        submissionData = data[0];

        toast.success("송달/제출 내역이 수정되었습니다");

        // 문서 유형이나 제출 유형이 변경된 경우에만 알림 생성
        if (
          formData.submission_type !== editingSubmission.submission_type ||
          formData.document_type !== editingSubmission.document_type
        ) {
          await createNotification("update", submissionData);
        }
      } else {
        // 추가 모드
        const currentUser = JSON.parse(localStorage.getItem("supabase.auth.token"))?.currentSession
          ?.user?.id;

        const { data, error } = await supabase
          .from("test_lawsuit_submissions")
          .insert({
            lawsuit_id: lawsuitId,
            submission_type: formData.submission_type,
            document_type: formData.document_type,
            submission_date: formData.submission_date.toISOString().split("T")[0],
            description: formData.description,
            file_url: fileUrl,
            created_by: currentUser,
          })
          .select();

        if (error) throw error;
        submissionData = data[0];

        toast.success("송달/제출 내역이 추가되었습니다");

        // 알림 생성
        await createNotification("create", submissionData);
      }

      // 성공 콜백 호출
      if (onSuccess) onSuccess();

      // 모달 닫기
      onOpenChange(false);
    } catch (error) {
      console.error("송달/제출 내역 저장 실패:", error);
      toast.error("송달/제출 내역 저장 실패", {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "송달/제출 내역 수정" : "송달/제출 내역 추가"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="submission_type">유형</Label>
            <Select
              value={formData.submission_type}
              onValueChange={(value) => handleInputChange("submission_type", value)}
            >
              <SelectTrigger className={formErrors.submission_type ? "border-red-500" : ""}>
                <SelectValue placeholder="유형 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="송달문서">송달문서</SelectItem>
                <SelectItem value="제출문서">제출문서</SelectItem>
              </SelectContent>
            </Select>
            {formErrors.submission_type && (
              <p className="text-xs text-red-500">{formErrors.submission_type}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="document_type">문서 유형</Label>
            <Select
              value={formData.document_type}
              onValueChange={(value) => handleInputChange("document_type", value)}
            >
              <SelectTrigger className={formErrors.document_type ? "border-red-500" : ""}>
                <SelectValue placeholder="문서 유형 선택" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors.document_type && (
              <p className="text-xs text-red-500">{formErrors.document_type}</p>
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
              placeholder="내용을 입력하세요"
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
                        : "파일을 여기에 끌어다 놓거나 클릭하여 업로드하세요"}
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
