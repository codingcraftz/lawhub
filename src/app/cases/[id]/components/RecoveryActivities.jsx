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

export default function RecoveryActivities({ caseId, limit, isDashboard = false }) {
  const router = useRouter();
  const { user } = useUser();

  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentActivity, setCurrentActivity] = useState(null);

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
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getActivityTypeLabel = (type) => {
    const types = {
      call: "전화",
      visit: "방문",
      payment: "납부",
      letter: "내용증명",
      legal: "법적조치",
      other: "기타",
    };
    return types[type] || type;
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
          <CalendarIcon className="h-3 w-3" />
          완료
        </Badge>
      );
    }
  };

  // 활동 추가 모달 열기
  const handleAddActivity = () => {
    setIsEditing(false);
    setCurrentActivity(null);
    setShowModal(true);
  };

  // 활동 수정 모달 열기
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

  return (
    <Card className="w-full">
      {!isDashboard && (
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">회수 활동 기록</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchActivities}
              className="flex items-center gap-1"
            >
              <RefreshCw size={14} />
              새로고침
            </Button>

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
                  activity={currentActivity}
                  isEditing={isEditing}
                />
              </Dialog>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col space-y-2">
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>등록된 회수 활동이 없습니다.</p>
            {user && (user.role === "staff" || user.role === "admin") && !isDashboard && (
              <Button variant="outline" className="mt-4" onClick={handleAddActivity}>
                회수 활동 추가하기
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>날짜</TableHead>
                  <TableHead>활동 유형</TableHead>
                  <TableHead>내용</TableHead>
                  <TableHead>금액</TableHead>
                  <TableHead>상태</TableHead>
                  {!isDashboard && (
                    <>
                      <TableHead>첨부</TableHead>
                      <TableHead>비고</TableHead>
                      <TableHead>생성자</TableHead>
                    </>
                  )}
                  {user && (user.role === "staff" || user.role === "admin") && !isDashboard && (
                    <TableHead className="text-right">관리</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(activity.date), "yyyy. MM. dd", { locale: ko })}
                    </TableCell>
                    <TableCell>{getActivityTypeText(activity.activity_type)}</TableCell>
                    <TableCell className="max-w-xs truncate">{activity.description}</TableCell>
                    <TableCell>{formatCurrency(activity.amount)}</TableCell>
                    <TableCell>{getStatusBadge(activity.status || "completed")}</TableCell>
                    {!isDashboard && (
                      <>
                        <TableCell>
                          {activity.file_url ? (
                            <Link
                              href={activity.file_url}
                              target="_blank"
                              className="text-blue-500 hover:underline flex items-center"
                            >
                              <PaperclipIcon className="h-4 w-4 mr-1" />
                              첨부
                            </Link>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{activity.notes || "-"}</TableCell>
                        <TableCell>{activity.created_by_user?.name || "알 수 없음"}</TableCell>
                      </>
                    )}
                    {user && (user.role === "staff" || user.role === "admin") && !isDashboard && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditActivity(activity)}
                            className="h-8 w-8"
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
                                  이 회수 활동을 정말 삭제하시겠습니까? 이 작업은 되돌릴 수
                                  없습니다.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>취소</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(activity.id)}>
                                  삭제
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
