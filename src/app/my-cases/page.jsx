"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { useUser } from "@/contexts/UserContext";
import { format, formatDistanceToNow } from "date-fns";
import ko from "date-fns/locale/ko";
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

export default function MyCasesPage() {
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
    if (!cases || cases.length === 0) return [];

    const caseIds = cases.map((c) => c.id);

    try {
      // 각 사건의 당사자 정보 가져오기
      const { data: partiesData, error: partiesError } = await supabase
        .from("test_case_parties")
        .select("*")
        .in("case_id", caseIds);

      if (partiesError) throw partiesError;

      // 회수 활동 정보 가져오기
      const { data: recoveryData, error: recoveryError } = await supabase
        .from("test_recovery_activities")
        .select("case_id, amount, activity_type")
        .in("case_id", caseIds);

      if (recoveryError) throw recoveryError;

      // 이자 정보 가져오기
      const { data: interestData, error: interestError } = await supabase
        .from("test_case_interests")
        .select("case_id, rate, start_date, end_date")
        .in("case_id", caseIds);

      if (interestError) {
        console.error("이자 정보 가져오기 실패:", interestError);
      }

      // 비용 정보 가져오기
      const { data: expenseData, error: expenseError } = await supabase
        .from("test_case_expenses")
        .select("case_id, amount")
        .in("case_id", caseIds);

      if (expenseError) {
        console.error("비용 정보 가져오기 실패:", expenseError);
      }

      // 회수 금액 계산
      const recoveryByCase = {};
      recoveryData?.forEach((recovery) => {
        if (recovery.activity_type === "payment" && recovery.amount) {
          if (!recoveryByCase[recovery.case_id]) {
            recoveryByCase[recovery.case_id] = 0;
          }
          recoveryByCase[recovery.case_id] += parseFloat(recovery.amount || 0);
        }
      });

      // 이자 금액 계산 - 간소화를 위해 이자는 0으로 처리 (추후 정확한 이자 계산 로직 필요)
      const interestByCase = {};
      caseIds.forEach((caseId) => {
        interestByCase[caseId] = 0; // 일단 모든 사건의 이자를 0으로 초기화
      });

      // 이자 정보가 있는 경우만 처리
      if (interestData && interestData.length > 0) {
        interestData.forEach((interest) => {
          // 이자율을 이용한 기본 계산 방식 적용 (수임원금 * 이자율 / 100)
          if (interest.case_id && interest.rate) {
            const caseInfo = cases.find((c) => c.id === interest.case_id);
            if (caseInfo && caseInfo.principal_amount) {
              const principalAmount = caseInfo.principal_amount || 0;
              interestByCase[interest.case_id] = (principalAmount * interest.rate) / 100;
            }
          }
        });
      }

      // 비용 금액 계산
      const expenseByCase = {};
      caseIds.forEach((caseId) => {
        expenseByCase[caseId] = 0; // 일단 모든 사건의 비용을 0으로 초기화
      });

      // 비용 정보가 있는 경우만 처리
      if (expenseData && expenseData.length > 0) {
        expenseData.forEach((expense) => {
          if (expense.case_id && expense.amount) {
            if (!expenseByCase[expense.case_id]) {
              expenseByCase[expense.case_id] = 0;
            }
            expenseByCase[expense.case_id] += parseFloat(expense.amount || 0);
          }
        });
      }

      // 당사자 정보로 사건 정보 보강
      return cases.map((caseItem) => {
        const caseParties = partiesData
          ? partiesData.filter((p) => p.case_id === caseItem.id) || []
          : [];

        const creditor = caseParties.find((p) =>
          ["creditor", "plaintiff", "applicant"].includes(p.party_type)
        );

        const debtor = caseParties.find((p) =>
          ["debtor", "defendant", "respondent"].includes(p.party_type)
        );

        // 원금 (수임금액)
        const principalAmount = caseItem.principal_amount || 0;

        // 이자 금액
        const interestAmount = interestByCase[caseItem.id] || 0;

        // 비용 금액
        const expenseAmount = expenseByCase[caseItem.id] || 0;

        // 총 채권액 (원금 + 이자 + 비용) = 원리금
        const debtAmount = principalAmount + interestAmount + expenseAmount;

        // 회수 금액
        const recoveredAmount = recoveryByCase[caseItem.id] || 0;

        // 회수율 (회수금액 / 원금)
        const recoveryRate =
          principalAmount > 0 ? Math.round((recoveredAmount / principalAmount) * 1000) / 10 : 0;

        return {
          ...caseItem,
          creditor_name: creditor
            ? creditor.entity_type === "individual"
              ? creditor.name
              : creditor.company_name
            : null,
          debtor_name: debtor
            ? debtor.entity_type === "individual"
              ? debtor.name
              : debtor.company_name
            : null,
          interest_amount: interestAmount,
          expense_amount: expenseAmount,
          debt_amount: debtAmount,
          recovered_amount: recoveredAmount,
          recovery_rate: recoveryRate,
        };
      });
    } catch (err) {
      console.error("사건 정보 보강 실패:", err);
      return cases;
    }
  };

  // URL 파라미터 업데이트 함수
  const updateUrlParams = (page, search, tab, org = null) => {
    const params = new URLSearchParams();
    if (page !== 1) params.set("page", page.toString());
    if (search) params.set("search", search);
    if (tab !== "personal") params.set("tab", tab);
    if (org) params.set("org", org);

    const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : "");
    window.history.pushState({}, "", newUrl);
  };

  // URL이 변경될 때 상태 업데이트
  useEffect(() => {
    const page = Number(searchParams.get("page")) || 1;
    const search = searchParams.get("search") || "";
    const tab = searchParams.get("tab") || "personal";
    const org = searchParams.get("org") || null;

    if (page !== currentPage) setCurrentPage(page);
    if (search !== searchTerm) setSearchTerm(search);
    if (tab !== selectedTab) setSelectedTab(tab);
    if (org !== selectedOrg) setSelectedOrg(org);
  }, [searchParams]);

  // 현재 선택된 탭이나 조직에 따라 표시할 사건 목록 필터링
  useEffect(() => {
    const currentCases = selectedTab === "personal" ? personalCases : organizationCases;

    // 검색어 필터링
    let filtered = currentCases;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = currentCases.filter(
        (c) =>
          (c.creditor_name && c.creditor_name.toLowerCase().includes(term)) ||
          (c.debtor_name && c.debtor_name.toLowerCase().includes(term))
      );
    }

    // 페이지네이션 계산
    setTotalPages(Math.max(1, Math.ceil(filtered.length / casesPerPage)));

    // 현재 페이지가 유효한지 확인 (검색 결과가 적어서 페이지가 줄어들 수 있음)
    const validCurrentPage = Math.min(
      currentPage,
      Math.max(1, Math.ceil(filtered.length / casesPerPage))
    );
    if (validCurrentPage !== currentPage) {
      setCurrentPage(validCurrentPage);
      updateUrlParams(validCurrentPage, searchTerm, selectedTab, selectedOrg);
    }

    // 현재 페이지에 해당하는 사건만 필터링
    const startIndex = (validCurrentPage - 1) * casesPerPage;
    const paginatedCases = filtered.slice(startIndex, startIndex + casesPerPage);

    console.log("필터링된 사건 목록:", {
      탭: selectedTab,
      조직: selectedOrg,
      케이스수: currentCases.length,
      필터링후: filtered.length,
      페이징후: paginatedCases.length,
    });

    setFilteredCases(paginatedCases); // 페이지네이션된 사건 목록을 저장

    // 선택된 사건들에 대한 통계 재계산
    const currentStats = calculateStats(currentCases);
    setStats(currentStats);

    // 회수 정보 계산
    calculateRecoveryStats(currentCases);

    // 알림 필터링
    if (notifications.length > 0) {
      filterNotificationsBySelection();
    }
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
    if (notifications.length === 0) return;

    filterNotificationsBySelection();

    // 선택된 사건들에 대한 통계 재계산 - 현재 다른 useEffect에서 처리됨
    // 중복 코드 제거로 주석 처리
    // const currentCases = selectedTab === "personal" ? personalCases : organizationCases;
    // const currentStats = calculateStats(currentCases);
    // setStats(currentStats);

    // 회수 정보 계산 - 현재 다른 useEffect에서 처리됨
    // calculateRecoveryStats(currentCases);
  }, [selectedTab, selectedOrg, notifications]);

  // 회수 정보 계산
  const calculateRecoveryStats = async (cases) => {
    if (!cases || !cases.length) {
      setRecoveryStats({
        totalPrincipalAmount: 0,
        totalDebtAmount: 0,
        totalRecoveredAmount: 0,
        recoveryRate: 0,
      });
      return;
    }

    try {
      // 총 원금 계산
      const totalPrincipal = cases.reduce((sum, c) => sum + (c.principal_amount || 0), 0);

      // 총 채권액 계산 (원금 + 이자 + 비용)
      const totalDebt = cases.reduce((sum, c) => sum + (c.debt_amount || 0), 0);

      // 회수된 금액 계산 (이미 각 사건에 계산되어 있음)
      const recoveredAmount = cases.reduce((sum, c) => sum + (c.recovered_amount || 0), 0);

      // 회수율 계산 (회수금액 / 원금)
      const rate = totalPrincipal > 0 ? (recoveredAmount / totalPrincipal) * 100 : 0;

      setRecoveryStats({
        totalPrincipalAmount: totalPrincipal,
        totalDebtAmount: totalDebt,
        totalRecoveredAmount: recoveredAmount,
        recoveryRate: Math.round(rate * 10) / 10, // 소수점 첫째 자리까지
      });
    } catch (error) {
      console.error("회수 정보 계산 실패:", error);
    }
  };

  // 선택한 탭이나 조직에 맞게 알림 필터링
  const filterNotificationsBySelection = () => {
    if (selectedTab === "personal") {
      // 개인 사건에 관련된 알림만 필터링
      const personalCaseIds = personalCases.map((c) => c.id);
      const filtered = notifications.filter((n) => personalCaseIds.includes(n.case_id));
      setFilteredNotifications(filtered);
    } else if (selectedTab === "organization" && selectedOrg) {
      // 선택한 조직의 사건에 관련된 알림만 필터링
      const orgCaseIds = organizationCases.map((c) => c.id);
      const filtered = notifications.filter((n) => orgCaseIds.includes(n.case_id));
      setFilteredNotifications(filtered);
    } else {
      setFilteredNotifications(notifications);
    }
  };

  // useEffect 사용해서 데이터 가져오기
  useEffect(() => {
    if (user) {
      // 초기 데이터 로딩
      fetchCases();
      fetchNotifications();
      fetchMonthlyRecoveryStats();
    }
  }, [user]);

  // 조직 데이터가 로드된 후 URL 파라미터에 따라 상태 설정
  useEffect(() => {
    if (organizations.length > 0 && selectedTab === "organization") {
      // URL에서 org 파라미터 확인
      const orgIdFromUrl = searchParams.get("org");

      if (orgIdFromUrl) {
        // URL에 지정된 조직 ID가 있으면 해당 조직 데이터 설정
        const orgData = organizations.find((org) => org.orgId === orgIdFromUrl);
        if (orgData) {
          setOrganizationCases(orgData.cases);
          setSelectedOrg(orgIdFromUrl);
          console.log("URL 파라미터에서 조직 설정:", orgIdFromUrl, orgData.cases.length);
        }
      } else if (selectedOrg) {
        // 이미 선택된 조직이 있으면 해당 조직 데이터 설정
        const orgData = organizations.find((org) => org.orgId === selectedOrg);
        if (orgData) {
          setOrganizationCases(orgData.cases);
          console.log("선택된 조직으로 데이터 설정:", selectedOrg, orgData.cases.length);
        }
      } else if (organizations.length > 0) {
        // 선택된 조직이 없으면 첫 번째 조직 선택
        setOrganizationCases(organizations[0].cases);
        setSelectedOrg(organizations[0].orgId);
        console.log(
          "첫 번째 조직으로 설정:",
          organizations[0].orgId,
          organizations[0].cases.length
        );
      }
    }
  }, [organizations, selectedTab, searchParams]);

  // 선택된 탭이나 조직이 변경될 때 월별 회수 통계 새로 가져오기
  useEffect(() => {
    if (user && (personalCases.length > 0 || organizationCases.length > 0)) {
      fetchMonthlyRecoveryStats();
    }
  }, [selectedTab, selectedOrg, personalCases, organizationCases, refetchTrigger]);

  // 월별 회수 통계 가져오기
  const fetchMonthlyRecoveryStats = async () => {
    setMonthlyStatsLoading(true);
    try {
      // 현재 선택된 사건 목록에서 case IDs 추출
      let currentCases = [];
      if (selectedTab === "personal") {
        currentCases = personalCases;
      } else if (selectedTab === "organization" && selectedOrg) {
        const orgData = organizations.find((org) => org.orgId === selectedOrg);
        if (orgData) {
          currentCases = orgData.cases;
        }
      }

      // 사건이 없으면 빈 배열 반환
      if (!currentCases || currentCases.length === 0) {
        setMonthlyRecoveryStats([]);
        setMonthlyStatsLoading(false);
        return;
      }

      const caseIds = currentCases.map((c) => c.id);

      const today = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(today.getMonth() - 5);
      sixMonthsAgo.setDate(1);
      sixMonthsAgo.setHours(0, 0, 0, 0);

      // 월별 통계를 위한 객체 초기화
      const monthlyStats = {};
      for (let i = 0; i < 6; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        monthlyStats[yearMonth] = {
          name: `${d.getMonth() + 1}월`,
          회수금액: 0,
          회수건수: 0,
          yearMonth, // 정렬용
        };
      }

      // 회수 활동 정보 가져오기
      const { data: recoveryData, error: recoveryError } = await supabase
        .from("test_recovery_activities")
        .select("case_id, amount, activity_type, created_at")
        .in("case_id", caseIds)
        .gte("created_at", sixMonthsAgo.toISOString())
        .eq("activity_type", "payment");

      if (recoveryError) throw recoveryError;

      if (recoveryData && recoveryData.length > 0) {
        // 월별로 데이터 집계
        recoveryData.forEach((recovery) => {
          const date = new Date(recovery.created_at);
          const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

          if (monthlyStats[yearMonth]) {
            monthlyStats[yearMonth].회수금액 += parseFloat(recovery.amount || 0);
            monthlyStats[yearMonth].회수건수 += 1;
          }
        });
      }

      // 월별 배열로 변환하고 정렬
      const sortedStats = Object.values(monthlyStats).sort((a, b) =>
        a.yearMonth.localeCompare(b.yearMonth)
      );

      setMonthlyRecoveryStats(sortedStats);
    } catch (error) {
      console.error("월별 회수 통계 가져오기 실패:", error);
      setMonthlyRecoveryStats([]);
    } finally {
      setMonthlyStatsLoading(false);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;

    setNotificationsLoading(true);
    try {
      const { data, error } = await supabase
        .from("test_case_notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
      setFilteredNotifications(data || []);
    } catch (error) {
      console.error("알림 가져오기 실패:", error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const fetchCases = async () => {
    setLoading(true);
    try {
      // 외부 직원인지 확인
      const isExternalStaff = user.employee_type === "external" && user.role === "staff";

      // 1. 사용자가 개인 의뢰인으로 등록된 사건 가져오기
      const { data: clientCases, error: clientError } = await supabase
        .from("test_case_clients")
        .select(
          `
          *,
          case:case_id(
            *
          )
        `
        )
        .eq("client_type", "individual")
        .eq("individual_id", user.id);

      if (clientError) throw clientError;

      // 2. 사용자가 속한 조직 가져오기
      const { data: userOrgs, error: orgError } = await supabase
        .from("test_organization_members")
        .select(
          `
          *,
          organization:organization_id(*)
        `
        )
        .eq("user_id", user.id);

      if (orgError) throw orgError;

      // 3. 각 조직이 의뢰인으로 등록된 사건 가져오기
      const orgIds = userOrgs.map((org) => org.organization_id);
      let orgCases = [];

      if (orgIds.length > 0) {
        const { data: orgClientCases, error: orgClientError } = await supabase
          .from("test_case_clients")
          .select(
            `
            *,
            case:case_id(
              *
            ),
            organization:organization_id(*)
          `
          )
          .eq("client_type", "organization")
          .in("organization_id", orgIds);

        if (orgClientError) throw orgClientError;
        orgCases = orgClientCases || [];
      }

      // 4. 외부 직원인 경우 담당자로 지정된 사건만 가져오기
      let handledCases = [];

      if (isExternalStaff) {
        // 담당자 테이블에서 사용자가 담당하는 사건 ID 목록 가져오기
        const { data: userHandlers, error: handlersError } = await supabase
          .from("test_case_handlers")
          .select("case_id")
          .eq("user_id", user.id);

        if (handlersError) throw handlersError;

        const handledCaseIds = userHandlers.map((h) => h.case_id);

        if (handledCaseIds.length > 0) {
          const { data: handledCasesData, error: handledCasesError } = await supabase
            .from("test_cases")
            .select("*")
            .in("id", handledCaseIds);

          if (handledCasesError) throw handledCasesError;
          handledCases = handledCasesData || [];
        }
      }

      // 개인 의뢰와 조직 의뢰 정리
      let personalCasesList = await enrichCasesWithPartyInfo(
        clientCases
          .filter((client) => client.case && !client.case.deleted_at)
          .map((client) => client.case)
      );

      const orgList = userOrgs.map((org) => org.organization);
      const orgCasesByOrg = await Promise.all(
        orgIds.map(async (orgId) => {
          const orgName = orgList.find((org) => org.id === orgId)?.name || "알 수 없는 조직";
          const cases = await enrichCasesWithPartyInfo(
            orgCases
              .filter((c) => c.organization_id === orgId && c.case && !c.case.deleted_at)
              .map((c) => c.case)
          );

          // 조직 멤버 정보 가져오기
          const { data: orgMembers, error: orgMembersError } = await supabase
            .from("test_organization_members")
            .select("*")
            .eq("organization_id", orgId);

          if (orgMembersError) {
            console.error("조직 멤버 정보 가져오기 실패:", orgMembersError);
          }

          return {
            orgId,
            orgName,
            cases,
            organization: orgList.find((org) => org.id === orgId),
            members: orgMembers || [],
          };
        })
      );

      const filteredOrgCasesByOrg = orgCasesByOrg.filter((org) => org.cases.length > 0);

      // 외부 직원 처리 - 담당하는 사건만 표시
      if (isExternalStaff) {
        // 담당 사건 ID 목록
        const handledCaseIds = handledCases.map((c) => c.id);

        // 각 목록에서 담당 사건만 필터링
        personalCasesList = await enrichCasesWithPartyInfo(handledCases);

        // 조직 사건에는 접근 권한 없음 (필요하다면 여기서 필터링 로직 추가)
        for (let i = 0; i < filteredOrgCasesByOrg.length; i++) {
          filteredOrgCasesByOrg[i].cases = []; // 외부 직원은 조직 사건 비우기
        }

        // 사용자에게 안내 메시지 표시
        toast.info("외부 직원은 담당으로 지정된 사건만 볼 수 있습니다", {
          duration: 5000,
          position: "top-center",
        });
      }

      // 모든 의뢰를 합쳐서 통계 계산
      const allCases = [...personalCasesList];
      filteredOrgCasesByOrg.forEach((org) => {
        allCases.push(...org.cases);
      });

      // 중복 제거
      const uniqueCases = Array.from(new Set(allCases.map((c) => c.id))).map((id) =>
        allCases.find((c) => c.id === id)
      );

      // 통계 계산
      const stats = calculateStats(uniqueCases);

      // 채권 분류별 통계 계산
      const debtCategories = {
        normal: 0, // 정상 채권
        bad: 0, // 악성 채권
        interest: 0, // 관심 채권
        special: 0, // 특수 채권
      };

      // 실제 DB에서 채권 분류 데이터 사용
      uniqueCases.forEach((c) => {
        // debt_category 필드는 text 타입이므로 직접 사용
        // DB에 값이 없으면 기본값 'normal' 사용
        const category = c.debt_category || "normal";

        // 유효한 카테고리인지 확인
        if (debtCategories.hasOwnProperty(category)) {
          debtCategories[category]++;
        } else {
          // 알 수 없는 카테고리는 'normal'로 처리
          debtCategories.normal++;
        }
      });

      // 채권 분류 카테고리 표시 이름 수정
      const debtCategoriesData = [
        { name: "정상 채권", value: debtCategories.normal, color: "#10b981" },
        { name: "악성 채권", value: debtCategories.bad, color: "#ef4444" },
        { name: "관심 채권", value: debtCategories.interest, color: "#f59e0b" },
        { name: "특수 채권", value: debtCategories.special, color: "#6366f1" },
      ].filter((category) => category.value > 0); // 값이 0인 카테고리는 제외

      // 데이터가 하나도 없을 경우 기본 데이터 제공
      if (debtCategoriesData.length === 0) {
        debtCategoriesData.push({ name: "정상 채권", value: uniqueCases.length, color: "#10b981" });
      }

      setStats({
        ...stats,
        debtCategories: debtCategoriesData,
      });

      setPersonalCases(personalCasesList);
      setOrganizations(filteredOrgCasesByOrg);

      // 초기 사건 목록 설정
      let initialCases = [];
      if (selectedTabFromUrl === "personal" || filteredOrgCasesByOrg.length === 0) {
        // 개인 탭인 경우 또는 조직이 없는 경우 개인 사건 사용
        initialCases = personalCasesList;

        // 처음부터 필터링된 사건 목록도 설정
        let filteredBySearch = personalCasesList;
        if (searchTermFromUrl.trim()) {
          const term = searchTermFromUrl.toLowerCase();
          filteredBySearch = personalCasesList.filter(
            (c) =>
              (c.creditor_name && c.creditor_name.toLowerCase().includes(term)) ||
              (c.debtor_name && c.debtor_name.toLowerCase().includes(term))
          );
        }

        // 페이지네이션 적용
        const startIndex = (pageFromUrl - 1) * casesPerPage;
        const paginatedCases = filteredBySearch.slice(startIndex, startIndex + casesPerPage);
        setFilteredCases(paginatedCases);

        // 총 페이지 수 업데이트
        setTotalPages(Math.max(1, Math.ceil(filteredBySearch.length / casesPerPage)));
      } else {
        // 조직 탭인 경우
        let orgId = selectedOrgFromUrl;
        let orgCases = [];

        // URL에서 조직 ID가 지정되어 있는 경우
        if (orgId && filteredOrgCasesByOrg.find((org) => org.orgId === orgId)) {
          const orgData = filteredOrgCasesByOrg.find((org) => org.orgId === orgId);
          orgCases = orgData.cases;
          setSelectedOrg(orgId);
        } else if (filteredOrgCasesByOrg.length > 0) {
          // 지정된 조직이 없거나 찾을 수 없는 경우 첫 번째 조직 사용
          orgId = filteredOrgCasesByOrg[0].orgId;
          orgCases = filteredOrgCasesByOrg[0].cases;
          setSelectedOrg(orgId);
        }

        setOrganizationCases(orgCases);
        initialCases = orgCases;

        // 처음부터 필터링된 사건 목록도 설정
        let filteredBySearch = orgCases;
        if (searchTermFromUrl.trim()) {
          const term = searchTermFromUrl.toLowerCase();
          filteredBySearch = orgCases.filter(
            (c) =>
              (c.creditor_name && c.creditor_name.toLowerCase().includes(term)) ||
              (c.debtor_name && c.debtor_name.toLowerCase().includes(term))
          );
        }

        // 페이지네이션 적용
        const startIndex = (pageFromUrl - 1) * casesPerPage;
        const paginatedCases = filteredBySearch.slice(startIndex, startIndex + casesPerPage);
        setFilteredCases(paginatedCases);

        // 총 페이지 수 업데이트
        setTotalPages(Math.max(1, Math.ceil(filteredBySearch.length / casesPerPage)));

        console.log("초기 조직 데이터 설정:", {
          탭: selectedTabFromUrl,
          조직ID: orgId,
          케이스수: orgCases.length,
          필터링후: filteredBySearch.length,
          페이징후: paginatedCases.length,
        });
      }

      // 초기 통계 계산
      const initialStats = calculateStats(initialCases);
      setStats(initialStats);

      // 초기 회수 정보 계산
      calculateRecoveryStats(initialCases);
    } catch (error) {
      console.error("의뢰 정보 로딩 중 오류 발생:", error);
      toast.error("의뢰 정보를 불러오는데 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (cases) => {
    // 총 의뢰 수
    const totalCases = cases.length;

    // 상태별 의뢰 수
    const activeCases = cases.filter((c) => c.status === "active").length;
    const pendingCases = cases.filter((c) => c.status === "pending").length;
    const closedCases = cases.filter((c) => c.status === "closed").length;

    // 유형별 의뢰 수
    const typeCount = {};
    cases.forEach((c) => {
      const type = c.case_type || "other";
      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    const casesByType = Object.entries(typeCount).map(([name, value]) => ({
      name:
        name === "civil"
          ? "민사"
          : name === "debt"
          ? "채권"
          : name === "payment_order"
          ? "지급명령"
          : name,
      value,
    }));

    // 월별 의뢰 통계 (최근 6개월)
    const monthStats = {};
    const today = new Date();

    // 최근 6개월의 달을 초기화
    for (let i = 0; i < 6; i++) {
      const d = new Date(today);
      d.setMonth(d.getMonth() - i);
      const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthStats[yearMonth] = 0;
    }

    // 의뢰 수 집계
    cases.forEach((c) => {
      if (c.created_at) {
        const date = new Date(c.created_at);
        const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        if (monthStats[yearMonth] !== undefined) {
          monthStats[yearMonth]++;
        }
      }
    });

    const casesByMonth = Object.entries(monthStats)
      .map(([yearMonth, count]) => {
        const [year, month] = yearMonth.split("-");
        return {
          name: `${month}월`,
          count,
          yearMonth, // 정렬용
        };
      })
      .sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));

    // 채권 분류별 통계 계산
    const debtCategories = {
      normal: 0, // 정상 채권
      bad: 0, // 악성 채권
      interest: 0, // 관심 채권
      special: 0, // 특수 채권
    };

    // 실제 DB에서 채권 분류 데이터 사용
    cases.forEach((c) => {
      // debt_category 필드는 text 타입이므로 직접 사용
      // DB에 값이 없으면 기본값 'normal' 사용
      const category = c.debt_category || "normal";

      // 유효한 카테고리인지 확인
      if (debtCategories.hasOwnProperty(category)) {
        debtCategories[category]++;
      } else {
        // 알 수 없는 카테고리는 'normal'로 처리
        debtCategories.normal++;
      }
    });

    // 채권 분류 카테고리 표시 이름 수정
    const debtCategoriesData = [
      { name: "정상 채권", value: debtCategories.normal, color: "#10b981" },
      { name: "악성 채권", value: debtCategories.bad, color: "#ef4444" },
      { name: "관심 채권", value: debtCategories.interest, color: "#f59e0b" },
      { name: "특수 채권", value: debtCategories.special, color: "#6366f1" },
    ].filter((category) => category.value > 0); // 값이 0인 카테고리는 제외

    // 데이터가 하나도 없을 경우 기본 데이터 제공
    if (debtCategoriesData.length === 0) {
      debtCategoriesData.push({ name: "정상 채권", value: cases.length, color: "#10b981" });
    }

    return {
      totalCases,
      activeCases,
      pendingCases,
      closedCases,
      casesByType,
      casesByMonth,
      debtCategories: debtCategoriesData,
    };
  };

  // 조직 변경 핸들러
  const handleOrgChange = (orgId) => {
    setSelectedOrg(orgId);
    setCurrentPage(1); // 조직 변경 시 첫 페이지로 이동

    // 선택된 조직의 데이터 설정
    const org = organizations.find((o) => o.orgId === orgId);
    if (org) {
      console.log("선택된 조직의 사건 데이터:", org.cases);
      setOrganizationCases(org.cases);

      // 필터링된 사건 목록도 즉시 업데이트
      let filteredBySearch = org.cases;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        filteredBySearch = org.cases.filter(
          (c) =>
            (c.creditor_name && c.creditor_name.toLowerCase().includes(term)) ||
            (c.debtor_name && c.debtor_name.toLowerCase().includes(term))
        );
      }

      // 페이지네이션 적용
      const startIndex = 0; // 첫 페이지이므로 0부터 시작
      const paginatedCases = filteredBySearch.slice(startIndex, startIndex + casesPerPage);
      setFilteredCases(paginatedCases);

      // 총 페이지 수 업데이트
      setTotalPages(Math.max(1, Math.ceil(filteredBySearch.length / casesPerPage)));
    }

    updateUrlParams(1, searchTerm, selectedTab, orgId);
  };

  // 탭 변경 핸들러
  const handleTabChange = (tab) => {
    setSelectedTab(tab);
    setCurrentPage(1); // 탭 변경 시 첫 페이지로 이동

    // 탭이 "organization"으로 변경될 때 조직 데이터 확인
    if (tab === "organization" && organizations.length > 0) {
      // 선택된 조직이 없으면 첫 번째 조직 선택
      let orgCases = [];
      let selectedOrgId = selectedOrg;

      if (!selectedOrg) {
        selectedOrgId = organizations[0].orgId;
        setSelectedOrg(selectedOrgId);
        orgCases = organizations[0].cases;
        setOrganizationCases(orgCases);
      } else {
        // 선택된 조직에 해당하는 사건 데이터 설정
        const orgData = organizations.find((org) => org.orgId === selectedOrg);
        if (orgData) {
          orgCases = orgData.cases;
          setOrganizationCases(orgCases);
        }
      }

      // 필터링된 사건 목록 즉시 업데이트
      let filteredBySearch = orgCases;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        filteredBySearch = orgCases.filter(
          (c) =>
            (c.creditor_name && c.creditor_name.toLowerCase().includes(term)) ||
            (c.debtor_name && c.debtor_name.toLowerCase().includes(term))
        );
      }

      // 페이지네이션 적용
      const startIndex = 0; // 첫 페이지이므로 0부터 시작
      const paginatedCases = filteredBySearch.slice(startIndex, startIndex + casesPerPage);
      setFilteredCases(paginatedCases);

      // 총 페이지 수 업데이트
      setTotalPages(Math.max(1, Math.ceil(filteredBySearch.length / casesPerPage)));
    } else if (tab === "personal") {
      // 개인 탭으로 변경된 경우 개인 사건 데이터로 즉시 업데이트
      let filteredBySearch = personalCases;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        filteredBySearch = personalCases.filter(
          (c) =>
            (c.creditor_name && c.creditor_name.toLowerCase().includes(term)) ||
            (c.debtor_name && c.debtor_name.toLowerCase().includes(term))
        );
      }

      // 페이지네이션 적용
      const startIndex = 0; // 첫 페이지이므로 0부터 시작
      const paginatedCases = filteredBySearch.slice(startIndex, startIndex + casesPerPage);
      setFilteredCases(paginatedCases);

      // 총 페이지 수 업데이트
      setTotalPages(Math.max(1, Math.ceil(filteredBySearch.length / casesPerPage)));
    }

    updateUrlParams(1, searchTerm, tab, selectedOrg);
  };

  // 검색 변경 핸들러
  const handleSearchChange = (value) => {
    console.log("당사자(채권자/채무자) 이름으로 검색합니다.");
    setSearchTerm(value);
    setCurrentPage(1); // 검색 시 첫 페이지로 이동
    updateUrlParams(1, value, selectedTab, selectedOrg);
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page) => {
    setCurrentPage(page);
    updateUrlParams(page, searchTerm, selectedTab, selectedOrg);
  };

  // 데이터 새로고침 핸들러
  const handleRefreshData = () => {
    setRefetchTrigger((prev) => prev + 1);
  };

  // 페이지 크기 변경 핸들러
  const handlePageSizeChange = (size) => {
    setCasesPerPage(Number(size));
    setCurrentPage(1); // 페이지 크기 변경 시 첫 페이지로 이동
    updateUrlParams(1, searchTerm, selectedTab, selectedOrg);
  };

  // 사건 유형에 따른 배지 색상 및 아이콘
  const getCaseTypeBadge = (type) => {
    switch (type) {
      case "civil":
        return (
          <Badge className="bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-800/50 border border-blue-200 dark:border-blue-800/50">
            <FileTextIcon className="mr-1 h-3 w-3" /> 민사
          </Badge>
        );
      case "payment_order":
        return (
          <Badge className="bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-800/50 border border-purple-200 dark:border-purple-800/50">
            <GanttChartSquare className="mr-1 h-3 w-3" /> 지급명령
          </Badge>
        );
      case "debt":
        return (
          <Badge className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-800/50 border border-emerald-200 dark:border-emerald-800/50">
            <Briefcase className="mr-1 h-3 w-3" /> 채권
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700">
            {type}
          </Badge>
        );
    }
  };

  // 상태에 따른 배지 색상
  const getCaseStatusBadge = (status, color) => {
    let icon = null;
    let badgeClass = "";

    if (color) {
      return <Badge style={{ backgroundColor: color, color: "#fff" }}>{status}</Badge>;
    }

    switch (status) {
      case "in_progress":
      case "active": // 이전 상태값 호환성 유지
        icon = <Timer className="mr-1 h-3 w-3" />;
        badgeClass =
          "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/50";
        return (
          <Badge className={`border ${badgeClass}`}>
            {icon}
            진행중
          </Badge>
        );
      case "pending":
        icon = <Hourglass className="mr-1 h-3 w-3" />;
        badgeClass =
          "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/50";
        return (
          <Badge className={`border ${badgeClass}`}>
            {icon}
            대기중
          </Badge>
        );
      case "completed":
      case "closed": // 이전 상태값 호환성 유지
        icon = <CheckCircle2 className="mr-1 h-3 w-3" />;
        badgeClass =
          "bg-green-100 text-green-700 border-green-200 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800/50";
        return (
          <Badge className={`border ${badgeClass}`}>
            {icon}
            완료
          </Badge>
        );
      default:
        icon = <AlertCircle className="mr-1 h-3 w-3" />;
        badgeClass =
          "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
        return (
          <Badge className={`border ${badgeClass}`}>
            {icon}
            {status}
          </Badge>
        );
    }
  };

  // 금액 포맷팅
  const formatCurrency = (amount) => {
    if (!amount) return "0원";
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(amount);
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

        {selectedTab === "organization" && organizations.length > 0 && (
          <div className="mt-4 p-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-lg border-0 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">소속 법인/단체 선택</p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 min-w-[220px] justify-between"
                  >
                    <span className="flex items-center">
                      <Building2 className="h-4 w-4 mr-2 text-primary" />
                      {organizations.find((o) => o.orgId === selectedOrg)?.orgName || "조직 선택"}
                    </span>
                    <Badge variant="secondary" className="ml-2">
                      {organizations.find((o) => o.orgId === selectedOrg)?.cases.length || 0} 건
                    </Badge>
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[280px]">
                  {organizations.map((org) => (
                    <DropdownMenuItem
                      key={org.orgId}
                      onClick={() => handleOrgChange(org.orgId)}
                      className="flex items-center gap-2 cursor-pointer py-2"
                    >
                      <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="flex-1 truncate">{org.orgName}</span>
                      <Badge className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {org.cases.length}
                      </Badge>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
      </div>

      {/* 통계 대시보드 (탭 형식으로 변경) */}
      <div className="mb-8">
        <Card className="border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-md">
          <CardHeader className="pb-0">
            <Tabs
              defaultValue="cases"
              className="w-full"
              key={`stats-tabs-${selectedTab}-${selectedOrg || "none"}`}
            >
              <TabsList className="grid w-full grid-cols-2 bg-gray-50 dark:bg-gray-800/50 p-1 rounded-lg">
                <TabsTrigger value="cases" className="flex items-center rounded-md">
                  <Briefcase className="mr-2 h-4 w-4" />
                  총의뢰 ({stats.totalCases}건)
                </TabsTrigger>
                <TabsTrigger value="recovery" className="flex items-center rounded-md">
                  <CircleDollarSign className="mr-2 h-4 w-4" />
                  채권정보 ({formatCurrency(recoveryStats.totalDebtAmount).replace("₩", "")})
                </TabsTrigger>
              </TabsList>

              {/* 총의뢰 탭 내용의 카드 스타일 수정 */}
              <TabsContent value="cases" className="pt-3">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-3 mb-4">
                  {/* 좌측 - 프로필 카드 */}
                  <div>
                    <ClientSummary
                      userData={user}
                      cases={selectedTab === "personal" ? personalCases : organizationCases}
                      totalDebt={recoveryStats.totalDebtAmount}
                      loading={loading}
                      selectedTab={selectedTab}
                      selectedOrg={selectedOrg}
                      organizations={organizations}
                    />
                  </div>

                  {/* 우측 - 알림 */}
                  <div>
                    <Card className="border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-md h-full">
                      <CardHeader className="py-2 px-4 border-b">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base flex items-center">
                            <Bell className="h-4 w-4 mr-2 text-amber-500" /> 최근 알림
                            {filteredNotifications.filter((n) => !n.is_read).length > 0 && (
                              <Badge className="ml-2 bg-amber-500 text-white">
                                {filteredNotifications.filter((n) => !n.is_read).length}
                              </Badge>
                            )}
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="max-h-[220px] overflow-y-auto">
                          {notificationsLoading ? (
                            <div className="p-3 space-y-2">
                              {[1, 2].map((i) => (
                                <div key={i} className="flex flex-col space-y-1">
                                  <Skeleton className="h-4 w-1/4" />
                                  <Skeleton className="h-8 w-full" />
                                </div>
                              ))}
                            </div>
                          ) : filteredNotifications.length === 0 ? (
                            <div className="text-center py-4 text-gray-500">
                              <Bell className="h-5 w-5 mx-auto mb-1 text-gray-300 dark:text-gray-600" />
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                새로운 알림이 없습니다.
                              </p>
                            </div>
                          ) : (
                            <div className="divide-y">
                              {filteredNotifications.slice(0, 5).map((notification) => (
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
                                                  const updatedNotifications =
                                                    filteredNotifications.map((n) =>
                                                      n.id === notification.id
                                                        ? { ...n, is_read: true }
                                                        : n
                                                    );

                                                  // 상태 업데이트를 위해 supabase 호출
                                                  supabase
                                                    .from("test_case_notifications")
                                                    .update({ is_read: true })
                                                    .eq("id", notification.id)
                                                    .then(() => {
                                                      // 상태 업데이트
                                                      setFilteredNotifications(
                                                        updatedNotifications
                                                      );
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
                              {filteredNotifications.length > 5 && (
                                <div className="text-center py-3">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs h-8 px-4 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                                    onClick={() =>
                                      document.querySelector('[aria-label="알림"]')?.click()
                                    }
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
                  </div>
                </div>
              </TabsContent>

              {/* 채권정보 탭 - 회수 관련 정보와 그래프 */}
              <TabsContent value="recovery" className="pt-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 px-4 mb-6">
                  <Card className="lg:col-span-1 border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-md">
                    <CardHeader className="pb-2 border-b">
                      <CardTitle className="text-lg flex items-center">
                        <CircleDollarSign className="h-5 w-5 mr-2 text-amber-500" /> 채권 총액
                      </CardTitle>
                      <CardDescription>원금, 이자, 비용의 합계</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col items-center justify-center py-4">
                        <div className="text-4xl font-bold text-amber-600 dark:text-amber-400 mb-4">
                          {formatCurrency(recoveryStats.totalDebtAmount)}
                        </div>
                        <div className="w-full max-w-xs">
                          <div className="flex justify-between text-sm mb-1">
                            <span>원금</span>
                            <span className="font-medium">
                              {formatCurrency(recoveryStats.totalPrincipalAmount)}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{
                                width: `${
                                  (recoveryStats.totalPrincipalAmount /
                                    recoveryStats.totalDebtAmount) *
                                  100
                                }%`,
                              }}
                            ></div>
                          </div>

                          <div className="flex justify-between text-sm mb-1">
                            <span>이자</span>
                            <span className="font-medium">
                              {formatCurrency(
                                recoveryStats.totalDebtAmount -
                                  recoveryStats.totalPrincipalAmount -
                                  (recoveryStats.totalExpenses || 0)
                              )}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                            <div
                              className="bg-purple-500 h-2 rounded-full"
                              style={{
                                width: `${
                                  ((recoveryStats.totalDebtAmount -
                                    recoveryStats.totalPrincipalAmount -
                                    (recoveryStats.totalExpenses || 0)) /
                                    recoveryStats.totalDebtAmount) *
                                  100
                                }%`,
                              }}
                            ></div>
                          </div>

                          <div className="flex justify-between text-sm mb-1">
                            <span>비용</span>
                            <span className="font-medium">
                              {formatCurrency(recoveryStats.totalExpenses || 0)}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                            <div
                              className="bg-red-500 h-2 rounded-full"
                              style={{
                                width: `${
                                  ((recoveryStats.totalExpenses || 0) /
                                    recoveryStats.totalDebtAmount) *
                                  100
                                }%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="lg:col-span-2 border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-md">
                    <CardHeader className="py-2 px-4 border-b">
                      <CardTitle className="text-base flex items-center">
                        <BarChart3 className="h-4 w-4 mr-2 text-emerald-500" /> 회수 현황
                      </CardTitle>
                      <CardDescription className="text-xs">회수금액과 회수율</CardDescription>
                    </CardHeader>
                    <CardContent className="py-3 px-4">
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-center">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-1 mx-auto border border-emerald-200 dark:border-emerald-800/50">
                              <CircleDollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <p className="text-xs text-muted-foreground">회수금액</p>
                            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(recoveryStats.totalRecoveredAmount)}
                            </p>
                          </div>

                          <div className="text-center">
                            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-1 mx-auto border border-purple-200 dark:border-purple-800/50">
                              <PieChartIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <p className="text-xs text-muted-foreground">회수율</p>
                            <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                              {recoveryStats.recoveryRate}%
                            </p>
                          </div>

                          <div className="text-center">
                            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-1 mx-auto border border-red-200 dark:border-red-800/50">
                              <FileBarChart className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </div>
                            <p className="text-xs text-muted-foreground">잔여 채권액</p>
                            <p className="text-lg font-bold text-red-600 dark:text-red-400">
                              {formatCurrency(
                                recoveryStats.totalDebtAmount - recoveryStats.totalRecoveredAmount
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
                          <div
                            className="h-3 rounded-full bg-emerald-500"
                            style={{ width: `${Math.min(recoveryStats.recoveryRate, 100)}%` }}
                          >
                            <span className="px-2 text-xs text-white font-medium flex h-full items-center justify-end">
                              {recoveryStats.recoveryRate}%
                            </span>
                          </div>
                        </div>

                        <div className="min-h-[220px] relative">
                          <h4 className="text-sm font-medium mb-2">월별 회수 금액</h4>
                          <ResponsiveContainer width="100%" height={220}>
                            <BarChart
                              data={monthlyRecoveryStats}
                              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis
                                yAxisId="left"
                                orientation="left"
                                stroke="#10b981"
                                tickFormatter={(value) =>
                                  value >= 1000000
                                    ? `${(value / 1000000).toFixed(1)}백만`
                                    : value >= 1000
                                    ? `${(value / 1000).toFixed(0)}천`
                                    : value
                                }
                              />
                              <YAxis yAxisId="right" orientation="right" stroke="#6366f1" />
                              <Tooltip
                                formatter={(value, name) => {
                                  if (name === "회수금액") return formatCurrency(value);
                                  return `${value}건`;
                                }}
                              />
                              <Legend />
                              <Bar
                                yAxisId="left"
                                dataKey="회수금액"
                                fill="#10b981"
                                name="회수금액"
                              />
                              <Bar
                                yAxisId="right"
                                dataKey="회수건수"
                                fill="#6366f1"
                                name="회수건수"
                                radius={[4, 4, 0, 0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>

                          {monthlyStatsLoading ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80">
                              <div className="flex flex-col items-center">
                                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-2"></div>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                  회수 데이터 불러오는 중...
                                </p>
                              </div>
                            </div>
                          ) : (
                            monthlyRecoveryStats.length === 0 && (
                              <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80">
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                  회수 데이터가 없습니다
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>
      </div>

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
