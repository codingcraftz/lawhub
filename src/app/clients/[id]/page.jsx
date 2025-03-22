"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { useUser } from "@/contexts/UserContext";
import { format, formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getStatusById } from "@/utils/constants";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Search,
  Clock,
  CheckCircle2,
  Bell,
  FileText,
  ChevronRight,
  CircleDollarSign,
  BarChart3,
  PieChart,
} from "lucide-react";
import { StaffCasesTable } from "./StaffCasesTable";

// NotificationPanel 컴포넌트 추가 (간소화된 버전)
function NotificationPanel({ notifications, loading, router }) {
  // 알림 유형에 따른 아이콘 반환
  const getNotificationIcon = (type) => {
    switch (type) {
      case "lawsuit":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "lawsuit_update":
        return <Clock className="h-4 w-4 text-purple-500" />;
      case "recovery_activity":
        return <CircleDollarSign className="h-4 w-4 text-green-500" />;
      case "deadline":
        return <Calendar className="h-4 w-4 text-red-500" />;
      case "document":
        return <FileText className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card className="border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-md h-full">
      <CardHeader className="py-2 px-4 border-b">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base flex items-center">
            <Bell className="h-4 w-4 mr-2 text-amber-500" /> 최근 알림
            {notifications.filter((n) => !n.is_read).length > 0 && (
              <Badge className="ml-2 bg-amber-500 text-white">
                {notifications.filter((n) => !n.is_read).length}
              </Badge>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[220px] overflow-y-auto">
          {loading ? (
            <div className="p-3 space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="flex flex-col space-y-1">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <Bell className="h-5 w-5 mx-auto mb-1 text-gray-300 dark:text-gray-600" />
              <p className="text-xs text-gray-500 dark:text-gray-400">새로운 알림이 없습니다.</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.slice(0, 4).map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer",
                    !notification.is_read && "bg-blue-50/50 dark:bg-blue-900/10"
                  )}
                  onClick={() => router.push(`/cases/${notification.case_id}`)}
                >
                  <div className="flex gap-2">
                    <div className="mt-0.5">
                      {getNotificationIcon(notification.notification_type)}
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
                        </h4>
                        {!notification.is_read && (
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1"></span>
                        )}
                      </div>
                      <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-1">
                        {notification.message}
                      </p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-[10px] text-gray-500">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: ko,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {notifications.length > 4 && (
                <div className="text-center py-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[10px] h-6"
                    onClick={() => router.push("/notifications")}
                  >
                    더보기 ({notifications.length})
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

// ClientSummary 컴포넌트를 새로운 디자인으로 수정
function ClientSummary({ clientData, clientType, cases, totalDebt, loading }) {
  const isIndividual = clientType === "individual";

  // 금액 포맷
  const formatCurrency = (amount) => {
    if (!amount) return "0원";
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(amount);
  };

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

  return (
    <Card className="border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-md h-full">
      <CardHeader className="py-2 px-4 border-b">
        <CardTitle className="text-base flex items-center">
          {isIndividual ? (
            <User className="h-4 w-4 mr-2 text-blue-500" />
          ) : (
            <Building2 className="h-4 w-4 mr-2 text-amber-500" />
          )}
          의뢰인 프로필
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex gap-3 items-center mb-4">
          <Avatar className="h-14 w-14">
            {isIndividual ? (
              <AvatarImage src={clientData.profile_image} alt={clientData.name} />
            ) : (
              <AvatarImage
                src={`https://avatar.vercel.sh/${clientData.name?.replace(/\s+/g, "")}.png`}
                alt={clientData.name}
              />
            )}
            <AvatarFallback className={isIndividual ? "bg-blue-100" : "bg-amber-100"}>
              {isIndividual ? (
                <User className="h-6 w-6 text-blue-700" />
              ) : (
                <Building2 className="h-6 w-6 text-amber-700" />
              )}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center">
              <h3 className="text-base font-semibold mr-2">{clientData.name}</h3>
              <Badge variant={isIndividual ? "outline" : "secondary"} className="text-xs">
                {isIndividual ? "개인" : "기업"}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center">
              {clientData.email && (
                <div className="flex items-center mr-3">
                  <Mail className="h-3 w-3 mr-1" />
                  <span className="truncate max-w-[160px]">{clientData.email}</span>
                </div>
              )}
              {clientData.phone && (
                <div className="flex items-center">
                  <Phone className="h-3 w-3 mr-1" />
                  <span>{clientData.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center justify-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400 mb-1" />
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{cases.length}</div>
            <div className="text-xs text-muted-foreground">전체 사건</div>
          </div>

          <div className="flex flex-col items-center justify-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <Clock className="h-5 w-5 text-green-600 dark:text-green-400 mb-1" />
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {cases.filter((c) => c.status === "active" || c.status === "in_progress").length}
            </div>
            <div className="text-xs text-muted-foreground">진행중</div>
          </div>

          <div className="flex flex-col items-center justify-center p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <CircleDollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400 mb-1" />
            <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
              {formatCurrency(totalDebt)}
            </div>
            <div className="text-xs text-muted-foreground">채권 총액</div>
          </div>
        </div>

        {/* 추가 정보 (옵션) */}
        <div className="mt-3 text-xs text-muted-foreground">
          {clientData.address && (
            <div className="flex items-center mb-1">
              <MapPin className="h-3 w-3 mr-1" />
              <span>{clientData.address}</span>
            </div>
          )}
          {!isIndividual && clientData.representative_name && (
            <div className="flex items-center mb-1">
              <User className="h-3 w-3 mr-1" />
              <span>대표: {clientData.representative_name}</span>
            </div>
          )}
          {!isIndividual && clientData.business_number && (
            <div className="flex items-center">
              <Briefcase className="h-3 w-3 mr-1" />
              <span>사업자번호: {clientData.business_number}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ClientDetailPage() {
  const router = useRouter();
  const { id: clientId } = useParams();
  const { user } = useUser();

  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState(null);
  const [clientType, setClientType] = useState(null); // "individual" 또는 "organization"
  const [cases, setCases] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCases, setFilteredCases] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [casesPerPage, setCasesPerPage] = useState(10);
  const [totalDebt, setTotalDebt] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);

  // UUID 유효성 검사 함수
  const isValidUUID = (uuid) => {
    const uuidRegex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return uuid && uuidRegex.test(uuid);
  };

  useEffect(() => {
    // UUID가 유효하지 않으면 의뢰인 목록 페이지로 리다이렉트
    if (!isValidUUID(clientId)) {
      console.error("유효하지 않은 의뢰인 ID:", clientId);
      toast.error("유효하지 않은 의뢰인 ID입니다");
      router.push("/clients");
      return;
    }

    if (user) {
      fetchClientData();
      fetchClientNotifications();
    }
  }, [user, clientId]);

  useEffect(() => {
    filterCases();
  }, [cases, searchTerm, activeTab]);

  const fetchClientData = async () => {
    setLoading(true);
    try {
      // 먼저 test_case_clients 테이블에서 의뢰인 관계 확인
      const { data: clientRelations, error: relationsError } = await supabase
        .from("test_case_clients")
        .select("*")
        .or(`individual_id.eq.${clientId},organization_id.eq.${clientId}`);

      if (relationsError) throw relationsError;

      // 의뢰인 유형 확인
      let clientInfo = null;

      if (clientRelations && clientRelations.length > 0) {
        const relation = clientRelations[0];

        if (relation.individual_id === clientId) {
          setClientType("individual");
          // 개인 의뢰인 정보 가져오기
          const { data: individual, error: individualError } = await supabase
            .from("users")
            .select("*")
            .eq("id", clientId)
            .single();

          if (individualError) throw individualError;
          clientInfo = individual;
        } else if (relation.organization_id === clientId) {
          setClientType("organization");
          // 기업 의뢰인 정보 가져오기
          const { data: organization, error: organizationError } = await supabase
            .from("test_organizations")
            .select("*")
            .eq("id", clientId)
            .single();

          if (organizationError) throw organizationError;
          clientInfo = organization;
        }
      }

      if (!clientInfo) {
        toast.error("의뢰인 정보를 찾을 수 없습니다");
        router.push("/clients");
        return;
      }

      setClientData(clientInfo);

      // 의뢰인의 사건 목록 가져오기
      const caseIds = clientRelations.map((relation) => relation.case_id);

      if (caseIds.length > 0) {
        const { data: casesData, error: casesError } = await supabase
          .from("test_cases")
          .select(
            `
            *,
            parties:test_case_parties(
              id,
              party_type,
              entity_type,
              name,
              company_name,
              kcb_checked,
              kcb_checked_date,
              payment_notification_sent,
              payment_notification_date
            )
          `
          )
          .in("id", caseIds)
          .order("created_at", { ascending: false });

        if (casesError) throw casesError;

        // 사건 데이터 처리 및 당사자 정보 추가
        const enrichedCases = casesData.map((caseItem) => {
          // 해당 사건의 모든 당사자
          const caseParties = caseItem.parties || [];

          // 채권자와 채무자 찾기
          const creditor = caseParties.find((p) =>
            ["creditor", "plaintiff", "applicant"].includes(p.party_type)
          );

          const debtor = caseParties.find((p) =>
            ["debtor", "defendant", "respondent"].includes(p.party_type)
          );

          // status_id가 있으면 constants에서 상태 정보 가져오기
          let statusInfo = { name: "알 수 없음", color: "#999999" };
          if (caseItem.status_id) {
            statusInfo = getStatusById(caseItem.status_id);
          }

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
            // 채무자의 KCB 조회 정보 추가
            debtor_kcb_checked: debtor ? debtor.kcb_checked : false,
            debtor_kcb_checked_date: debtor ? debtor.kcb_checked_date : null,
            // 채무자의 납부안내 정보 추가
            debtor_payment_notification_sent: debtor ? debtor.payment_notification_sent : false,
            debtor_payment_notification_date: debtor ? debtor.payment_notification_date : null,
            status_info: {
              name: statusInfo.name,
              color: statusInfo.color,
            },
          };
        });

        setCases(enrichedCases);
        setFilteredCases(enrichedCases);

        // 채권 총액 계산
        const totalAmount = enrichedCases.reduce((sum, caseItem) => {
          return sum + (parseFloat(caseItem.claim_amount) || 0);
        }, 0);
        setTotalDebt(totalAmount);
      } else {
        setCases([]);
        setFilteredCases([]);
        setTotalDebt(0);
      }
    } catch (error) {
      console.error("의뢰인 정보 가져오기 실패:", error);
      toast.error("의뢰인 정보 가져오기 실패");
    } finally {
      setLoading(false);
    }
  };

  // 의뢰인 관련 알림 가져오기
  const fetchClientNotifications = async () => {
    setNotificationsLoading(true);
    try {
      // 의뢰인의 사건 ID 목록 가져오기
      const { data: clientRelations, error: relationsError } = await supabase
        .from("test_case_clients")
        .select("case_id")
        .or(`individual_id.eq.${clientId},organization_id.eq.${clientId}`);

      if (relationsError) throw relationsError;

      if (clientRelations && clientRelations.length > 0) {
        const caseIds = clientRelations.map((relation) => relation.case_id);

        // 해당 사건들의 알림 가져오기
        const { data: notificationsData, error: notificationsError } = await supabase
          .from("test_case_notifications")
          .select("*")
          .in("case_id", caseIds)
          .order("created_at", { ascending: false })
          .limit(5);

        if (notificationsError) throw notificationsError;
        setNotifications(notificationsData || []);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error("의뢰인 알림 가져오기 실패:", error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const filterCases = () => {
    // 검색어 기반 필터링
    let filtered = [...cases];

    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (caseItem) =>
          (caseItem.case_number && caseItem.case_number.toLowerCase().includes(term)) ||
          (caseItem.case_info && caseItem.case_info.toLowerCase().includes(term)) ||
          (caseItem.court_name && caseItem.court_name.toLowerCase().includes(term)) ||
          (caseItem.creditor_name && caseItem.creditor_name.toLowerCase().includes(term)) ||
          (caseItem.debtor_name && caseItem.debtor_name.toLowerCase().includes(term))
      );
    }

    // 탭에 따른 필터링
    if (activeTab === "active") {
      filtered = filtered.filter(
        (caseItem) => caseItem.status === "active" || caseItem.status === "in_progress"
      );
    } else if (activeTab === "closed") {
      filtered = filtered.filter(
        (caseItem) => caseItem.status === "closed" || caseItem.status === "completed"
      );
    }

    setFilteredCases(filtered);
    setTotalPages(Math.ceil(filtered.length / casesPerPage) || 1);

    // 현재 페이지가 최대 페이지 수를 초과하는 경우 조정
    const maxPage = Math.ceil(filtered.length / casesPerPage) || 1;
    if (currentPage > maxPage) {
      setCurrentPage(1);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1); // 검색 시 첫 페이지로 이동
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1); // 탭 변경 시 첫 페이지로 이동
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // 페이지 크기 변경 핸들러 추가
  const handlePageSizeChange = (size) => {
    setCasesPerPage(Number(size));
    setCurrentPage(1);
  };

  // 금액 포맷
  const formatCurrency = (amount) => {
    if (!amount) return "0원";
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="mx-auto py-8 max-w-5xl px-4 md:px-6 w-full">
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            size="sm"
            className="mr-4"
            onClick={() => router.push("/clients")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> 목록으로
          </Button>
          <Skeleton className="h-10 w-64" />
        </div>

        <Skeleton className="h-48 w-full mb-8" />

        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto py-8 max-w-5xl px-4 md:px-6 w-full">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" className="mr-4" onClick={() => router.push("/clients")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> 목록으로
        </Button>
        <h1 className="text-2xl font-bold">의뢰인 정보</h1>
      </div>

      {/* 통계 대시보드 (탭 형식) */}
      <div className="mb-8">
        <Card className="border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-md">
          <CardHeader className="pb-0">
            <Tabs defaultValue="cases" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-50 dark:bg-gray-800/50 p-1 rounded-lg">
                <TabsTrigger value="cases" className="flex items-center rounded-md">
                  <Briefcase className="mr-2 h-4 w-4" />
                  총의뢰 ({cases.length}건)
                </TabsTrigger>
                <TabsTrigger value="debt" className="flex items-center rounded-md">
                  <CircleDollarSign className="mr-2 h-4 w-4" />
                  채권정보 ({formatCurrency(totalDebt).replace("₩", "")})
                </TabsTrigger>
              </TabsList>

              {/* 총의뢰 탭 내용 */}
              <TabsContent value="cases" className="pt-3">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-3 mb-4">
                  {/* 좌측 - 프로필 카드 */}
                  <div>
                    <ClientSummary
                      clientData={clientData}
                      clientType={clientType}
                      cases={cases}
                      totalDebt={totalDebt}
                      loading={loading}
                    />
                  </div>

                  {/* 우측 - 알림 */}
                  <div>
                    <NotificationPanel
                      notifications={notifications}
                      loading={notificationsLoading}
                      router={router}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* 채권정보 탭 (여기에 채권분류 그래프 추가 예정) */}
              <TabsContent value="debt" className="pt-4 px-4 pb-2">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                  <Card className="lg:col-span-1 border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-md">
                    <CardHeader className="pb-2 border-b">
                      <CardTitle className="text-lg flex items-center">
                        <CircleDollarSign className="h-5 w-5 mr-2 text-amber-500" /> 채권 총액
                      </CardTitle>
                      <CardDescription>원금, 이자, 비용의 합계</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center justify-center py-2">
                        <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-4">
                          {formatCurrency(totalDebt)}
                        </div>
                        {/* 채권 내역은 필요한 경우 여기에 추가 */}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="lg:col-span-2 border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-md">
                    <CardHeader className="pb-2 border-b">
                      <CardTitle className="text-lg flex items-center">
                        <PieChart className="h-5 w-5 mr-2 text-purple-500" /> 채권 분류
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <p className="text-center text-gray-500 py-8">
                        채권 분류 데이터를 표시할 예정입니다.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>
      </div>
      <StaffCasesTable
        cases={filteredCases}
        personalCases={cases}
        organizationCases={[]}
        selectedTab="personal"
        searchTerm={searchTerm}
        onSearchChange={handleSearch}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredCases.length}
        casesPerPage={casesPerPage}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        formatCurrency={formatCurrency}
      />
    </div>
  );
}
