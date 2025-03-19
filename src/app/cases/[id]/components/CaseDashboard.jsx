import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/utils/format";
import { supabase } from "@/utils/supabase";
import RecoveryActivities from "./RecoveryActivities";
import CaseNotifications from "./CaseNotifications";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import CalendarView from "@/components/Calendar";
import {
  AlertCircle,
  ChevronRight,
  Scale,
  CircleDollarSign,
  TrendingUp,
  Gavel,
  FileText,
  Calendar as CalendarIcon,
  RefreshCw,
  ArrowUpRight,
  Bell,
  Clock,
  Activity,
  Users,
  PieChart,
  CreditCard,
  DollarSign,
  Percent,
  BarChart3,
  ChevronLeft,
  ChevronUp,
  MoreHorizontal,
  Info,
  Edit,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ko } from "date-fns/locale";
import {
  format,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  isSameDay,
  parseISO,
  isToday,
} from "date-fns";

export default function CaseDashboard({ caseId, caseData, parties, clients }) {
  const [lawsuits, setLawsuits] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loadingLawsuits, setLoadingLawsuits] = useState(true);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [recoveryData, setRecoveryData] = useState({
    principalAmount: caseData?.principal_amount || 0,
    totalAmount: 0, // 원리금 (채권원금 + 이자 + 비용)
    recoveredAmount: 0, // 회수금액
    recoveryRate: 0, // 회수율
    isLoading: true,
  });

  // 달력 관련 상태 추가
  const [schedules, setSchedules] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchLawsuits();
    fetchNotifications();
    calculateRecoveryData();
    fetchSchedules();
  }, [caseId]);

  // 월 변경 시 해당 월의 일정 가져오기
  useEffect(() => {
    fetchSchedules();
  }, [currentMonth]);

  // 일정 정보 가져오기
  const fetchSchedules = async () => {
    setLoadingSchedules(true);
    try {
      const startDate = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        1
      ).toISOString();
      const endDate = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        0,
        23,
        59,
        59
      ).toISOString();

      const { data, error } = await supabase
        .from("test_schedules")
        .select("*")
        .eq("case_id", caseId)
        .gte("event_date", startDate)
        .lte("event_date", endDate)
        .order("event_date", { ascending: true });

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error("일정 정보 조회 실패:", error);
      toast.error("일정 정보 조회에 실패했습니다");
    } finally {
      setLoadingSchedules(false);
    }
  };

  // 알림 정보 가져오기
  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const { data, error } = await supabase
        .from("test_notifications")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("알림 정보 조회 실패:", error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // 소송 정보 가져오기
  const fetchLawsuits = async () => {
    setLoadingLawsuits(true);
    try {
      const { data, error } = await supabase
        .from("test_case_lawsuits")
        .select(
          `
          *,
          lawsuit_parties:test_lawsuit_parties(
            id,
            party_type,
            party:test_case_parties(*)
          )
        `
        )
        .eq("case_id", caseId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLawsuits(data || []);
    } catch (error) {
      console.error("소송 정보 조회 실패:", error);
      toast.error("소송 정보 조회 실패");
    } finally {
      setLoadingLawsuits(false);
    }
  };

  // 회수 데이터 계산
  const calculateRecoveryData = async () => {
    setRecoveryData((prev) => ({ ...prev, isLoading: true }));
    try {
      // 회수 활동에서 납부 금액 합계 조회
      const { data: recoveryData, error: recoveryError } = await supabase
        .from("test_recovery_activities")
        .select("amount")
        .eq("case_id", caseId)
        .eq("activity_type", "payment")
        .eq("status", "completed");

      if (recoveryError) throw recoveryError;

      // 이자 및 비용 정보 조회
      const { data: interestData, error: interestError } = await supabase
        .from("test_case_interests")
        .select("*")
        .eq("case_id", caseId);

      if (interestError) throw interestError;

      const { data: expenseData, error: expenseError } = await supabase
        .from("test_case_expenses")
        .select("amount")
        .eq("case_id", caseId);

      if (expenseError) throw expenseError;

      // 이자 금액 계산 (간단히 합산)
      const interestAmount = interestData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;

      // 비용 합계 계산
      const expenseAmount = expenseData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;

      // 원리금 총액 계산 (원금 + 이자 + 비용)
      const principalAmount = caseData?.principal_amount || 0;
      const totalAmount = principalAmount + interestAmount + expenseAmount;

      // 회수 금액 계산
      const recoveredAmount = recoveryData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;

      // 회수율 계산 (소수점 2자리까지)
      const recoveryRate = totalAmount > 0 ? (recoveredAmount / totalAmount) * 100 : 0;

      setRecoveryData({
        principalAmount,
        totalAmount,
        recoveredAmount,
        recoveryRate,
        isLoading: false,
      });
    } catch (error) {
      console.error("회수 데이터 계산 실패:", error);
      setRecoveryData((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // 일정 관련 처리 함수
  const handleAddSchedule = (date) => {
    // 일정 추가 모달 열기 로직 (후에 구현)
    toast.info("일정 추가 기능은 준비 중입니다");
  };

  const handleEditSchedule = (schedule) => {
    // 일정 수정 모달 열기 로직 (후에 구현)
    toast.info("일정 수정 기능은 준비 중입니다");
  };

  const handleDeleteSchedule = (schedule) => {
    // 일정 삭제 확인 및 처리 로직 (후에 구현)
    toast.info("일정 삭제 기능은 준비 중입니다");
  };

  const handleRefreshSchedules = (month) => {
    setCurrentMonth(month);
    fetchSchedules();
  };

  // 소송 유형 텍스트
  const getLawsuitTypeText = (type) => {
    switch (type) {
      case "civil":
        return "민사";
      case "criminal":
        return "형사";
      case "administrative":
        return "행정";
      case "family":
        return "가사";
      case "bankruptcy":
        return "파산";
      case "rehabilitation":
        return "회생";
      default:
        return type;
    }
  };

  // 소송 상태에 따른 배지
  const getLawsuitStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-amber-100 hover:bg-amber-200 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-800/50 border border-amber-200 dark:border-amber-800/50">
            <CalendarIcon className="w-3 h-3 mr-1" />
            대기
          </Badge>
        );
      case "filed":
        return (
          <Badge className="bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-800/50 border border-blue-200 dark:border-blue-800/50">
            <FileText className="w-3 h-3 mr-1" />
            소제기
          </Badge>
        );
      case "in_progress":
        return (
          <Badge className="bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-800/50 border border-purple-200 dark:border-purple-800/50">
            <RefreshCw className="w-3 h-3 mr-1" />
            진행중
          </Badge>
        );
      case "decision":
        return (
          <Badge className="bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-800/50 border border-green-200 dark:border-green-800/50">
            <Gavel className="w-3 h-3 mr-1" />
            판결
          </Badge>
        );
      case "appeal":
        return (
          <Badge className="bg-orange-100 hover:bg-orange-200 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 dark:hover:bg-orange-800/50 border border-orange-200 dark:border-orange-800/50">
            <ArrowUpRight className="w-3 h-3 mr-1" />
            항소
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-800/50 border border-emerald-200 dark:border-emerald-800/50">
            완료
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700">
            {status}
          </Badge>
        );
    }
  };

  // 알림 유형에 따른 아이콘 가져오기
  const getNotificationIcon = (type) => {
    switch (type) {
      case "lawsuit_update":
        return <Gavel className="w-4 h-4 text-purple-500" />;
      case "recovery_activity":
        return <CreditCard className="w-4 h-4 text-green-500" />;
      case "deadline":
        return <CalendarIcon className="w-4 h-4 text-red-500" />;
      case "document":
        return <FileText className="w-4 h-4 text-blue-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  // 알림 생성 시간 포맷팅
  const formatNotificationTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffDay > 0) {
      return `${diffDay}일 전`;
    } else if (diffHour > 0) {
      return `${diffHour}시간 전`;
    } else if (diffMin > 0) {
      return `${diffMin}분 전`;
    } else {
      return "방금 전";
    }
  };

  // 날짜에 표시할 일정 점 렌더링
  const renderDateScheduleIndicator = (day) => {
    const eventsOnDay = schedules.filter((event) => isSameDay(parseISO(event.event_date), day));

    if (eventsOnDay.length === 0) return null;

    // 일정이 3개 이하면 모두 표시, 3개 초과면 3개까지만 표시하고 +로 표시
    const displayedEvents = eventsOnDay.slice(0, 3);
    const hasMoreEvents = eventsOnDay.length > 3;

    return (
      <div className="flex flex-col items-center mt-1 space-y-1">
        <div className="flex space-x-1">
          {displayedEvents.map((event, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${getEventColor(event.event_type)}`} />
          ))}
          {hasMoreEvents && (
            <span className="text-[10px] text-gray-500 dark:text-gray-400">
              +{eventsOnDay.length - 3}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* 채권 회수 현황 요약 */}
      <Card className="border-0 bg-white/90 dark:bg-slate-900/90 shadow-md rounded-xl overflow-hidden backdrop-blur-sm">
        <CardHeader className="pb-2 border-b border-gray-100 dark:border-gray-800">
          <CardTitle className="text-xl font-bold flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
            채권 회수 현황
          </CardTitle>
          <CardDescription>이 사건의 채권 원금, 회수 금액 및 회수율을 보여줍니다.</CardDescription>
        </CardHeader>
        <CardContent className="py-4">
          {recoveryData.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                <div className="flex items-center mb-2">
                  <DollarSign className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    채권 원금
                  </span>
                </div>
                <div className="font-bold text-gray-900 dark:text-white">
                  {formatCurrency(recoveryData.principalAmount)}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                <div className="flex items-center mb-2">
                  <PieChart className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    총 채권액
                  </span>
                </div>
                <div className="font-bold text-gray-900 dark:text-white">
                  {formatCurrency(recoveryData.totalAmount)}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                <div className="flex items-center mb-2">
                  <CreditCard className="w-5 h-5 mr-2 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    회수 금액
                  </span>
                </div>
                <div className="font-bold text-gray-900 dark:text-white">
                  {formatCurrency(recoveryData.recoveredAmount)}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                <div className="flex items-center mb-2">
                  <Percent className="w-5 h-5 mr-2 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    회수율
                  </span>
                </div>
                <div className="font-bold text-gray-900 dark:text-white">
                  {recoveryData.recoveryRate.toFixed(1)}%
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-0 pb-4">
          <div className="w-full mt-2">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">회수 진행률</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {recoveryData.recoveryRate.toFixed(1)}%
              </p>
            </div>
            <div className="relative h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(recoveryData.recoveryRate, 100)}%` }}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900"
              onClick={calculateRecoveryData}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              새로고침
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* 일정 달력 - 새 컴포넌트 사용 */}
      <CalendarView
        schedules={schedules}
        onAddSchedule={handleAddSchedule}
        onEditSchedule={handleEditSchedule}
        onDeleteSchedule={handleDeleteSchedule}
        isLoading={loadingSchedules}
        onRefresh={handleRefreshSchedules}
        title="사건 일정 달력"
        description="소송 기일, 분납 일정 등을 달력 형태로 확인할 수 있습니다."
      />

      {/* 주요 정보 그리드 - 당사자 정보와 최근 활동 알림 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 당사자 정보 */}
        <Card className="border-0 bg-white/90 dark:bg-slate-900/90 shadow-md rounded-xl overflow-hidden backdrop-blur-sm">
          <CardHeader className="pb-2 border-b border-gray-100 dark:border-gray-800">
            <CardTitle className="text-lg font-bold flex items-center">
              <Users className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
              당사자 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 max-h-[400px] overflow-y-auto">
            {parties.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">등록된 당사자가 없습니다</p>
              </div>
            ) : (
              <div className="space-y-2">
                {parties.map((party) => (
                  <div
                    key={party.id}
                    className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:border-green-200 dark:hover:border-green-900/50 transition-colors cursor-pointer"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <Badge
                          className={cn(
                            "mb-1",
                            party.party_type === "plaintiff" || party.party_type === "creditor"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-900/50"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-900/50"
                          )}
                        >
                          {party.party_type === "plaintiff"
                            ? "원고"
                            : party.party_type === "defendant"
                            ? "피고"
                            : party.party_type === "creditor"
                            ? "채권자"
                            : party.party_type === "debtor"
                            ? "채무자"
                            : party.party_type}
                        </Badge>
                        <div className="flex items-center">
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {party.entity_type === "individual"
                              ? party.name
                              : party.company_name || "미입력"}
                          </p>
                          <Badge className="ml-2 text-xs" variant="outline">
                            {party.entity_type === "individual" ? "개인" : "법인"}
                          </Badge>
                        </div>
                        {party.phone && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {party.phone}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 최근 알림 및 활동 */}
        <Card className="border-0 bg-white/90 dark:bg-slate-900/90 shadow-md rounded-xl overflow-hidden backdrop-blur-sm">
          <CardHeader className="pb-2 border-b border-gray-100 dark:border-gray-800">
            <CardTitle className="text-lg font-bold flex items-center">
              <Activity className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
              최근 알림 및 활동
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 max-h-[400px] overflow-y-auto">
            {loadingNotifications ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex space-x-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">아직 알림이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border ${
                      notification.is_read
                        ? "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700"
                        : "bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30"
                    }`}
                  >
                    <div className="flex items-start">
                      <div className="rounded-full bg-white dark:bg-slate-700 p-2 mr-3">
                        {getNotificationIcon(notification.notification_type)}
                      </div>
                      <div className="flex-1">
                        <h4
                          className={`text-sm font-medium ${
                            notification.is_read
                              ? "text-gray-900 dark:text-gray-100"
                              : "text-blue-700 dark:text-blue-300"
                          }`}
                        >
                          {notification.title}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center mt-2 text-xs text-gray-400">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatNotificationTime(notification.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-0 pb-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900"
              onClick={fetchNotifications}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              알림 새로고침
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* 소송 정보 */}
      <Card className="border-0 bg-white/90 dark:bg-slate-900/90 shadow-md rounded-xl overflow-hidden backdrop-blur-sm">
        <CardHeader className="pb-2 border-b border-gray-100 dark:border-gray-800">
          <CardTitle className="text-lg font-bold flex items-center">
            <Gavel className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
            소송 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {loadingLawsuits ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : lawsuits.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">등록된 소송이 없습니다</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lawsuits.map((lawsuit) => (
                <div
                  key={lawsuit.id}
                  className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:border-purple-200 dark:hover:border-purple-900/50 transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-purple-700 dark:text-purple-300">
                      {getLawsuitTypeText(lawsuit.lawsuit_type)}
                    </span>
                    {getLawsuitStatusBadge(lawsuit.status)}
                  </div>
                  <p className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1 mb-2">
                    {lawsuit.case_number ? `사건번호: ${lawsuit.case_number}` : "사건번호 미입력"}
                  </p>
                  {lawsuit.court_name && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      법원: {lawsuit.court_name}
                    </p>
                  )}
                  {lawsuit.filing_date && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      소제기일: {formatDate(lawsuit.filing_date)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-0 pb-4">
          <Button
            variant="outline"
            size="sm"
            className="text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900"
            onClick={fetchLawsuits}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            소송 정보 새로고침
          </Button>
        </CardFooter>
      </Card>

      {/* 회수 활동 탭 */}
      <Card className="border-0 bg-white/90 dark:bg-slate-900/90 shadow-md rounded-xl overflow-hidden backdrop-blur-sm">
        <CardHeader className="pb-0 border-b-0">
          <Tabs defaultValue="recovery" className="w-full">
            <div className="flex justify-between items-center mb-4">
              <CardTitle className="text-lg font-bold">상세 활동 내역</CardTitle>
              <TabsList>
                <TabsTrigger value="recovery" className="text-sm">
                  <CreditCard className="w-4 h-4 mr-2" />
                  회수 활동
                </TabsTrigger>
                <TabsTrigger value="notifications" className="text-sm">
                  <Bell className="w-4 h-4 mr-2" />
                  알림 내역
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="recovery" className="mt-0 pt-0">
              <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                <RecoveryActivities caseId={caseId} limit={10} />
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="mt-0 pt-0">
              <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                <CaseNotifications caseId={caseId} limit={10} />
              </div>
            </TabsContent>
          </Tabs>
        </CardHeader>
      </Card>
    </div>
  );
}
