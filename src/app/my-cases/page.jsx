"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { useUser } from "@/contexts/UserContext";
import { format, isToday, isYesterday } from "date-fns";
import { ko } from "date-fns/locale";
import { getStatusById } from "@/utils/constants";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CircleDollarSign,
  PieChart as PieChartIcon,
  BadgeDollarSign,
  Gavel,
  CreditCard,
  CalendarIcon,
  Bell,
  FileText as FileTextIcon,
  CheckCircle2,
  ChevronDown,
  AlertCircle,
  Timer,
  Hourglass,
  GanttChartSquare,
  BarChart3,
  FileBarChart,
  ChevronRight,
  User,
  Building2,
  Briefcase,
  Clock,
  Mail,
  Phone,
  Check,
  ExternalLink,
  FileCheck,
} from "lucide-react";

// 차트 컴포넌트는 recharts에서 가져오기
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// CasesTable 컴포넌트 추가
import { CasesTable } from "@/components/CasesTable";

// NotificationSummary 컴포넌트
function NotificationSummary({ notifications, loading }) {
  const router = useRouter();

  // 알림 유형에 따른 아이콘 반환
  const getNotificationIcon = (type) => {
    switch (type) {
      case "lawsuit":
        return <FileTextIcon className="h-4 w-4 text-blue-500" />;
      case "lawsuit_update":
        return <Gavel className="h-4 w-4 text-purple-500" />;
      case "recovery_activity":
        return <CreditCard className="h-4 w-4 text-green-500" />;
      case "deadline":
        return <CalendarIcon className="h-4 w-4 text-red-500" />;
      case "document":
        return <FileTextIcon className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleNotificationClick = (notification) => {
    // 알림을 읽음으로 표시
    updateNotificationReadStatus(notification.id);

    // 사건 상세 페이지로 이동
    router.push(`/cases/${notification.case_id}`);
  };

  const updateNotificationReadStatus = async (notificationId) => {
    try {
      await supabase
        .from("test_case_notifications")
        .update({ is_read: true })
        .eq("id", notificationId);
    } catch (error) {
      console.error("알림 상태 업데이트 실패:", error);
    }
  };

  return (
    <Card className="border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-md mb-8">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <Bell className="h-5 w-5 mr-2 text-amber-500" /> 최근 알림
        </CardTitle>
        <CardDescription>사건과 관련된 최신 알림</CardDescription>
      </CardHeader>
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
        ) : notifications.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <p>새로운 알림이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "p-4 border rounded-md cursor-pointer transition-colors",
                  notification.is_read
                    ? "bg-background hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    : "bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-100/50 dark:hover:bg-blue-900/20"
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex gap-3">
                  <div className="mt-0.5">
                    {getNotificationIcon(notification.notification_type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4
                        className={cn(
                          "font-medium text-sm",
                          !notification.is_read && "font-semibold"
                        )}
                      >
                        {notification.title}
                      </h4>
                      {!notification.is_read && (
                        <span className="h-2 w-2 rounded-full bg-blue-500 mt-1"></span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                      {notification.message}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </span>
                      <div className="flex gap-1">
                        {!notification.is_read && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs px-2"
                            onClick={(e) => markAsRead(e, notification.id)}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> 읽음
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs px-2"
                          onClick={() => router.push(`/cases/${notification.case_id}`)}
                        >
                          <ChevronRight className="h-3.5 w-3.5 mr-1" /> 보기
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div className="text-center pt-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => document.querySelector('[aria-label="알림"]')?.click()}
              >
                모든 알림 보기
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 알림 섹션 - NotificationsPanel 컴포넌트로 분리
function NotificationsPanel({ notifications = [], loading = false, router }) {
  const [activeTab, setActiveTab] = useState("unread");
  const [localNotifications, setLocalNotifications] = useState([]);

  useEffect(() => {
    setLocalNotifications(notifications);
  }, [notifications]);

  // 읽은 알림과 읽지 않은 알림으로 필터링
  const unreadNotifications = localNotifications.filter((n) => !n.is_read);
  const readNotifications = localNotifications.filter((n) => n.is_read);

  // 현재 탭에 따라 표시할 알림 목록
  const displayNotifications = activeTab === "unread" ? unreadNotifications : readNotifications;

  // 알림 읽음 표시
  const markAsRead = async (event, notificationId) => {
    event.stopPropagation();

    try {
      await supabase
        .from("test_case_notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      // 로컬 상태 업데이트
      setLocalNotifications((prev) =>
        prev.map((notif) => (notif.id === notificationId ? { ...notif, is_read: true } : notif))
      );
    } catch (error) {
      console.error("알림 상태 업데이트 실패:", error);
    }
  };

  // 알림 유형에 따른 아이콘 반환
  const getNotificationIcon = (type) => {
    switch (type) {
      case "lawsuit":
        return <FileTextIcon className="h-4 w-4 text-blue-500" />;
      case "lawsuit_update":
        return <Gavel className="h-4 w-4 text-purple-500" />;
      case "recovery_activity":
        return <CreditCard className="h-4 w-4 text-green-500" />;
      case "deadline":
        return <CalendarIcon className="h-4 w-4 text-red-500" />;
      case "document":
        return <FileTextIcon className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  // 탭 변경 핸들러
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <Card className="border shadow-sm overflow-hidden h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
      <CardHeader className="pb-2 border-b">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center">
            <Bell className="h-5 w-5 mr-2 text-amber-500" /> 최근 알림
          </CardTitle>
          <div className="flex items-center space-x-1 text-xs">
            <Button
              variant={activeTab === "unread" ? "default" : "outline"}
              size="sm"
              onClick={() => handleTabChange("unread")}
              className="h-7 text-xs px-2"
            >
              <span className="flex items-center">
                안읽음
                {unreadNotifications.length > 0 && (
                  <Badge className="ml-1 h-5 min-w-5 px-1 bg-primary/90 text-[10px]">
                    {unreadNotifications.length}
                  </Badge>
                )}
              </span>
            </Button>
            <Button
              variant={activeTab === "read" ? "default" : "outline"}
              size="sm"
              onClick={() => handleTabChange("read")}
              className="h-7 text-xs px-2"
            >
              읽음
            </Button>
          </div>
        </div>
        <CardDescription>사건과 관련된 최신 알림</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[520px] overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col space-y-2">
                  <Skeleton className="h-6 w-1/4" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : displayNotifications.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <Bell className="h-10 w-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-500 dark:text-gray-400">
                {activeTab === "unread" ? "새로운 알림이 없습니다." : "읽은 알림이 없습니다."}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {displayNotifications.slice(0, 5).map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-3 transition-colors",
                    !notification.is_read
                      ? "bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-100/60 dark:hover:bg-blue-900/30"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  )}
                >
                  <div className="flex gap-3">
                    <div className="mt-0.5">
                      <div className="bg-white dark:bg-gray-800 p-1.5 rounded-full shadow-sm">
                        {getNotificationIcon(notification.notification_type)}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4
                          className={cn(
                            "font-medium text-xs",
                            !notification.is_read && "font-semibold"
                          )}
                        >
                          {notification.title}
                          {!notification.is_read && (
                            <span className="inline-block h-2 w-2 rounded-full bg-blue-500 ml-2"></span>
                          )}
                        </h4>
                      </div>
                      <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2 mt-1 mb-2">
                        {notification.message}
                      </p>

                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1 text-gray-400" />
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: ko,
                          })}
                        </span>

                        <div className="flex gap-1.5">
                          {/* 안읽은 알림일 경우 읽음 처리 버튼 + 바로가기 버튼 표시 */}
                          {!notification.is_read && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs px-2.5 border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // 로컬 상태 업데이트를 포함한 markAsRead 함수 호출
                                  const updatedNotifications = filteredNotifications.map((n) =>
                                    n.id === notification.id ? { ...n, is_read: true } : n
                                  );

                                  // 상태 업데이트를 위해 supabase 호출
                                  supabase
                                    .from("test_case_notifications")
                                    .update({ is_read: true })
                                    .eq("id", notification.id)
                                    .then(() => {
                                      // 상태 업데이트
                                      setFilteredNotifications(updatedNotifications);
                                    });
                                }}
                              >
                                <Check className="h-3.5 w-3.5 mr-1" />
                                읽음 처리
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                className="h-7 text-xs px-2.5"
                                onClick={(e) => {
                                  e.stopPropagation();

                                  // 읽음 처리 후 해당 사건으로 이동
                                  supabase
                                    .from("test_case_notifications")
                                    .update({ is_read: true })
                                    .eq("id", notification.id)
                                    .then(() => {
                                      router.push(`/cases/${notification.case_id}`);
                                    });
                                }}
                              >
                                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                바로가기
                              </Button>
                            </>
                          )}

                          {/* 읽은 알림일 경우 바로가기 버튼만 표시 */}
                          {notification.is_read && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs px-2.5"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/cases/${notification.case_id}`);
                              }}
                            >
                              <ExternalLink className="h-3.5 w-3.5 mr-1" />
                              사건 바로가기
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {displayNotifications.length > 5 && (
                <div className="text-center py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-8 px-4 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                    onClick={() => document.querySelector('[aria-label="알림"]')?.click()}
                  >
                    <Bell className="h-3.5 w-3.5 mr-1.5" />
                    모든 알림 보기 ({filteredNotifications.length})
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// 이 코드 조각을 기존 컴포넌트 위에 추가합니다
// ClientSummary 컴포넌트 추가
function ClientSummary({
  userData,
  cases,
  totalDebt,
  loading,
  selectedTab,
  selectedOrg,
  organizations,
}) {
  // 금액 포맷
  const formatCurrency = (amount) => {
    if (!amount) return "0원";
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // 선택된 조직 정보 가져오기
  const selectedOrgData =
    selectedTab === "organization" && selectedOrg
      ? organizations.find((org) => org.orgId === selectedOrg)
      : null;

  // 사용자의 조직 내 역할 가져오기
  const getUserRoleInOrg = () => {
    if (!selectedOrgData) return null;

    const orgMember = selectedOrgData.members?.find((member) => member.user_id === userData.id);
    if (!orgMember) return "멤버";

    // role은 원문 그대로, position은 한글로 변환
    const roleMap = {
      admin: "관리자",
      staff: "직원",
      member: "멤버",
    };

    return {
      role: roleMap[orgMember.role] || orgMember.role,
      position: orgMember.position || "일반",
      isPrimary: orgMember.is_primary,
    };
  };

  const userRoleInOrg = getUserRoleInOrg();

  if (loading) {
    return (
      <Card className="border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-md h-full">
        <CardHeader className="py-2 px-4 border-b">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            <div className="flex gap-3 items-center">
              <Skeleton className="h-14 w-14 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-3.5 w-24" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 조직 프로필 표시
  if (selectedTab === "organization" && selectedOrgData) {
    return (
      <Card className="border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-md h-full">
        <CardHeader className="py-2 px-4 border-b">
          <CardTitle className="text-base flex items-center">
            <Building2 className="h-4 w-4 mr-2 text-indigo-500" />
            조직 프로필
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex gap-3 items-center mb-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="bg-indigo-100">
                <Building2 className="h-6 w-6 text-indigo-700" />
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center">
                <h3 className="text-base font-semibold mr-2">
                  {selectedOrgData.orgName || "조직명"}
                </h3>
                {userRoleInOrg && (
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      userRoleInOrg.isPrimary ? "bg-amber-100 text-amber-700 border-amber-200" : ""
                    }`}
                  >
                    {userRoleInOrg.position} ({userRoleInOrg.role})
                    {userRoleInOrg.isPrimary && " · 주담당자"}
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center">
                {selectedOrgData.organization?.email && (
                  <div className="flex items-center mr-3">
                    <Mail className="h-3 w-3 mr-1" />
                    <span className="truncate max-w-[160px]">
                      {selectedOrgData.organization.email}
                    </span>
                  </div>
                )}
                {selectedOrgData.organization?.phone && (
                  <div className="flex items-center">
                    <Phone className="h-3 w-3 mr-1" />
                    <span>{selectedOrgData.organization.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center justify-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400 mb-1" />
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {cases?.length || 0}
              </div>
              <div className="text-xs text-muted-foreground">전체 사건</div>
            </div>

            <div className="flex flex-col items-center justify-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Clock className="h-5 w-5 text-green-600 dark:text-green-400 mb-1" />
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {
                  (cases?.filter((c) => c.status === "active" || c.status === "in_progress") || [])
                    .length
                }
              </div>
              <div className="text-xs text-muted-foreground">진행중</div>
            </div>

            <div className="flex flex-col items-center justify-center p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <CircleDollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400 mb-1" />
              <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
                {formatCurrency(totalDebt).replace("₩", "")}
              </div>
              <div className="text-xs text-muted-foreground">총 채권액</div>
            </div>
          </div>

          {selectedOrgData.organization?.business_number && (
            <div className="mt-3 bg-gray-50 dark:bg-gray-800/50 p-2 rounded text-xs">
              <div className="flex items-center text-muted-foreground">
                <FileCheck className="h-3 w-3 mr-1" />
                <span>사업자등록번호: {selectedOrgData.organization.business_number}</span>
              </div>
              {selectedOrgData.organization?.representative_name && (
                <div className="flex items-center mt-1 text-muted-foreground">
                  <User className="h-3 w-3 mr-1" />
                  <span>대표자: {selectedOrgData.organization.representative_name}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // 개인 프로필 표시 (기존 코드)
  return (
    <Card className="border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-md h-full">
      <CardHeader className="py-2 px-4 border-b">
        <CardTitle className="text-base flex items-center">
          <User className="h-4 w-4 mr-2 text-blue-500" />내 프로필
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex gap-3 items-center mb-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={userData?.profile_image} alt={userData?.name} />
            <AvatarFallback className="bg-blue-100">
              <User className="h-6 w-6 text-blue-700" />
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center">
              <h3 className="text-base font-semibold mr-2">{userData?.name || "사용자"}</h3>
              <Badge variant="outline" className="text-xs">
                {userData?.role === "staff" ? "변호사" : "회원"}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center">
              {userData?.email && (
                <div className="flex items-center mr-3">
                  <Mail className="h-3 w-3 mr-1" />
                  <span className="truncate max-w-[160px]">{userData.email}</span>
                </div>
              )}
              {userData?.phone && (
                <div className="flex items-center">
                  <Phone className="h-3 w-3 mr-1" />
                  <span>{userData.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center justify-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400 mb-1" />
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {cases?.length || 0}
            </div>
            <div className="text-xs text-muted-foreground">전체 사건</div>
          </div>

          <div className="flex flex-col items-center justify-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <Clock className="h-5 w-5 text-green-600 dark:text-green-400 mb-1" />
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {
                (cases?.filter((c) => c.status === "active" || c.status === "in_progress") || [])
                  .length
              }
            </div>
            <div className="text-xs text-muted-foreground">진행중</div>
          </div>

          <div className="flex flex-col items-center justify-center p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <CircleDollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400 mb-1" />
            <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
              {formatCurrency(totalDebt).replace("₩", "")}
            </div>
            <div className="text-xs text-muted-foreground">총 채권액</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 페이지 컴포넌트를 분리합니다.
export default function MyCasesPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <MyCasesContent />
    </Suspense>
  );
}

// 로딩 상태를 위한 컴포넌트
function PageLoading() {
  return (
    <div className="mx-auto py-8 max-w-5xl px-4 md:px-6 w-full">
      <div className="flex items-center mb-6">
        <h1 className="text-2xl font-bold">내 사건 목록</h1>
      </div>
      <div className="shadow rounded-lg border">
        <div className="p-4">
          <div className="flex justify-between mb-4">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-64" />
          </div>
          <Skeleton className="h-96 w-full mt-4" />
        </div>
      </div>
    </div>
  );
}

// 메인 컨텐츠 컴포넌트 - useSearchParams를 사용
function MyCasesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();

  // URL에서 현재 페이지, 검색어, 탭 정보 가져오기
  const pageFromUrl = Number(searchParams.get("page")) || 1;
  const searchTermFromUrl = searchParams.get("search") || "";
  const selectedTabFromUrl = searchParams.get("tab") || "personal";
  const selectedOrgFromUrl = searchParams.get("org") || null;

  // 알림 유형에 따른 아이콘 반환 - 컴포넌트 내부 함수
  const getNotificationIcon = (type) => {
    switch (type) {
      case "lawsuit":
        return <FileTextIcon className="h-4 w-4 text-blue-500" />;
      case "lawsuit_update":
        return <Gavel className="h-4 w-4 text-purple-500" />;
      case "recovery_activity":
        return <CreditCard className="h-4 w-4 text-green-500" />;
      case "deadline":
        return <CalendarIcon className="h-4 w-4 text-red-500" />;
      case "document":
        return <FileTextIcon className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState([]);
  const [personalCases, setPersonalCases] = useState([]);
  const [organizationCases, setOrganizationCases] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [selectedTab, setSelectedTab] = useState(selectedTabFromUrl);
  const [selectedOrg, setSelectedOrg] = useState(selectedOrgFromUrl);
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);

  // 검색 및 페이지네이션을 위한 상태 추가
  const [searchTerm, setSearchTerm] = useState(searchTermFromUrl);
  const [currentPage, setCurrentPage] = useState(pageFromUrl);
  const [filteredCases, setFilteredCases] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [casesPerPage, setCasesPerPage] = useState(10);
  const [refetchTrigger, setRefetchTrigger] = useState(0); // 데이터 리프래시를 위한 트리거

  // 회수 정보를 위한 상태 추가
  const [recoveryStats, setRecoveryStats] = useState({
    totalPrincipalAmount: 0,
    totalDebtAmount: 0, // 원금 + 이자 + 비용 (총 채권액)
    totalRecoveredAmount: 0,
    recoveryRate: 0,
  });

  const [stats, setStats] = useState({
    totalCases: 0,
    activeCases: 0,
    pendingCases: 0,
    closedCases: 0,
    casesByType: [],
    casesByMonth: [],
    debtCategories: [],
  });

  // 월별 회수 통계를 위한 상태 추가
  const [monthlyRecoveryStats, setMonthlyRecoveryStats] = useState([]);
  const [monthlyStatsLoading, setMonthlyStatsLoading] = useState(false);

  // 사건 정보에 당사자 정보 추가
  const enrichCasesWithPartyInfo = async (cases) => {
    // ... 기존 코드 ...
  };

  // URL 파라미터 업데이트 함수
  const updateUrlParams = (page, search, tab, org = null) => {
    // ... 기존 코드 ...
  };

  // URL이 변경될 때 상태 업데이트
  useEffect(() => {
    // ... 기존 코드 ...
  }, [searchParams]);

  // 현재 선택된 탭이나 조직에 따라 표시할 사건 목록 필터링
  useEffect(() => {
    // ... 기존 코드 ...
  }, [
    selectedTab,
    selectedOrg,
    personalCases,
    organizationCases,
    searchTerm,
    currentPage,
    casesPerPage,
    notifications,
    refetchTrigger, // 데이터 새로고침을 위한 트리거도 포함
  ]);

  // 활성화된 탭이나 조직이 변경될 때 알림과 통계 필터링
  useEffect(() => {
    // ... 기존 코드 ...
  }, [selectedTab, selectedOrg, notifications]);

  // 회수 정보 계산
  const calculateRecoveryStats = async (cases) => {
    // ... 기존 코드 ...
  };

  // 선택한 탭이나 조직에 맞게 알림 필터링
  const filterNotificationsBySelection = () => {
    // ... 기존 코드 ...
  };

  // useEffect 사용해서 데이터 가져오기
  useEffect(() => {
    // ... 기존 코드 ...
  }, [user]);

  // 조직 데이터가 로드된 후 URL 파라미터에 따라 상태 설정
  useEffect(() => {
    // ... 기존 코드 ...
  }, [organizations, selectedTab, searchParams]);

  // 선택된 탭이나 조직이 변경될 때 월별 회수 통계 새로 가져오기
  useEffect(() => {
    // ... 기존 코드 ...
  }, [selectedTab, selectedOrg, personalCases, organizationCases, refetchTrigger]);

  // 월별 회수 통계 가져오기
  const fetchMonthlyRecoveryStats = async () => {
    // ... 기존 코드 ...
  };

  const fetchNotifications = async () => {
    // ... 기존 코드 ...
  };

  const fetchCases = async () => {
    // ... 기존 코드 ...
  };

  const calculateStats = (cases) => {
    // ... 기존 코드 ...
  };

  // 조직 변경 핸들러
  const handleOrgChange = (orgId) => {
    // ... 기존 코드 ...
  };

  // 탭 변경 핸들러
  const handleTabChange = (tab) => {
    // ... 기존 코드 ...
  };

  // 검색 변경 핸들러
  const handleSearchChange = (value) => {
    // ... 기존 코드 ...
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page) => {
    // ... 기존 코드 ...
  };

  // 데이터 새로고침 핸들러
  const handleRefreshData = () => {
    // ... 기존 코드 ...
  };

  // 페이지 크기 변경 핸들러
  const handlePageSizeChange = (size) => {
    // ... 기존 코드 ...
  };

  // 사건 유형에 따른 배지 색상 및 아이콘
  const getCaseTypeBadge = (type) => {
    // ... 기존 코드 ...
  };

  // 상태에 따른 배지 색상
  const getCaseStatusBadge = (status, color) => {
    // ... 기존 코드 ...
  };

  // 금액 포맷팅
  const formatCurrency = (amount) => {
    // ... 기존 코드 ...
  };

  // 차트 색상 설정
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A569BD", "#5DADE2"];
  const STATUS_COLORS = {
    active: "#3498DB",
    pending: "#F39C12",
    closed: "#95A5A6",
  };

  // 로딩 중 UI
  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="space-y-4">
          <Skeleton className="h-12 w-1/3" />
          <Skeleton className="h-6 w-1/2" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>

          <Skeleton className="h-64 w-full mb-8" />

          <Skeleton className="h-10 w-full" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* 상단 헤더 */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">내 사건 관리</h1>
          <Tabs value={selectedTab} onValueChange={handleTabChange} defaultValue={selectedTab}>
            <TabsList className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm border-0 rounded-xl p-1">
              <TabsTrigger
                value="personal"
                className="rounded-lg py-2 px-4 data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                <User className="h-4 w-4 mr-2" />
                개인 사건 {personalCases.length > 0 && `(${personalCases.length})`}
              </TabsTrigger>
              {organizations.length > 0 && (
                <TabsTrigger
                  value="organization"
                  className="rounded-lg py-2 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  법인/단체 사건 {organizationCases.length > 0 && `(${organizationCases.length})`}
                </TabsTrigger>
              )}
            </TabsList>

            {/* 여기에 빈 TabsContent를 넣어 구조를 완성합니다 */}
            <TabsContent value="personal" className="mt-0"></TabsContent>
            {organizations.length > 0 && (
              <TabsContent value="organization" className="mt-0"></TabsContent>
            )}
          </Tabs>
        </div>

        {/* ... 기존 코드 ... */}
      </div>

      {/* 통계 대시보드 (탭 형식) */}
      <div className="mb-8">{/* ... 기존 코드 ... */}</div>

      {/* 사건 목록 섹션 */}
      <div className="mb-8">
        <CasesTable
          cases={filteredCases}
          personalCases={personalCases}
          organizationCases={organizationCases}
          selectedTab={selectedTab}
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={
            selectedTab === "personal"
              ? searchTerm.trim()
                ? filteredCases.length
                : personalCases.length
              : searchTerm.trim()
              ? filteredCases.length
              : selectedOrg
              ? organizationCases.filter((c) => c.organization_id === selectedOrg).length
              : organizationCases.length
          }
          casesPerPage={casesPerPage}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          formatCurrency={formatCurrency}
          notifications={filteredNotifications}
          onRefreshData={handleRefreshData}
        />
      </div>
    </div>
  );
}
