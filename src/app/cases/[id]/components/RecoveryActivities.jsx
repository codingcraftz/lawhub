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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  CalendarIcon,
  Plus,
  RefreshCw,
  Filter,
  FileEdit,
  Trash2,
  Upload,
  FileCheck,
  Clock,
  Check,
  X,
  Download,
  Link as LinkIcon,
  PaperclipIcon,
  Calendar as CalendarIcon2,
  Eye,
} from "lucide-react";
import { format as dateFnsFormat, parseISO } from "date-fns";
import { AlertCircle, CircleDollarSign, FileText, Phone, User2 } from "lucide-react";
import { cn } from "@/lib/utils";
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
import Link from "next/link";

// 통합된 모달 컴포넌트 가져오기
import { RecoveryActivityModal } from "./modals";

export default function RecoveryActivities({ caseId, limit, isDashboard = false, parties }) {
  const router = useRouter();
  const { user } = useUser();
  console.log("parties", parties);

  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  const activityTypes = [
    { value: "call", label: "전화 연락" },
    { value: "visit", label: "방문" },
    { value: "payment", label: "납부" },
    { value: "letter", label: "통지서 발송" },
    { value: "legal", label: "법적 조치" },
    { value: "other", label: "기타" },
  ];

  useEffect(() => {
    if (user) {
      fetchActivities();
    }
  }, [user, caseId]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("test_recovery_activities")
        .select(
          `
          *,
          created_by_user:users(id, name, email)
        `
        )
        .eq("case_id", caseId)
        .order("date", { ascending: false });

      // 대시보드 모드면 limit 적용
      if (isDashboard && limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      // 활동 데이터 설정
      setActivities(data || []);
    } catch (error) {
      console.error("회수 활동 조회 실패:", error);
      toast.error("회수 활동 조회 실패", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (activityId) => {
    if (!user || (user.role !== "admin" && user.role !== "staff")) {
      toast.error("권한이 없습니다", {
        description: "관리자 또는 직원만 회수 활동을 삭제할 수 있습니다",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("test_recovery_activities")
        .delete()
        .eq("id", activityId);

      if (error) throw error;

      toast.success("회수 활동이 삭제되었습니다", {
        description: "회수 활동이 성공적으로 삭제되었습니다.",
      });

      // 업데이트된 목록 가져오기
      fetchActivities();
    } catch (error) {
      console.error("회수 활동 삭제 실패:", error);
      toast.error("회수 활동 삭제 실패", {
        description: error.message,
      });
    }
  };

  // 활동 유형에 따른 텍스트 반환
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

  const getActivityTypeIcon = (type) => {
    switch (type) {
      case "call":
        return <Phone className="h-4 w-4" />;
      case "payment":
        return <CircleDollarSign className="h-4 w-4" />;
      case "letter":
        return <FileText className="h-4 w-4" />;
      case "visit":
        return <User2 className="h-4 w-4" />;
      case "legal":
        return <FileCheck className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getActivityIconBg = (type) => {
    switch (type) {
      case "call":
        return "bg-blue-500 dark:bg-blue-600";
      case "payment":
        return "bg-green-500 dark:bg-green-600";
      case "letter":
        return "bg-amber-500 dark:bg-amber-600";
      case "visit":
        return "bg-purple-500 dark:bg-purple-600";
      case "legal":
        return "bg-red-500 dark:bg-red-600";
      default:
        return "bg-gray-500 dark:bg-gray-600";
    }
  };

  const getActivityItemBg = (type) => {
    switch (type) {
      case "call":
        return "bg-blue-50/40 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/30";
      case "payment":
        return "bg-green-50/40 dark:bg-green-900/10 border-green-100 dark:border-green-800/30";
      case "letter":
        return "bg-amber-50/40 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/30";
      case "visit":
        return "bg-purple-50/40 dark:bg-purple-900/10 border-purple-100 dark:border-purple-800/30";
      case "legal":
        return "bg-red-50/40 dark:bg-red-900/10 border-red-100 dark:border-red-800/30";
      default:
        return "bg-gray-50/40 dark:bg-gray-900/10 border-gray-100 dark:border-gray-800/30";
    }
  };

  const getStatusBadge = (status) => {
    if (status === "predicted") {
      return (
        <Badge
          variant="outline"
          className="border-amber-500 text-amber-500 flex items-center gap-1"
        >
          <CalendarIcon className="h-3 w-3" />
          예정
        </Badge>
      );
    } else {
      return (
        <Badge
          variant="outline"
          className="border-green-500 text-green-500 flex items-center gap-1"
        >
          <Check className="h-3 w-3" />
          완료
        </Badge>
      );
    }
  };

  // 활동 추가 모달 컨트롤
  const handleAddActivity = () => {
    setIsEditing(false);
    setCurrentActivity(null);
    setShowModal(true);
  };

  // 활동 수정 모달 컨트롤
  const handleEditActivity = (activity) => {
    setIsEditing(true);
    setCurrentActivity(activity);
    setShowModal(true);
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setCurrentActivity(null);
  };

  // 날짜 그룹으로 활동 항목 정렬
  const groupActivitiesByDate = (activities) => {
    const sorted = [...activities].sort((a, b) => new Date(b.date) - new Date(a.date));

    const groups = {};
    sorted.forEach((activity) => {
      const date = format(new Date(activity.date), "yyyy-MM-dd");
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(activity);
    });

    // 날짜 그룹을 최신 날짜가 먼저 오도록 정렬
    return Object.entries(groups)
      .map(([date, items]) => ({
        date,
        items,
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const getFilteredActivities = () => {
    if (activeTab === "all") return activities;
    return activities.filter((item) => item.activity_type === activeTab);
  };

  // 타임라인 렌더링
  const renderTimeline = () => {
    const filteredActivities = getFilteredActivities();
    const groupedData = groupActivitiesByDate(filteredActivities);

    if (loading) {
      return (
        <div className="space-y-4 pt-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[100px] w-full" />
          ))}
        </div>
      );
    }

    if (filteredActivities.length === 0) {
      return (
        <div className="text-center py-10 border rounded-md bg-background/50">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">
            {activeTab !== "all"
              ? `등록된 ${getActivityTypeText(activeTab)}가 없습니다`
              : "등록된 회수 활동이 없습니다"}
          </p>
          {user && (user.role === "staff" || user.role === "admin") && !isDashboard && (
            <Button variant="outline" className="mt-4" onClick={handleAddActivity}>
              회수 활동 추가하기
            </Button>
          )}
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
                <CalendarIcon2 className="h-5 w-5 text-foreground/70" />
              </div>
              <h3 className="font-medium text-foreground">
                {format(new Date(group.date), "yyyy년 MM월 dd일", { locale: ko })}
              </h3>
            </div>

            <div className="space-y-3 ml-14">
              {group.items.map((item, itemIndex) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-lg border relative ${getActivityItemBg(
                    item.activity_type
                  )}`}
                >
                  {/* 타임라인 항목 아이콘 */}
                  <div className="absolute -left-[40px] top-4 z-10">
                    <div
                      className={`h-6 w-6 rounded-full ${getActivityIconBg(
                        item.activity_type
                      )} flex items-center justify-center text-white`}
                    >
                      {getActivityTypeIcon(item.activity_type)}
                    </div>
                  </div>

                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex flex-wrap gap-2 items-center mb-1">
                        <Badge variant="outline" className="flex items-center gap-1">
                          {getActivityTypeIcon(item.activity_type)}
                          <span>{getActivityTypeText(item.activity_type)}</span>
                        </Badge>
                        {item.amount > 0 && (
                          <span className="text-sm font-medium text-green-600 dark:text-green-400">
                            {formatCurrency(item.amount)}
                          </span>
                        )}
                        {getStatusBadge(item.status || "completed")}
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(item.date), "HH:mm", { locale: ko })}
                        </span>
                      </div>

                      <p className="text-sm text-foreground/90 mt-2 rounded">{item.description}</p>

                      {item.notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          비고: {item.notes}
                        </p>
                      )}

                      {item.file_url && (
                        <div className="flex gap-1 mt-2">
                          <Button variant="outline" size="sm" className="h-7 px-2 text-xs" asChild>
                            <a href={item.file_url} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-3 w-3 mr-1" />
                              보기
                            </a>
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 px-2 text-xs" asChild>
                            <a href={item.file_url} download>
                              <Download className="h-3 w-3 mr-1" />
                              다운로드
                            </a>
                          </Button>
                        </div>
                      )}
                    </div>

                    {user && (user.role === "admin" || user.role === "staff") && !isDashboard && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditActivity(item)}
                        >
                          <FileEdit size={16} />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Trash2 size={16} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>회수 활동 삭제</AlertDialogTitle>
                              <AlertDialogDescription>
                                이 회수 활동을 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
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

  // 당사자 유형에 따른 색상 반환 함수 추가
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

  return (
    <Card className="w-full border-0 bg-white/90 dark:bg-slate-900/90 shadow-md rounded-xl overflow-hidden backdrop-blur-sm">
      {!isDashboard && (
        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
          <CardTitle className="text-xl">회수 활동 기록</CardTitle>
          <div className="flex items-center gap-2">
            {user && (user.role === "staff" || user.role === "admin") && (
              <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogTrigger asChild>
                  <Button size="sm" className="flex items-center gap-1" onClick={handleAddActivity}>
                    <Plus size={14} />
                    활동 추가
                  </Button>
                </DialogTrigger>
                <RecoveryActivityModal
                  open={showModal}
                  onOpenChange={handleCloseModal}
                  onSuccess={fetchActivities}
                  caseId={caseId}
                  user={user}
                  parties={parties}
                  activity={currentActivity}
                  isEditing={isEditing}
                />
              </Dialog>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent className={isDashboard ? "pt-4" : ""}>{renderTimeline()}</CardContent>
    </Card>
  );
}
