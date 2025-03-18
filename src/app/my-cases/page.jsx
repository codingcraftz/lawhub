"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Briefcase,
  Building2,
  ChevronRight,
  User,
  BarChart3,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Timer,
  Hourglass,
  Filter,
  Search,
  GanttChartSquare,
  Users,
  ChevronDown,
  FileBarChart,
  Bell,
  Scale,
  CircleDollarSign,
} from "lucide-react";

// 차트 컴포넌트
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

// NotificationSummary 컴포넌트
function NotificationSummary({ notifications, loading }) {
  const router = useRouter();

  // 알림 유형에 따른 아이콘 반환
  const getNotificationIcon = (type) => {
    switch (type) {
      case "lawsuit":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "lawsuit_update":
        return <Clock className="h-4 w-4 text-indigo-500" />;
      case "recovery_activity":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-amber-500" />;
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
      await supabase.from("test_notifications").update({ is_read: true }).eq("id", notificationId);
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
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                        locale: ko,
                      })}
                    </span>
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
      await supabase.from("test_notifications").update({ is_read: true }).eq("id", notificationId);

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
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "lawsuit_update":
        return <Clock className="h-4 w-4 text-indigo-500" />;
      case "recovery_activity":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-amber-500" />;
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
              {displayNotifications.slice(0, 8).map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50",
                    !notification.is_read && "bg-blue-50/50 dark:bg-blue-900/10"
                  )}
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
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 line-clamp-2">
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
              {(activeTab === "unread" ? unreadNotifications.length : readNotifications.length) >
                8 && (
                <div className="text-center py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => document.querySelector('[aria-label="알림"]')?.click()}
                  >
                    모든 알림 보기 (
                    {activeTab === "unread" ? unreadNotifications.length : readNotifications.length}
                    )
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

export default function MyCasesPage() {
  const router = useRouter();
  const { user } = useUser();

  const [loading, setLoading] = useState(true);
  const [personalCases, setPersonalCases] = useState([]);
  const [organizationCases, setOrganizationCases] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [selectedTab, setSelectedTab] = useState("personal");
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);

  // 검색 및 페이지네이션을 위한 상태 추가
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredCases, setFilteredCases] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const casesPerPage = 10;

  // 회수 정보를 위한 상태 추가
  const [recoveryStats, setRecoveryStats] = useState({
    totalPrincipalAmount: 0,
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
  });

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

      // 회수 금액 계산
      const recoveryByCase = {};
      recoveryData?.forEach((recovery) => {
        if (recovery.activity_type === "payment" && recovery.amount) {
          if (!recoveryByCase[recovery.case_id]) {
            recoveryByCase[recovery.case_id] = 0;
          }
          recoveryByCase[recovery.case_id] += parseFloat(recovery.amount);
        }
      });

      // 당사자 정보로 사건 정보 보강
      return cases.map((caseItem) => {
        const caseParties = partiesData.filter((p) => p.case_id === caseItem.id) || [];

        const creditor = caseParties.find((p) =>
          ["creditor", "plaintiff", "applicant"].includes(p.party_type)
        );

        const debtor = caseParties.find((p) =>
          ["debtor", "defendant", "respondent"].includes(p.party_type)
        );

        // 회수 금액 및 회수율 계산
        const recoveredAmount = recoveryByCase[caseItem.id] || 0;
        const principalAmount = caseItem.principal_amount || 0;
        const recoveryRate =
          principalAmount > 0 ? Math.round((recoveredAmount / principalAmount) * 1000) / 10 : 0;

        return {
          ...caseItem,
          creditor_name: creditor
            ? creditor.party_entity_type === "individual"
              ? creditor.name
              : creditor.company_name
            : null,
          debtor_name: debtor
            ? debtor.party_entity_type === "individual"
              ? debtor.name
              : debtor.company_name
            : null,
          recovered_amount: recoveredAmount,
          recovery_rate: recoveryRate,
        };
      });
    } catch (err) {
      console.error("사건 정보 보강 실패:", err);
      return cases;
    }
  };

  // 현재 선택된 탭이나 조직에 따라 표시할 사건 목록 필터링
  useEffect(() => {
    const currentCases = selectedTab === "personal" ? personalCases : organizationCases;

    // 검색어 필터링
    let filtered = currentCases;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = currentCases.filter(
        (c) =>
          (c.case_number && c.case_number.toLowerCase().includes(term)) ||
          (c.creditor_name && c.creditor_name.toLowerCase().includes(term)) ||
          (c.debtor_name && c.debtor_name.toLowerCase().includes(term)) ||
          (c.case_info && c.case_info.toLowerCase().includes(term))
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
    }

    // 현재 페이지에 해당하는 사건만 필터링
    const startIndex = (validCurrentPage - 1) * casesPerPage;
    const paginatedCases = filtered.slice(startIndex, startIndex + casesPerPage);

    setFilteredCases(paginatedCases);
  }, [selectedTab, selectedOrg, personalCases, organizationCases, searchTerm, currentPage]);

  // 활성화된 탭이나 조직이 변경될 때 알림과 통계 필터링
  useEffect(() => {
    if (notifications.length === 0) return;

    filterNotificationsBySelection();

    // 선택된 사건들에 대한 통계 재계산
    const currentCases = selectedTab === "personal" ? personalCases : organizationCases;
    const currentStats = calculateStats(currentCases);
    setStats(currentStats);

    // 회수 정보 계산
    calculateRecoveryStats(currentCases);
  }, [selectedTab, selectedOrg, notifications, personalCases, organizationCases]);

  // 회수 정보 계산
  const calculateRecoveryStats = async (cases) => {
    if (!cases || !cases.length) {
      setRecoveryStats({
        totalPrincipalAmount: 0,
        totalRecoveredAmount: 0,
        recoveryRate: 0,
      });
      return;
    }

    try {
      // 총 원금 계산
      const totalPrincipal = cases.reduce((sum, c) => sum + (c.principal_amount || 0), 0);

      // 회수된 금액 계산 (이미 각 사건에 계산되어 있음)
      const recoveredAmount = cases.reduce((sum, c) => sum + (c.recovered_amount || 0), 0);

      const rate = totalPrincipal > 0 ? (recoveredAmount / totalPrincipal) * 100 : 0;

      setRecoveryStats({
        totalPrincipalAmount: totalPrincipal,
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

  useEffect(() => {
    if (user) {
      fetchCases();
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    setNotificationsLoading(true);
    try {
      const { data, error } = await supabase
        .from("test_notifications")
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
      // 1. 사용자가 개인 의뢰인으로 등록된 사건 가져오기
      const { data: clientCases, error: clientError } = await supabase
        .from("test_case_clients")
        .select(
          `
          *,
          case:case_id(
            *,
            status_info:status_id(name, color)
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
              *,
              status_info:status_id(name, color)
            ),
            organization:organization_id(*)
          `
          )
          .eq("client_type", "organization")
          .in("organization_id", orgIds);

        if (orgClientError) throw orgClientError;
        orgCases = orgClientCases || [];
      }

      // 개인 의뢰와 조직 의뢰 정리
      const personalCasesList = await enrichCasesWithPartyInfo(
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

          return {
            orgId,
            orgName,
            cases,
          };
        })
      );

      const filteredOrgCasesByOrg = orgCasesByOrg.filter((org) => org.cases.length > 0);

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

      setPersonalCases(personalCasesList);
      setOrganizations(filteredOrgCasesByOrg);

      if (filteredOrgCasesByOrg.length > 0) {
        setOrganizationCases(filteredOrgCasesByOrg[0].cases);
        setSelectedOrg(filteredOrgCasesByOrg[0].orgId);
      } else {
        setOrganizationCases([]);
      }

      setStats(stats);

      // 조직 의뢰가 있고 개인 의뢰가 없으면 조직 탭으로 시작
      if (personalCasesList.length === 0 && filteredOrgCasesByOrg.length > 0) {
        setSelectedTab("organization");
      }

      // 초기 회수 정보 계산
      calculateRecoveryStats(
        personalCasesList.length > 0
          ? personalCasesList
          : filteredOrgCasesByOrg.length > 0
          ? filteredOrgCasesByOrg[0].cases
          : []
      );
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

    return {
      totalCases,
      activeCases,
      pendingCases,
      closedCases,
      casesByType,
      casesByMonth,
    };
  };

  const handleOrgChange = (orgId) => {
    const org = organizations.find((o) => o.orgId === orgId);
    if (org) {
      setSelectedOrg(orgId);
      setOrganizationCases(org.cases);

      // 조직 변경 시 페이지와 검색 초기화
      setCurrentPage(1);
      setSearchTerm("");
    }
  };

  // 탭 변경 핸들러
  const handleTabChange = (tab) => {
    setSelectedTab(tab);
    setCurrentPage(1);
    setSearchTerm("");
  };

  // 검색 변경 핸들러
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // 사건 유형에 따른 배지 색상 및 아이콘
  const getCaseTypeBadge = (type) => {
    switch (type) {
      case "civil":
        return (
          <Badge className="bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-800/50 border border-blue-200 dark:border-blue-800/50">
            <FileText className="mr-1 h-3 w-3" /> 민사
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
    let bgClass = "";
    let textClass = "";
    let borderClass = "";

    if (color) {
      return <Badge style={{ backgroundColor: color, color: "#fff" }}>{status}</Badge>;
    }

    switch (status) {
      case "active":
        icon = <Timer className="mr-1 h-3 w-3" />;
        bgClass = "bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-800/50";
        textClass = "text-blue-700 dark:text-blue-300";
        borderClass = "border-blue-200 dark:border-blue-800/50";
        break;
      case "pending":
        icon = <Hourglass className="mr-1 h-3 w-3" />;
        bgClass = "bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-800/50";
        textClass = "text-amber-700 dark:text-amber-300";
        borderClass = "border-amber-200 dark:border-amber-800/50";
        break;
      case "closed":
        icon = <CheckCircle2 className="mr-1 h-3 w-3" />;
        bgClass = "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700";
        textClass = "text-gray-700 dark:text-gray-300";
        borderClass = "border-gray-200 dark:border-gray-700";
        break;
      default:
        icon = <AlertCircle className="mr-1 h-3 w-3" />;
        bgClass = "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700";
        textClass = "text-gray-700 dark:text-gray-300";
        borderClass = "border-gray-200 dark:border-gray-700";
    }

    return (
      <Badge className={`${bgClass} ${textClass} border ${borderClass}`}>
        {icon}
        {status === "active"
          ? "진행중"
          : status === "pending"
          ? "대기중"
          : status === "closed"
          ? "종결"
          : status}
      </Badge>
    );
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
            <TabsList className="bg-background shadow-md border dark:border-gray-700 rounded-xl p-1">
              <TabsTrigger
                value="personal"
                className="rounded-lg py-2 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
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
          <div className="mt-4 p-3 bg-muted/30 rounded-lg border shadow-sm">
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

      {/* 통계 대시보드 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* 왼쪽 - 요약 통계 카드 */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <CardContent className="p-4 flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3 mt-2">
                  <Briefcase className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-sm text-muted-foreground mb-1">총 의뢰</p>
                <p className="text-3xl font-bold">{stats.totalCases}건</p>
                <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 flex items-center">
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-none">
                    활성 {stats.activeCases}건
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <CardContent className="p-4 flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-3 mt-2">
                  <FileBarChart className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <p className="text-sm text-muted-foreground mb-1">채권 총액</p>
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                  {formatCurrency(recoveryStats.totalPrincipalAmount).replace("₩", "")}
                </p>
                <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 flex items-center">
                  <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-none">
                    건당 평균{" "}
                    {formatCurrency(
                      stats.totalCases > 0
                        ? recoveryStats.totalPrincipalAmount / stats.totalCases
                        : 0
                    ).replace("₩", "")}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <CardContent className="p-4 flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-3 mt-2">
                  <CircleDollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-sm text-muted-foreground mb-1">회수금액</p>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(recoveryStats.totalRecoveredAmount).replace("₩", "")}
                </p>
                <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 flex items-center">
                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-none">
                    진행 {stats.activeCases}건
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <CardContent className="p-4 flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-3 mt-2">
                  <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-sm text-muted-foreground mb-1">회수율</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {recoveryStats.recoveryRate}%
                </p>
                <div className="mt-2 text-xs text-purple-600 dark:text-purple-400 flex items-center">
                  <Badge
                    className={`border-none ${
                      recoveryStats.recoveryRate > 70
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                        : recoveryStats.recoveryRate > 40
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                        : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                    }`}
                  >
                    {recoveryStats.recoveryRate > 70
                      ? "우수"
                      : recoveryStats.recoveryRate > 40
                      ? "보통"
                      : "저조"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 사건 유형 분포 */}
          <div className="mt-6">
            <Card className="border shadow-sm overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-blue-500" /> 사건 유형 분포
                </CardTitle>
                <CardDescription>사건 유형별 비율</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex flex-col lg:flex-row">
                  <div className="p-4 flex-1 min-h-[200px]">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={stats.casesByType}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {stats.casesByType.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="p-4 flex-1 min-h-[200px]">
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart
                        data={stats.casesByMonth}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3b82f6" name="사건 수" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 오른쪽 - 알림 섹션 */}
        <div className="lg:col-span-1">
          <NotificationsPanel
            notifications={filteredNotifications}
            loading={notificationsLoading}
            router={router}
          />
        </div>
      </div>

      {/* 사건 목록 섹션 */}
      <div className="mb-8">
        <Card className="border shadow-sm overflow-hidden">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center">
                <Briefcase className="h-5 w-5 mr-2 text-primary" /> 사건 목록
              </CardTitle>
              <CardDescription>
                총 {selectedTab === "personal" ? personalCases.length : organizationCases.length}건
                중 {filteredCases.length}건 표시
              </CardDescription>
            </div>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={16}
              />
              <Input
                placeholder="사건번호, 당사자 이름으로 검색"
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-9 w-[300px]"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800">
                    <TableHead className="w-[100px]">사건번호</TableHead>
                    <TableHead>채권자</TableHead>
                    <TableHead>채무자</TableHead>
                    <TableHead>수임금액</TableHead>
                    <TableHead>회수금액</TableHead>
                    <TableHead>회수율</TableHead>
                    <TableHead>유형</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="text-right">메뉴</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCases.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        {searchTerm ? (
                          <div className="flex flex-col items-center">
                            <Search className="h-8 w-8 mb-2 text-gray-300 dark:text-gray-600" />
                            <p>검색 결과가 없습니다.</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <Briefcase className="h-8 w-8 mb-2 text-gray-300 dark:text-gray-600" />
                            <p>등록된 사건이 없습니다.</p>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCases.map((caseItem) => (
                      <TableRow
                        key={caseItem.id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                        onClick={() => router.push(`/cases/${caseItem.id}`)}
                      >
                        <TableCell className="font-medium">{caseItem.case_number || "-"}</TableCell>
                        <TableCell>{caseItem.creditor_name || "-"}</TableCell>
                        <TableCell>{caseItem.debtor_name || "-"}</TableCell>
                        <TableCell>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {formatCurrency(caseItem.principal_amount)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-green-600 dark:text-green-400">
                            {formatCurrency(caseItem.recovered_amount || 0)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`
                              ${
                                caseItem.recovery_rate > 70
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : caseItem.recovery_rate > 30
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-red-50 text-red-700 border-red-200"
                              }
                            `}
                          >
                            {caseItem.recovery_rate || 0}%
                          </Badge>
                        </TableCell>
                        <TableCell>{getCaseTypeBadge(caseItem.case_type)}</TableCell>
                        <TableCell>
                          {getCaseStatusBadge(caseItem.status, caseItem.status_info?.color)}
                        </TableCell>
                        <TableCell className="text-right p-0 pr-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[180px]">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/cases/${caseItem.id}`);
                                }}
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                의뢰 상세보기
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/cases/${caseItem.id}?tab=lawsuits`);
                                }}
                              >
                                <Scale className="mr-2 h-4 w-4" />
                                소송 상세보기
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/cases/${caseItem.id}?tab=recovery`);
                                }}
                              >
                                <CircleDollarSign className="mr-2 h-4 w-4" />
                                회수 상세보기
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex justify-center py-4 border-t">
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  이전
                </Button>

                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else {
                    if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}

                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  다음
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
