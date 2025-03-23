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
            <Skeleton className="h-20 w-full mt-2" />
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
            <div className="text-sm mt-1 flex flex-col gap-1">
              {clientData.phone && (
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <Phone className="h-3.5 w-3.5 mr-1 text-gray-500" />
                  <span className="font-medium">{clientData.phone}</span>
                </div>
              )}
              {clientData.email && (
                <div className="flex items-center text-gray-700 dark:text-gray-300 text-xs">
                  <Mail className="h-3.5 w-3.5 mr-1 text-gray-500" />
                  <span className="truncate max-w-[160px]">{clientData.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 추가 정보 */}
        <div className="mt-3 text-sm border-t pt-3">
          {isIndividual && clientData.birth_date && (
            <div className="flex items-center mb-2">
              <Calendar className="h-4 w-4 mr-2 text-gray-500" />
              <span>생년월일: {clientData.birth_date}</span>
            </div>
          )}
          {clientData.address && (
            <div className="flex items-center mb-2">
              <MapPin className="h-4 w-4 mr-2 text-gray-500" />
              <span>{clientData.address}</span>
            </div>
          )}
          {!isIndividual && clientData.representative_name && (
            <div className="flex items-center mb-2">
              <User className="h-4 w-4 mr-2 text-gray-500" />
              <span>대표: {clientData.representative_name}</span>
            </div>
          )}
          {!isIndividual && clientData.business_number && (
            <div className="flex items-center mb-2">
              <Briefcase className="h-4 w-4 mr-2 text-gray-500" />
              <span>법인 번호: {clientData.business_number}</span>
            </div>
          )}
          {clientData.created_at && (
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-gray-500" />
              <span>
                등록일:{" "}
                {format(new Date(clientData.created_at), "yyyy년 MM월 dd일", { locale: ko })}
              </span>
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

  // URL에서 client_type 파라미터 가져오기
  const clientTypeFromUrl = searchParams.get("client_type") || null;

  // URL에서 현재 페이지, 검색어, 상태 필터 가져오기
  const pageFromUrl = Number(searchParams.get("page")) || 1;
  const searchTermFromUrl = searchParams.get("search") || "";
  const statusFilterFromUrl = searchParams.get("status") || "all";
  const kcbFilterFromUrl = searchParams.get("kcb") || "all"; // KCB 필터 추가
  const notificationFilterFromUrl = searchParams.get("notification") || "all"; // 납부안내 필터 추가

  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState(null);
  const [clientType, setClientType] = useState(clientTypeFromUrl); // URL에서 가져온 타입으로 초기화
  const [allCases, setAllCases] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]);
  const [searchTerm, setSearchTerm] = useState(searchTermFromUrl);
  const [activeTab, setActiveTab] = useState(statusFilterFromUrl);
  const [currentPage, setCurrentPage] = useState(pageFromUrl);
  const [totalPages, setTotalPages] = useState(1);
  const [casesPerPage, setCasesPerPage] = useState(10);
  const [totalDebt, setTotalDebt] = useState(0);
  const [totalCases, setTotalCases] = useState(0);
  const [refetchTrigger, setRefetchTrigger] = useState(0); // 데이터 리프래시를 위한 트리거
  const [tabValue, setTabValue] = useState("cases"); // 상단 탭 상태 추가

  // KCB 조회와 납부안내 발송 필터 상태 추가
  const [kcbFilter, setKcbFilter] = useState(kcbFilterFromUrl);
  const [notificationFilter, setNotificationFilter] = useState(notificationFilterFromUrl);

  // UUID 유효성 검사 함수
  const isValidUUID = (uuid) => {
    const uuidRegex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return uuid && uuidRegex.test(uuid);
  };

  // URL 파라미터 업데이트
  const updateUrlParams = (params) => {
    const { page, search, status, kcb, notification } = params;

    // id 파라미터가 undefined인 경우 현재 경로에서 id 추출
    const clientId = params.id || params.get("id");

    if (!clientId) {
      console.error("updateUrlParams: 의뢰인 ID를 찾을 수 없습니다");
      // 경로에서 id 추출 시도
      const pathMatch = window.location.pathname.match(/\/clients\/([^/]+)/);
      if (pathMatch && pathMatch[1]) {
        console.log("경로에서 의뢰인 ID 추출:", pathMatch[1]);
        const id = pathMatch[1];
        updateUrlWithId(id, page, search, status, kcb, notification);
        return;
      }

      // 그래도 ID가 없으면 클라이언트 목록 페이지로 리디렉션
      console.error("의뢰인 ID를 결정할 수 없어 목록 페이지로 이동합니다");
      router.push("/clients");
      return;
    }

    updateUrlWithId(clientId, page, search, status, kcb, notification);
  };

  // ID를 사용하여 URL 업데이트하는 헬퍼 함수
  const updateUrlWithId = (id, page, search, status, kcb, notification) => {
    // 기존 client_type 파라미터 유지
    const clientTypeParam = clientType ? `&client_type=${clientType}` : "";
    const kcbParam = kcb !== undefined ? `&kcb=${kcb}` : `&kcb=${kcbFilter}`;
    const notificationParam =
      notification !== undefined
        ? `&notification=${notification}`
        : `&notification=${notificationFilter}`;

    // URL 생성
    const url = `/clients/${id}?page=${page}${search ? `&search=${search}` : ""}${
      status ? `&status=${status}` : ""
    }${clientTypeParam}${kcbParam}${notificationParam}`;

    // 현재 페이지를 바로 변경하여 다중 리렌더링 방지
    if (page !== currentPage) setCurrentPage(page);

    // URL 변경 - 의뢰인 ID가 유효한 경우에만 실행
    console.log("URL 업데이트:", url);
    router.push(url, { scroll: false });
  };

  // URL이 변경될 때 상태 업데이트 (페이지 변경은 제외)
  useEffect(() => {
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const kcb = searchParams.get("kcb") || "all";
    const notification = searchParams.get("notification") || "all";

    if (search !== searchTerm) setSearchTerm(search);
    if (status !== activeTab) setActiveTab(status);
    if (kcb !== kcbFilter) setKcbFilter(kcb);
    if (notification !== notificationFilter) setNotificationFilter(notification);
  }, [searchParams]);

  // 의뢰인 데이터 로드 - URL의 page 파라미터는 제외하여 페이지 변경 시 의뢰인 정보 재조회 방지
  useEffect(() => {
    // params 객체가 제대로 로드되었는지 확인
    if (!params || !params.id) {
      console.error("의뢰인 ID가 제공되지 않았습니다");
      toast.error("의뢰인 정보를 불러올 수 없습니다", {
        description: "의뢰인 ID가 제공되지 않았습니다. 의뢰인 목록으로 이동합니다.",
      });
      router.push("/clients");
      return;
    }

    // UUID가 유효하지 않으면 의뢰인 목록 페이지로 리다이렉트
    if (!isValidUUID(params.id)) {
      console.error("유효하지 않은 의뢰인 ID:", params.id);
      toast.error("유효하지 않은 의뢰인 ID입니다", {
        description: "올바른 의뢰인을 선택하거나 의뢰인 목록 페이지로 이동합니다.",
      });
      router.push("/clients");
      return;
    }

    if (user) {
      fetchClientData();
    }
  }, [user, params, refetchTrigger]);

  // 검색어나 필터, 페이지가 변경될 때 클라이언트 측에서 데이터 필터링
  useEffect(() => {
    if (allCases.length > 0) {
      filterAndPaginateData();
    }
  }, [allCases, currentPage, searchTerm, activeTab, casesPerPage, kcbFilter, notificationFilter]);

  // 클라이언트 측에서 데이터 필터링 및 페이지네이션 처리 수정
  const filterAndPaginateData = () => {
    console.log(
      "클라이언트 측 필터링 - 페이지:",
      currentPage,
      "검색어:",
      searchTerm,
      "상태:",
      activeTab,
      "KCB:",
      kcbFilter,
      "납부안내:",
      notificationFilter
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

    // KCB 조회 필터 적용
    let filteredByKcb = filteredByStatus;
    if (kcbFilter === "yes") {
      filteredByKcb = filteredByStatus.filter((caseItem) => caseItem.debtor_kcb_checked);
    } else if (kcbFilter === "no") {
      filteredByKcb = filteredByStatus.filter((caseItem) => !caseItem.debtor_kcb_checked);
    }

    // 납부안내 발송 필터 적용
    let filteredByNotification = filteredByKcb;
    if (notificationFilter === "yes") {
      filteredByNotification = filteredByKcb.filter(
        (caseItem) => caseItem.debtor_payment_notification_sent
      );
    } else if (notificationFilter === "no") {
      filteredByNotification = filteredByKcb.filter(
        (caseItem) => !caseItem.debtor_payment_notification_sent
      );
    }

    // 검색어 필터링 적용
    const filteredBySearch = searchTerm.trim()
      ? filteredByNotification.filter(
          (caseItem) =>
            (caseItem.creditor_name &&
              caseItem.creditor_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (caseItem.debtor_name &&
              caseItem.debtor_name.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      : filteredByNotification;

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
      updateUrlParams({ page: maxPages, search: searchTerm, status: activeTab });
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
    if (!user) return;

    try {
      setLoading(true);

      // 의뢰인 ID 가져오기
      const clientId = params.id;
      console.log("의뢰인 조회 시작:", clientId, "타입:", clientType);

      // URL에서 가져온 의뢰인 타입 활용
      // 개인 의뢰인 / 조직 의뢰인을 미리 알고 있다면 해당 테이블만 조회하여 효율성 향상
      let individualData = null;
      let organizationData = null;

      // URL에서 타입 정보가 있으면 해당 타입만 조회
      if (clientType === "individual") {
        // 개인 의뢰인 정보만 조회
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", clientId)
          .single();

        if (error) {
          console.error("개인 의뢰인 조회 실패:", error);

          if (error.code === "PGRST116") {
            toast.error("유효하지 않은 의뢰인입니다", {
              description: "개인 의뢰인 정보를 찾을 수 없습니다.",
            });
            router.push("/clients");
            return;
          }
        } else {
          console.log("개인 의뢰인 조회 성공:", data?.id);
          individualData = data;
        }
      } else if (clientType === "organization") {
        // 조직 의뢰인 정보만 조회
        const { data, error } = await supabase
          .from("test_organizations")
          .select("*")
          .eq("id", clientId)
          .single();

        if (error) {
          console.error("조직 의뢰인 조회 실패:", error);

          if (error.code === "PGRST116") {
            toast.error("유효하지 않은 의뢰인입니다", {
              description: "조직 의뢰인 정보를 찾을 수 없습니다.",
            });
            router.push("/clients");
            return;
          }
        } else {
          console.log("조직 의뢰인 조회 성공:", data?.id);
          organizationData = data;
        }
      } else {
        // 타입 정보가 없으면 둘 다 조회
        const { data: indData, error: indError } = await supabase
          .from("users")
          .select("*")
          .eq("id", clientId)
          .single();

        if (indError) {
          console.log("개인 의뢰인 조회 실패:", indError.code);
          if (indError.code !== "PGRST116") {
            console.error("개인 의뢰인 조회 중 예상치 못한 오류:", indError);
          }
        } else {
          console.log("개인 의뢰인 조회 성공:", indData?.id);
          individualData = indData;
        }

        const { data: orgData, error: orgError } = await supabase
          .from("test_organizations")
          .select("*")
          .eq("id", clientId)
          .single();

        if (orgError) {
          console.log("조직 의뢰인 조회 실패:", orgError.code);
          if (orgError.code !== "PGRST116") {
            console.error("조직 의뢰인 조회 중 예상치 못한 오류:", orgError);
          }
        } else {
          console.log("조직 의뢰인 조회 성공:", orgData?.id);
          organizationData = orgData;
        }
      }

      // 개인 또는 조직 데이터 설정
      if (individualData) {
        setClientData({
          ...individualData,
          phone: individualData.phone_number, // users 테이블은 phone_number 필드 사용
        });
        setClientType("individual");
      } else if (organizationData) {
        setClientData(organizationData);
        setClientType("organization");
      } else {
        console.error("의뢰인 정보를 찾을 수 없음 (ID: " + clientId + ")");
        toast.error("유효하지 않은 의뢰인입니다", {
          description: "의뢰인 정보를 찾을 수 없습니다.",
        });
        router.push("/clients");
        return;
      }

      // 해당 의뢰인의 모든 사건 정보 가져오기
      const { data: casesData, error: casesError } = await supabase
        .from("test_case_clients")
        .select(
          `
          case_id,
          case:test_cases(
            id,
            status,
            case_type,
            filing_date,
            principal_amount,
            created_at
          )
        `
        )
        .eq(clientType === "individual" ? "individual_id" : "organization_id", clientId)
        .not("case", "is", null);

      if (casesError) {
        console.error("사건 정보 가져오기 실패:", casesError);
        toast.error("사건 정보를 가져오는데 실패했습니다");
        setAllCases([]);
        return;
      }

      if (!casesData || casesData.length === 0) {
        console.log("사건이 없습니다");
        setAllCases([]);
        return;
      }

      // 사건 ID 목록
      const caseIds = casesData.map((item) => item.case_id);
      console.log("조회할 사건 ID:", caseIds);

      // 당사자 정보 가져오기
      const { data: partiesData, error: partiesError } = await supabase
        .from("test_case_parties")
        .select("*")
        .in("case_id", caseIds);

      if (partiesError) {
        console.error("당사자 정보 가져오기 실패:", partiesError);
        toast.error("당사자 정보를 가져오는데 실패했습니다");
      }

      // 채권자와 채무자 정보 매핑
      const partiesMap = {};
      if (partiesData) {
        partiesData.forEach((party) => {
          if (!partiesMap[party.case_id]) {
            partiesMap[party.case_id] = [];
          }
          partiesMap[party.case_id].push(party);
        });
      }

      // 채권자와 채무자 이름 추출을 위한 함수
      const extractPartyNames = (caseId) => {
        const parties = partiesMap[caseId] || [];
        let creditorName = null;
        let debtorName = null;
        let debtorPhone = null;

        parties.forEach((party) => {
          const name = party.entity_type === "individual" ? party.name : party.company_name;

          if (["creditor", "plaintiff", "applicant"].includes(party.party_type)) {
            creditorName = name;
          } else if (["debtor", "defendant", "respondent"].includes(party.party_type)) {
            debtorName = name;
            debtorPhone = party.phone;
          }
        });

        return { creditorName, debtorName, debtorPhone };
      };

      // KCB와 납부안내 정보 가져오기
      const { data: activitiesData, error: activitiesError } = await supabase
        .from("test_recovery_activities")
        .select("*")
        .in("case_id", caseIds)
        .in("activity_type", ["kcb", "letter"])
        .eq("status", "completed");

      if (activitiesError) {
        console.error("회수 활동 정보 가져오기 실패:", activitiesError);
        toast.error("회수 활동 정보를 가져오는데 실패했습니다");
      }

      // 활동 정보로 KCB와 납부안내 상태 매핑
      const activitiesMap = {};
      if (activitiesData) {
        activitiesData.forEach((activity) => {
          if (!activitiesMap[activity.case_id]) {
            activitiesMap[activity.case_id] = {
              kcbChecked: false,
              paymentNotificationSent: false,
            };
          }

          if (activity.activity_type === "kcb") {
            activitiesMap[activity.case_id].kcbChecked = true;
          } else if (
            activity.activity_type === "letter" &&
            activity.description &&
            activity.description.includes("납부안내")
          ) {
            activitiesMap[activity.case_id].paymentNotificationSent = true;
          }
        });
      }

      // 처리된 사건 데이터 생성
      const processedCases = casesData
        .map((item) => {
          const caseItem = item.case;
          if (!caseItem) return null;

          const { creditorName, debtorName, debtorPhone } = extractPartyNames(caseItem.id);
          const activities = activitiesMap[caseItem.id] || {
            kcbChecked: false,
            paymentNotificationSent: false,
          };

          return {
            id: caseItem.id,
            case_number: caseItem.id.substring(0, 8), // id의 앞 8자리를 case_number로 사용
            status: caseItem.status,
            case_type: caseItem.case_type,
            filing_date: caseItem.filing_date,
            principal_amount: caseItem.principal_amount,
            created_at: caseItem.created_at,
            creditor_name: creditorName,
            debtor_name: debtorName,
            debtor_phone: debtorPhone,
            debtor_kcb_checked: activities.kcbChecked,
            debtor_payment_notification_sent: activities.paymentNotificationSent,
          };
        })
        .filter(Boolean);

      // 채권 총액 계산
      const debtTotal = processedCases.reduce((total, caseItem) => {
        return total + (caseItem.principal_amount || 0);
      }, 0);

      setAllCases(processedCases);
      setTotalDebt(debtTotal);
      console.log("사건 데이터 로드 완료:", processedCases.length);
    } catch (error) {
      console.error("클라이언트 데이터 로드 중 오류:", error);
      toast.error("데이터를 불러오는 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    // 검색어가 UUID 형식이 아닌 경우에도 정상 검색 처리
    setSearchTerm(value);
    setCurrentPage(1);
    updateUrlParams({ id: params.id, page: 1, search: value, status: activeTab });
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1); // 탭 변경 시 첫 페이지로 이동
    updateUrlParams({ page: 1, search: searchTerm, status: tab });
  };

  const handlePageChange = (page) => {
    console.log("페이지 변경:", page, "현재 페이지:", currentPage);

    // 페이지가 다르면 URL 파라미터 업데이트 (의뢰인 데이터 재조회 없이)
    if (page !== currentPage) {
      // 반드시 의뢰인 ID를 함께 전달
      updateUrlParams({
        id: params.id,
        page,
        search: searchTerm,
        status: activeTab,
        kcb: kcbFilter,
        notification: notificationFilter,
      });
    }
  };

  // 페이지 크기 변경 핸들러 추가
  const handlePageSizeChange = (size) => {
    setCasesPerPage(Number(size));
    setCurrentPage(1);
    updateUrlParams({ page: 1, search: searchTerm, status: activeTab });
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

  // KCB 필터 변경 핸들러 추가
  const handleKcbFilterChange = (value) => {
    setKcbFilter(value);
    setCurrentPage(1); // 필터 변경 시 첫 페이지로 이동
    updateUrlParams({ page: 1, search: searchTerm, status: activeTab, kcb: value });
  };

  // 납부안내 필터 변경 핸들러 추가
  const handleNotificationFilterChange = (value) => {
    setNotificationFilter(value);
    setCurrentPage(1); // 필터 변경 시 첫 페이지로 이동
    updateUrlParams({
      page: 1,
      search: searchTerm,
      status: activeTab,
      kcb: kcbFilter,
      notification: value,
    });
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

      {/* 프로필 카드 */}
      <div className="mb-8">
        <ClientSummary
          clientData={clientData}
          clientType={clientType}
          cases={filteredCases}
          totalDebt={totalDebt}
          loading={loading}
        />
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
        // KCB 및 납부안내 필터 props 추가
        kcbFilter={kcbFilter}
        notificationFilter={notificationFilter}
        onKcbFilterChange={handleKcbFilterChange}
        onNotificationFilterChange={handleNotificationFilterChange}
      />
    </div>
  );
}
