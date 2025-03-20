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
import { format, isSameDay, isBefore, isAfter } from "date-fns";
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
  Circle,
  ArrowRight,
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

export default function CaseTimeline({ lawsuit, viewOnly = false, onSuccess, onEdit }) {
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
      { value: "결정문", label: "결정문" },
      { value: "판결문", label: "판결문" },
    ],
    제출문서: [
      { value: "답변서", label: "답변서" },
      { value: "준비서면", label: "준비서면" },
      { value: "증거신청서", label: "증거신청서" },
      { value: "사실조회신청서", label: "사실조회신청서" },
      { value: "항소장", label: "항소장" },
      { value: "상고장", label: "상고장" },
    ],
  };

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
      console.error("타임라인 조회 실패:", error);
      toast.error("타임라인 조회 실패", {
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
        description: "관리자 또는 직원만 타임라인을 추가할 수 있습니다",
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
        from_entity: formData.submission_type === "송달문서" ? "법원" : "본인",
        to_entity: formData.submission_type === "송달문서" ? "본인" : "법원",
        description: formData.description.trim() || null,
        file_url: fileUrl,
        created_by: user.id,
      };

      const { data, error } = await supabase
        .from("test_lawsuit_submissions")
        .insert(newSubmission)
        .select();

      if (error) throw error;

      toast.success("타임라인에 추가되었습니다", {
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
      console.error("타임라인 추가 실패:", error);
      toast.error("타임라인 추가 실패", {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (submissionId) => {
    if (!user || (user.role !== "admin" && user.role !== "staff")) {
      toast.error("권한이 없습니다", {
        description: "관리자 또는 직원만 타임라인을 삭제할 수 있습니다",
      });
      return;
    }

    try {
      // 1. 먼저 관련된 알림 삭제
      const { data: notificationsData, error: notificationsError } = await supabase
        .from("test_case_notifications")
        .delete()
        .match({
          related_entity: "submission",
          related_id: submissionId,
        })
        .select("id");

      if (notificationsError) {
        console.error("알림 삭제 실패:", notificationsError);
        // 알림 삭제 실패 시에도 타임라인 항목은 삭제 진행
      } else {
        console.log(`${notificationsData.length}개의 관련 알림이 함께 삭제되었습니다.`);
      }

      // 2. 타임라인 항목 삭제
      const { error } = await supabase
        .from("test_lawsuit_submissions")
        .delete()
        .eq("id", submissionId);

      if (error) throw error;

      toast.success("타임라인 항목이 삭제되었습니다", {
        description: "내역이 성공적으로 삭제되었습니다.",
      });

      // 업데이트된 목록 가져오기
      fetchSubmissions();
    } catch (error) {
      console.error("타임라인 삭제 실패:", error);
      toast.error("타임라인 삭제 실패", {
        description: error.message,
      });
    }
  };

  const resetForm = () => {
    setFormData({
      submission_type: "송달문서",
      document_type: "",
      submission_date: new Date(),
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

  // 타임라인 항목 배경색 설정
  const getTimelineItemBg = (type) => {
    if (type === "송달문서")
      return "bg-blue-50/40 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/30";
    return "bg-green-50/40 dark:bg-green-900/10 border-green-100 dark:border-green-800/30";
  };

  // 타임라인 항목 아이콘 배경색 설정
  const getTimelineIconBg = (type) => {
    if (type === "송달문서") return "bg-blue-500 dark:bg-blue-600";
    return "bg-green-500 dark:bg-green-600";
  };

  // 날짜 그룹으로 타임라인 항목 정렬
  const groupSubmissionsByDate = (submissions) => {
    const sorted = [...submissions].sort(
      (a, b) => new Date(b.submission_date) - new Date(a.submission_date)
    );

    const groups = {};
    sorted.forEach((submission) => {
      const date = format(new Date(submission.submission_date), "yyyy-MM-dd");
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(submission);
    });

    // 날짜 그룹을 최신 날짜가 먼저 오도록 정렬
    return Object.entries(groups)
      .map(([date, items]) => ({
        date,
        items,
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date)); // 최신 날짜가 상단에 오도록 정렬
  };

  // 타임라인 렌더링
  const renderTimeline = () => {
    const filteredSubmissions = getFilteredSubmissions();
    const groupedData = groupSubmissionsByDate(filteredSubmissions);

    if (loading) {
      return (
        <div className="space-y-4 pt-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[100px] w-full" />
          ))}
        </div>
      );
    }

    if (filteredSubmissions.length === 0) {
      return (
        <div className="text-center py-10 border rounded-md bg-background/50">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">
            {activeTab !== "all"
              ? `등록된 ${activeTab}가 없습니다`
              : "등록된 타임라인 항목이 없습니다"}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-8 relative py-2">
        {/* 타임라인 수직선 */}
        <div className="absolute top-0 bottom-0 left-[24px] w-[2px] bg-border z-0"></div>

        {groupedData.map((group, groupIndex) => (
          <div key={group.date} className="mb-6">
            <div className="flex mb-2 items-center z-10 relative">
              <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center mr-3 border-2 border-background shadow-sm">
                <Calendar className="h-5 w-5 text-foreground/70" />
              </div>
              <h3 className="font-medium text-foreground">
                {format(new Date(group.date), "yyyy년 MM월 dd일", { locale: ko })}
              </h3>
            </div>

            <div className="space-y-3 ml-14">
              {group.items.map((item, itemIndex) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-lg border relative ${getTimelineItemBg(
                    item.submission_type
                  )}`}
                >
                  {/* 타임라인 항목 아이콘 */}
                  <div className="absolute -left-[40px] top-4 z-10">
                    <div
                      className={`h-6 w-6 rounded-full ${getTimelineIconBg(
                        item.submission_type
                      )} flex items-center justify-center text-white`}
                    >
                      {getSubmissionTypeIcon(item.submission_type)}
                    </div>
                  </div>

                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex flex-wrap gap-2 items-center mb-1">
                        <Badge
                          variant={item.submission_type === "송달문서" ? "outline" : "secondary"}
                          className="flex items-center gap-1"
                        >
                          {getSubmissionTypeIcon(item.submission_type)}
                          <span>{item.submission_type}</span>
                        </Badge>
                        <Badge variant="outline">{item.document_type}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(item.submission_date), "HH:mm", { locale: ko })}
                        </span>
                      </div>

                      {item.description && (
                        <p className="text-sm text-foreground/90 mt-2 rounded">
                          {item.description}
                        </p>
                      )}

                      {item.file_url && (
                        <a
                          href={item.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-xs gap-1 mt-2 text-blue-600 hover:text-blue-800 rounded w-fit"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span>문서 보기</span>
                        </a>
                      )}
                    </div>

                    {user && (user.role === "admin" || user.role === "staff") && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onEdit && onEdit(item)}
                        >
                          <Edit size={16} />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Trash2 size={16} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>타임라인 항목 삭제</AlertDialogTitle>
                              <AlertDialogDescription>
                                이 타임라인 항목을 정말 삭제하시겠습니까? 이 작업은 되돌릴 수
                                없습니다.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>취소</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(item.id)}>
                                삭제
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (!lawsuit) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">먼저 소송을 선택해주세요</p>
      </div>
    );
  }

  return (
    <Card className="w-full border-0 bg-white/90 dark:bg-slate-900/90 shadow-md rounded-xl overflow-hidden backdrop-blur-sm">
      <CardContent className="pt-4">
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
            {renderTimeline()}
          </TabsContent>
          <TabsContent value="송달문서" className="mt-4">
            {renderTimeline()}
          </TabsContent>
          <TabsContent value="제출문서" className="mt-4">
            {renderTimeline()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
