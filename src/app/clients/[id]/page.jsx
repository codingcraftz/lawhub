"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { useUser } from "@/contexts/UserContext";
import { format } from "date-fns";
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
  FileText,
  ChevronRight,
  CircleDollarSign,
  BarChart3,
  PieChart,
} from "lucide-react";
import { StaffCasesTable } from "./StaffCasesTable";

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
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useUser();

  // URL에서 현재 페이지, 검색어, 상태 필터 가져오기
  const pageFromUrl = Number(searchParams.get("page")) || 1;
  const searchTermFromUrl = searchParams.get("search") || "";
  const statusFilterFromUrl = searchParams.get("status") || "all";

  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState(null);
  const [clientType, setClientType] = useState(null); // "individual" 또는 "organization"
  const [allCases, setAllCases] = useState([]); // 모든 사건 데이터 저장
  const [filteredCases, setFilteredCases] = useState([]); // 현재 페이지에 표시할 필터링된 데이터
  const [searchTerm, setSearchTerm] = useState(searchTermFromUrl);
  const [activeTab, setActiveTab] = useState(statusFilterFromUrl);
  const [currentPage, setCurrentPage] = useState(pageFromUrl);
  const [totalPages, setTotalPages] = useState(1);
  const [casesPerPage, setCasesPerPage] = useState(10);
  const [totalDebt, setTotalDebt] = useState(0);
  const [totalCases, setTotalCases] = useState(0);
  const [refetchTrigger, setRefetchTrigger] = useState(0); // 데이터 리프래시를 위한 트리거
  const [tabValue, setTabValue] = useState("cases"); // 상단 탭 상태 추가

  // UUID 유효성 검사 함수
  const isValidUUID = (uuid) => {
    const uuidRegex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return uuid && uuidRegex.test(uuid);
  };

  // URL 파라미터 업데이트 함수
  const updateUrlParams = (page, search, status) => {
    const params = new URLSearchParams();
    if (page !== 1) params.set("page", page.toString());
    if (search) params.set("search", search);
    if (status !== "all") params.set("status", status);

    const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : "");
    window.history.pushState({}, "", newUrl);
  };

  // URL이 변경될 때 상태 업데이트
  useEffect(() => {
    const page = Number(searchParams.get("page")) || 1;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";

    if (page !== currentPage) setCurrentPage(page);
    if (search !== searchTerm) setSearchTerm(search);
    if (status !== activeTab) setActiveTab(status);
  }, [searchParams]);

  useEffect(() => {
    // UUID가 유효하지 않으면 의뢰인 목록 페이지로 리다이렉트
    if (!isValidUUID(params.id)) {
      console.error("유효하지 않은 의뢰인 ID:", params.id);
      toast.error("유효하지 않은 의뢰인 ID입니다");
      router.push("/clients");
      return;
    }

    if (user) {
      fetchClientData();
    }
  }, [user, params.id, refetchTrigger]);

  // 검색어나 필터, 페이지가 변경될 때 클라이언트 측에서 데이터 필터링
  useEffect(() => {
    if (allCases.length > 0) {
      filterAndPaginateData();
    }
  }, [allCases, currentPage, searchTerm, activeTab, casesPerPage]);

  // 클라이언트 측에서 데이터 필터링 및 페이지네이션 처리
  const filterAndPaginateData = () => {
    console.log(
      "클라이언트 측 필터링 - 페이지:",
      currentPage,
      "검색어:",
      searchTerm,
      "상태:",
      activeTab
    );

    // 상태 필터 적용
    let filteredByStatus = [...allCases];
    if (activeTab === "active") {
      filteredByStatus = allCases.filter(
        (caseItem) =>
          caseItem.status === "active" ||
          caseItem.status === "in_progress" ||
          caseItem.status === "pending"
      );
    } else if (activeTab === "completed") {
      filteredByStatus = allCases.filter(
        (caseItem) => caseItem.status === "completed" || caseItem.status === "closed"
      );
    }

    // 검색어 필터링 적용
    const filteredBySearch = searchTerm.trim()
      ? filteredByStatus.filter(
          (caseItem) =>
            (caseItem.creditor_name &&
              caseItem.creditor_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (caseItem.debtor_name &&
              caseItem.debtor_name.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      : filteredByStatus;

    // 총 아이템 수 설정
    const totalItemCount = filteredBySearch.length;
    setTotalCases(totalItemCount);

    // 총 페이지 수 계산
    const maxPages = Math.ceil(totalItemCount / casesPerPage) || 1;
    setTotalPages(maxPages);

    console.log("필터링된 사건 수:", totalItemCount, "페이지 수:", maxPages);

    // 현재 페이지가 최대 페이지를 초과하는 경우 조정
    if (currentPage > maxPages && maxPages > 0) {
      console.log("페이지 번호 조정:", currentPage, "->", maxPages);
      setCurrentPage(maxPages);
      updateUrlParams(maxPages, searchTerm, activeTab);
      return; // 페이지 번호가 변경되었으므로 useEffect에 의해 다시 호출됨
    }

    // 현재 페이지에 필요한 데이터만 추출
    const startIdx = (currentPage - 1) * casesPerPage;
    const endIdx = Math.min(startIdx + casesPerPage, filteredBySearch.length);
    const paginatedCases = filteredBySearch.slice(startIdx, endIdx);

    console.log("현재 페이지 데이터 수:", paginatedCases.length);

    setFilteredCases(paginatedCases);
  };

  const fetchClientData = async () => {
    console.log("의뢰인 데이터 및 모든 사건 데이터 가져오기 시작");
    setLoading(true);
    try {
      // 먼저 test_case_clients 테이블에서 의뢰인 관계 확인
      const { data: clientRelations, error: relationsError } = await supabase
        .from("test_case_clients")
        .select("*")
        .or(`individual_id.eq.${params.id},organization_id.eq.${params.id}`);

      if (relationsError) throw relationsError;

      // 의뢰인 유형 확인
      let clientInfo = null;

      if (clientRelations && clientRelations.length > 0) {
        const relation = clientRelations[0];

        if (relation.individual_id === params.id) {
          setClientType("individual");
          // 개인 의뢰인 정보 가져오기
          const { data: individual, error: individualError } = await supabase
            .from("users")
            .select("*")
            .eq("id", params.id)
            .single();

          if (individualError) throw individualError;
          clientInfo = individual;
        } else if (relation.organization_id === params.id) {
          setClientType("organization");
          // 기업 의뢰인 정보 가져오기
          const { data: organization, error: organizationError } = await supabase
            .from("test_organizations")
            .select("*")
            .eq("id", params.id)
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

      // 의뢰인의 사건 ID 목록 가져오기
      const caseIds = clientRelations.map((relation) => relation.case_id);

      if (caseIds.length > 0) {
        console.log("의뢰인 관련 사건 ID 수:", caseIds.length);

        // 모든 사건 데이터를 가져옴 (페이지네이션 없이)
        const { data: allCasesData, error: allCasesError } = await supabase
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

        if (allCasesError) throw allCasesError;

        // 각 사건의 회수 금액 데이터 가져오기 (payment 유형의 recovery_activities)
        const recoveryPromises = allCasesData.map(async (caseItem) => {
          const { data: recoveryData, error: recoveryError } = await supabase
            .from("test_recovery_activities")
            .select("amount")
            .eq("case_id", caseItem.id)
            .eq("activity_type", "payment")
            .eq("status", "completed");

          if (recoveryError) {
            console.error(`사건 ${caseItem.id}의 회수 활동 조회 실패:`, recoveryError);
            return { caseId: caseItem.id, recoveredAmount: 0 };
          }

          // 회수 금액 합계 계산
          const recoveredAmount = recoveryData.reduce(
            (sum, activity) => sum + (activity.amount || 0),
            0
          );
          console.log(`사건 ${caseItem.id}의 회수 금액:`, recoveredAmount);

          return { caseId: caseItem.id, recoveredAmount };
        });

        // 모든 회수 금액 조회 완료 대기
        const recoveryResults = await Promise.all(recoveryPromises);

        // 회수 금액 결과를 맵으로 변환
        const recoveryMap = recoveryResults.reduce((map, item) => {
          map[item.caseId] = item.recoveredAmount;
          return map;
        }, {});

        // 모든 사건 데이터 처리 및 당사자 정보 추가
        const allEnrichedCases = allCasesData.map((caseItem) => {
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
            // 회수 금액 추가
            recovered_amount: recoveryMap[caseItem.id] || 0,
            status_info: {
              name: statusInfo.name,
              color: statusInfo.color,
            },
          };
        });

        // 전체 사건 데이터 저장
        setAllCases(allEnrichedCases);

        // 채권 총액 계산
        const totalAmount = allEnrichedCases.reduce((sum, caseItem) => {
          return sum + (parseFloat(caseItem.principal_amount) || 0);
        }, 0);

        setTotalDebt(totalAmount);
      } else {
        // 사건이 없는 경우 초기화
        setAllCases([]);
        setFilteredCases([]);
        setTotalDebt(0);
        setTotalCases(0);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("의뢰인 정보 가져오기 실패:", error);
      toast.error("의뢰인 정보 가져오기 실패");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1); // 검색 시 첫 페이지로 이동
    updateUrlParams(1, value, activeTab);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1); // 탭 변경 시 첫 페이지로 이동
    updateUrlParams(1, searchTerm, tab);
  };

  const handlePageChange = (page) => {
    console.log("페이지 변경:", page);
    setCurrentPage(page);
    updateUrlParams(page, searchTerm, activeTab);
  };

  // 페이지 크기 변경 핸들러 추가
  const handlePageSizeChange = (size) => {
    setCasesPerPage(Number(size));
    setCurrentPage(1);
    updateUrlParams(1, searchTerm, activeTab);
  };

  // 데이터 새로고침 핸들러 (모달에서 사용)
  const handleRefreshData = () => {
    setRefetchTrigger((prev) => prev + 1);
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
            <Tabs value={tabValue} onValueChange={setTabValue} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-50 dark:bg-gray-800/50 p-1 rounded-lg">
                <TabsTrigger value="cases" className="flex items-center rounded-md">
                  <Briefcase className="mr-2 h-4 w-4" />
                  사건 정보
                </TabsTrigger>
                <TabsTrigger value="debt" className="flex items-center rounded-md">
                  <CircleDollarSign className="mr-2 h-4 w-4" />
                  채권 정보
                </TabsTrigger>
              </TabsList>

              {/* 총의뢰 탭 내용 */}
              <TabsContent value="cases" className="pt-3">
                <div className="grid grid-cols-1 lg:grid-cols-1 gap-4 px-3 mb-4">
                  {/* 프로필 카드 */}
                  <div>
                    <ClientSummary
                      clientData={clientData}
                      clientType={clientType}
                      cases={filteredCases}
                      totalDebt={totalDebt}
                      loading={loading}
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
        personalCases={allCases}
        organizationCases={[]}
        selectedTab="personal"
        statusFilter={activeTab}
        searchTerm={searchTerm}
        onSearchChange={handleSearch}
        onStatusChange={handleTabChange}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalCases}
        casesPerPage={casesPerPage}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        formatCurrency={formatCurrency}
        onRefreshData={handleRefreshData}
      />
    </div>
  );
}
