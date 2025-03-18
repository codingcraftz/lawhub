"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  RefreshCw,
  Trash2,
  File,
  FileText,
  Download,
  Upload,
  ArrowDown,
  ArrowUp,
  Calendar,
  Building,
  User,
  ChevronDown,
  ChevronUp,
  Eye,
  Edit,
  Scale,
  Gavel,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export default function LawsuitSubmissions({ lawsuit, viewOnly = false, onSuccess }) {
  const router = useRouter();
  const { user } = useUser();

  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [fileToUpload, setFileToUpload] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [formData, setFormData] = useState({
    submission_type: "송달문서",
    document_type: "",
    submission_date: new Date(),
    from_entity: "",
    to_entity: "",
    description: "",
  });

  // 문서 유형 관련 상수
  const submissionTypes = [
    { value: "송달문서", label: "송달문서", icon: ArrowDown },
    { value: "제출문서", label: "제출문서", icon: ArrowUp },
  ];

  const documentTypes = {
    송달문서: [
      { value: "소장", label: "소장" },
      { value: "준비서면", label: "준비서면" },
      { value: "석명준비명령", label: "석명준비명령" },
      { value: "변론기일통지서", label: "변론기일통지서" },
      { value: "증인출석요구서", label: "증인출석요구서" },
      { value: "감정촉탁결정", label: "감정촉탁결정" },
      { value: "화해권고결정", label: "화해권고결정" },
      { value: "결정문", label: "결정문" },
      { value: "판결문", label: "판결문" },
      { value: "기타", label: "기타" },
    ],
    제출문서: [
      { value: "소장", label: "소장" },
      { value: "답변서", label: "답변서" },
      { value: "준비서면", label: "준비서면" },
      { value: "증거신청서", label: "증거신청서" },
      { value: "사실조회신청서", label: "사실조회신청서" },
      { value: "기일변경신청서", label: "기일변경신청서" },
      { value: "이의신청서", label: "이의신청서" },
      { value: "항소장", label: "항소장" },
      { value: "상고장", label: "상고장" },
      { value: "기타", label: "기타" },
    ],
  };

  const entityTypes = [
    { value: "법원", label: "법원" },
    { value: "본인", label: "본인" },
    { value: "상대방", label: "상대방" },
    { value: "제3자", label: "제3자" },
  ];

  // 소송 유형 표시
  const getLawsuitTypeText = (type) => {
    const types = {
      civil: "민사소송",
      payment_order: "지급명령",
      property_disclosure: "재산명시",
      execution: "강제집행",
    };
    return types[type] || type;
  };

  useEffect(() => {
    if (user && lawsuit?.id) {
      fetchSubmissions();
    }
  }, [user, lawsuit]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("test_lawsuit_submissions")
        .select(
          `
          *,
          created_by_user:created_by(id, name, email)
        `
        )
        .eq("lawsuit_id", lawsuit.id)
        .order("submission_date", { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error("송달/제출 내역 조회 실패:", error);
      toast.error("송달/제출 내역 조회 실패", {
        description: error.message,
      });
    } finally {
      setLoading(false);
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

    // 송달문서/제출문서에 따라 발신자/수신자 기본값 설정
    if (field === "submission_type") {
      if (value === "송달문서") {
        setFormData({
          ...formData,
          submission_type: value,
          from_entity: "법원",
          to_entity: "본인",
          document_type: "",
        });
      } else {
        setFormData({
          ...formData,
          submission_type: value,
          from_entity: "본인",
          to_entity: "법원",
          document_type: "",
        });
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setFileToUpload(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("파일 크기 초과", {
        description: "10MB 이하의 파일만 업로드할 수 있습니다.",
      });
      e.target.value = "";
      return;
    }

    setFileToUpload(file);

    if (formErrors.file) {
      setFormErrors({
        ...formErrors,
        file: null,
      });
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.submission_type) errors.submission_type = "유형을 선택해주세요";
    if (!formData.document_type) errors.document_type = "문서 종류를 선택해주세요";
    if (!formData.submission_date) errors.submission_date = "날짜를 선택해주세요";
    if (!formData.from_entity) errors.from_entity = "발신 주체를 선택해주세요";
    if (!formData.to_entity) errors.to_entity = "수신 주체를 선택해주세요";
    if (formData.from_entity === formData.to_entity)
      errors.to_entity = "발신 주체와 수신 주체는 서로 다르게 선택해주세요";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const uploadFile = async (file) => {
    if (!file) return null;

    // 파일 이름에 타임스탬프 추가하여 중복 방지
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}_${lawsuit.id}.${fileExt}`;
    const filePath = `cases/${lawsuit.case_id}/submissions/${fileName}`;

    const { data, error } = await supabase.storage.from("case-documents").upload(filePath, file);

    if (error) throw error;

    // 파일 URL 생성
    const { data: urlData } = supabase.storage.from("case-documents").getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user || (user.role !== "admin" && user.role !== "staff")) {
      toast.error("권한이 없습니다", {
        description: "관리자 또는 직원만 송달/제출 내역을 추가할 수 있습니다",
      });
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      let fileUrl = null;
      if (fileToUpload) {
        fileUrl = await uploadFile(fileToUpload);
      }

      const newSubmission = {
        lawsuit_id: lawsuit.id,
        submission_type: formData.submission_type,
        document_type: formData.document_type,
        submission_date: formData.submission_date.toISOString(),
        from_entity: formData.from_entity,
        to_entity: formData.to_entity,
        description: formData.description.trim() || null,
        file_url: fileUrl,
        created_by: user.id,
      };

      const { data, error } = await supabase
        .from("test_lawsuit_submissions")
        .insert(newSubmission)
        .select();

      if (error) throw error;

      toast.success("송달/제출 내역이 추가되었습니다", {
        description: "내역이 성공적으로 추가되었습니다.",
      });

      // 폼 초기화 및 다이얼로그 닫기
      resetForm();
      setShowAddModal(false);

      // 성공 콜백 호출
      if (onSuccess) {
        onSuccess();
      }

      // 새로운 송달/제출 내역 목록 가져오기
      fetchSubmissions();
    } catch (error) {
      console.error("송달/제출 내역 추가 실패:", error);
      toast.error("송달/제출 내역 추가 실패", {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (submissionId) => {
    if (!user || (user.role !== "admin" && user.role !== "staff")) {
      toast.error("권한이 없습니다", {
        description: "관리자 또는 직원만 송달/제출 내역을 삭제할 수 있습니다",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("test_lawsuit_submissions")
        .delete()
        .eq("id", submissionId);

      if (error) throw error;

      toast.success("송달/제출 내역이 삭제되었습니다", {
        description: "내역이 성공적으로 삭제되었습니다.",
      });

      // 업데이트된 목록 가져오기
      fetchSubmissions();
    } catch (error) {
      console.error("송달/제출 내역 삭제 실패:", error);
      toast.error("송달/제출 내역 삭제 실패", {
        description: error.message,
      });
    }
  };

  const resetForm = () => {
    setFormData({
      submission_type: "송달문서",
      document_type: "",
      submission_date: new Date(),
      from_entity: "법원",
      to_entity: "본인",
      description: "",
    });
    setFileToUpload(null);
    setFormErrors({});
  };

  const getFilteredSubmissions = () => {
    if (activeTab === "all") return submissions;
    return submissions.filter((item) => item.submission_type === activeTab);
  };

  const getSubmissionTypeIcon = (type) => {
    const submissionType = submissionTypes.find((t) => t.value === type);
    const Icon = submissionType?.icon || FileText;
    return <Icon className="h-4 w-4" />;
  };

  // 송달/제출 내역 행 렌더링
  const renderSubmissionRow = (submission) => (
    <TableRow key={submission.id}>
      <TableCell>
        <Badge
          variant={submission.submission_type === "송달문서" ? "outline" : "secondary"}
          className="flex items-center gap-1 w-fit"
        >
          {getSubmissionTypeIcon(submission.submission_type)}
          <span>{submission.submission_type}</span>
        </Badge>
      </TableCell>
      <TableCell>{submission.document_type}</TableCell>
      <TableCell>
        {format(new Date(submission.submission_date), "yyyy-MM-dd", { locale: ko })}
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="w-fit">
          {submission.from_entity}
        </Badge>
        <ArrowRight className="h-3 w-3 inline mx-2" />
        <Badge variant="outline" className="w-fit">
          {submission.to_entity}
        </Badge>
      </TableCell>
      <TableCell>{submission.description || "-"}</TableCell>
      <TableCell>
        {submission.file_url ? (
          <a
            href={submission.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
          >
            <FileText className="h-4 w-4" />
            <span>보기</span>
          </a>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        {user && (user.role === "admin" || user.role === "staff") && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Trash2 size={16} />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>송달/제출 내역 삭제</AlertDialogTitle>
                <AlertDialogDescription>
                  이 송달/제출 내역을 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(submission.id)}>
                  삭제
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </TableCell>
    </TableRow>
  );

  // 등록 폼 렌더링
  const renderSubmissionForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>송달/제출 유형</Label>
        <div className="flex gap-4">
          {submissionTypes.map((type) => {
            const Icon = type.icon;
            return (
              <div
                key={type.value}
                className={cn(
                  "flex items-center gap-2 p-3 border rounded-md cursor-pointer hover:bg-accent",
                  formData.submission_type === type.value
                    ? "border-primary bg-primary/10"
                    : "border-muted"
                )}
                onClick={() => handleInputChange("submission_type", type.value)}
              >
                <Icon className="h-5 w-5" />
                <div className="font-medium">{type.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>발신 주체</Label>
          <Select
            value={formData.from_entity}
            onValueChange={(value) => handleInputChange("from_entity", value)}
          >
            <SelectTrigger className={formErrors.from_entity ? "border-red-500" : ""}>
              <SelectValue placeholder="발신 주체 선택" />
            </SelectTrigger>
            <SelectContent>
              {entityTypes.map((entity) => (
                <SelectItem key={entity.value} value={entity.value}>
                  {entity.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formErrors.from_entity && (
            <p className="text-xs text-red-500">{formErrors.from_entity}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>수신 주체</Label>
          <Select
            value={formData.to_entity}
            onValueChange={(value) => handleInputChange("to_entity", value)}
          >
            <SelectTrigger className={formErrors.to_entity ? "border-red-500" : ""}>
              <SelectValue placeholder="수신 주체 선택" />
            </SelectTrigger>
            <SelectContent>
              {entityTypes.map((entity) => (
                <SelectItem key={entity.value} value={entity.value}>
                  {entity.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formErrors.to_entity && <p className="text-xs text-red-500">{formErrors.to_entity}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label>문서 종류</Label>
        <Select
          value={formData.document_type}
          onValueChange={(value) => handleInputChange("document_type", value)}
        >
          <SelectTrigger className={formErrors.document_type ? "border-red-500" : ""}>
            <SelectValue placeholder="문서 종류 선택" />
          </SelectTrigger>
          <SelectContent>
            {documentTypes[formData.submission_type]?.map((type) => (
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
        <Label>날짜</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
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
        <Label>설명</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          placeholder="문서에 대한 설명을 입력하세요"
          className="min-h-[80px]"
        />
      </div>

      <div className="space-y-2">
        <Label>파일 첨부</Label>
        <Input
          type="file"
          onChange={handleFileChange}
          className="cursor-pointer"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        />
        <p className="text-xs text-muted-foreground">PDF, Word, 이미지 파일 (최대 10MB)</p>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            resetForm();
            setShowAddModal(false);
          }}
        >
          취소
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "저장 중..." : "저장"}
        </Button>
      </DialogFooter>
    </form>
  );

  if (!lawsuit) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">먼저 소송을 선택해주세요</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 justify-between items-start sm:items-center">
        <div>
          <h3 className="text-lg font-medium">
            {getLawsuitTypeText(lawsuit.lawsuit_type)} - {lawsuit.case_number} 전자소송 내역
          </h3>
          <p className="text-sm text-muted-foreground">{lawsuit.court_name}</p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSubmissions}
            className="flex items-center gap-1"
          >
            <RefreshCw size={14} />
            새로고침
          </Button>
          {user && (user.role === "staff" || user.role === "admin") && !viewOnly && (
            <Button
              size="sm"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1"
            >
              <Plus size={14} />
              내역 등록
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">전체</TabsTrigger>
          <TabsTrigger value="송달문서" className="flex items-center gap-1">
            <ArrowDown className="h-4 w-4" />
            송달문서
          </TabsTrigger>
          <TabsTrigger value="제출문서" className="flex items-center gap-1">
            <ArrowUp className="h-4 w-4" />
            제출문서
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {renderSubmissionsTable()}
        </TabsContent>
        <TabsContent value="송달문서" className="mt-4">
          {renderSubmissionsTable("송달문서")}
        </TabsContent>
        <TabsContent value="제출문서" className="mt-4">
          {renderSubmissionsTable("제출문서")}
        </TabsContent>
      </Tabs>

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>송달/제출 내역 등록</DialogTitle>
          </DialogHeader>
          {renderSubmissionForm()}
        </DialogContent>
      </Dialog>
    </div>
  );

  function renderSubmissionsTable(filterType) {
    const filtered = filterType
      ? submissions.filter((s) => s.submission_type === filterType)
      : submissions;

    if (loading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[50px] w-full" />
          ))}
        </div>
      );
    }

    if (filtered.length === 0) {
      return (
        <div className="text-center py-10 border rounded-md bg-muted/20">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">
            {filterType ? `등록된 ${filterType}가 없습니다` : "등록된 송달/제출 내역이 없습니다"}
          </p>
          {user && (user.role === "staff" || user.role === "admin") && !viewOnly && (
            <Button variant="outline" onClick={() => setShowAddModal(true)}>
              내역 등록하기
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>유형</TableHead>
              <TableHead>문서 종류</TableHead>
              <TableHead>날짜</TableHead>
              <TableHead>발신/수신</TableHead>
              <TableHead>설명</TableHead>
              <TableHead>첨부파일</TableHead>
              <TableHead className="text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{filtered.map(renderSubmissionRow)}</TableBody>
        </Table>
      </div>
    );
  }
}

function ArrowRight(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
