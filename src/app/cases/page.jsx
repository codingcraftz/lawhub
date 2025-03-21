"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { format, formatDistanceToNow } from "date-fns";
import ko from "date-fns/locale/ko";
import { toast } from "sonner";
import {
  Calendar,
  CreditCard,
  FileText,
  Filter,
  PlusCircle,
  RefreshCw,
  Search,
  SlidersHorizontal,
  ArrowUpRight,
  Briefcase,
  Scale,
  Clock,
  Check,
  AlertCircle,
  X,
  ChevronRight,
  Timer,
  Hourglass,
  CheckCircle2,
  Users,
  Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useUser } from "@/contexts/UserContext";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { getStatusById } from "@/utils/constants";

// useSearchParams를 사용하는 부분을 별도 컴포넌트로 분리
function CasesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();

  // URL에서 의뢰인 필터 쿼리 파라미터 가져오기
  const individualId = searchParams.get("individualId");
  const organizationId = searchParams.get("organizationId");
  const clientName = searchParams.get("clientName");

  // UUID 유효성 검사 함수
  const isValidUUID = (uuid) => {
    const uuidRegex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return uuid && uuidRegex.test(uuid);
  };

  // URL 파라미터 유효성 검사
  const validIndividualId = isValidUUID(individualId) ? individualId : null;
  const validOrganizationId = isValidUUID(organizationId) ? organizationId : null;

  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState([]);
  const [totalCases, setTotalCases] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [caseType, setCaseType] = useState("");
  const [caseStatus, setCaseStatus] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCases();
    }
  }, [
    user,
    page,
    pageSize,
    caseType,
    caseStatus,
    sortBy,
    sortOrder,
    validIndividualId,
    validOrganizationId,
  ]);

  const fetchCases = async () => {
    setLoading(true);

    try {
      // 사건 쿼리 구성 - 클라이언트(의뢰인) 정보와 당사자 정보 함께 가져오기
      let query = supabase.from("test_cases").select(
        `
          *,
          clients:test_case_clients(
            id,
            client_type,
            individual_id,
            organization_id,
            individual:individual_id(name, email),
            organization:organization_id(name, representative_name)
          ),
          parties:test_case_parties(
            id,
            party_type,
            entity_type,
            name,
            company_name
          )
        `
      );

      // 필터링 적용
      if (caseType) {
        query = query.eq("case_type", caseType);
      }

      if (caseStatus) {
        query = query.eq("status", caseStatus);
      }

      if (searchTerm) {
        query = query.or(
          `case_number.ilike.%${searchTerm}%,case_info.ilike.%${searchTerm}%,court_name.ilike.%${searchTerm}%`
        );
      }

      // 의뢰인 ID로 필터링 (individualId, organizationId)
      if (validIndividualId || validOrganizationId) {
        // 먼저 필터링된 case_id 목록을 가져옵니다
        const clientFilter = supabase.from("test_case_clients");

        if (validIndividualId) {
          const { data: caseIds, error: caseIdError } = await clientFilter
            .select("case_id")
            .eq("individual_id", validIndividualId);

          if (caseIdError) throw caseIdError;

          if (caseIds && caseIds.length > 0) {
            const ids = caseIds.map((item) => item.case_id);
            query = query.in("id", ids);
          } else {
            // 결과가 없는 경우 빈 배열 반환
            setCases([]);
            setTotalCases(0);
            setLoading(false);
            return;
          }
        } else if (validOrganizationId) {
          const { data: caseIds, error: caseIdError } = await clientFilter
            .select("case_id")
            .eq("organization_id", validOrganizationId);

          if (caseIdError) throw caseIdError;

          if (caseIds && caseIds.length > 0) {
            const ids = caseIds.map((item) => item.case_id);
            query = query.in("id", ids);
          } else {
            // 결과가 없는 경우 빈 배열 반환
            setCases([]);
            setTotalCases(0);
            setLoading(false);
            return;
          }
        }
      }

      // 정렬 적용
      query = query.order(sortBy, { ascending: sortOrder === "asc" });

      // 페이지네이션 적용
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      // 데이터 가공
      const enrichedCases = data.map((caseItem) => {
        // 의뢰인 정보 처리
        const clientInfo =
          caseItem.clients && caseItem.clients.length > 0
            ? caseItem.clients
                .map((client) => {
                  if (client.client_type === "individual" && client.individual) {
                    return client.individual.name;
                  } else if (client.client_type === "organization" && client.organization) {
                    return client.organization.name;
                  }
                  return null;
                })
                .filter(Boolean)
                .join(", ")
            : "미등록";

        // 당사자 정보 처리
        const parties = caseItem.parties || [];
        const creditor = parties.find((p) =>
          ["creditor", "plaintiff", "applicant"].includes(p.party_type)
        );
        const debtor = parties.find((p) =>
          ["debtor", "defendant", "respondent"].includes(p.party_type)
        );

        const creditorName = creditor
          ? creditor.entity_type === "individual"
            ? creditor.name
            : creditor.company_name
          : null;

        const debtorName = debtor
          ? debtor.entity_type === "individual"
            ? debtor.name
            : debtor.company_name
          : null;

        return {
          ...caseItem,
          clientInfo,
          creditor_name: creditorName,
          debtor_name: debtorName,
        };
      });

      setCases(enrichedCases || []);
      setTotalCases(count || 0);
    } catch (error) {
      console.error("Error fetching cases:", error);
      toast.error("사건 목록을 불러오는데 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    // 검색 시에는 첫 페이지로 이동
    setPage(1);
    fetchCases();
  };

  const handleSearchInputChange = (e) => {
    setSearchTerm(e.target.value);
    // 검색어 변경 시 타이머 설정 (300ms 후 자동 검색)
    if (window.searchTimer) clearTimeout(window.searchTimer);
    window.searchTimer = setTimeout(() => {
      setPage(1);
      fetchCases();
    }, 300);
  };

  const handleFilterReset = () => {
    setCaseType("");
    setCaseStatus("");
    setSortBy("created_at");
    setSortOrder("desc");
    setSearchTerm("");
    setPage(1);
    // 필터 초기화 후 데이터 다시 불러오기
    fetchCases();
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const getCaseTypeBadge = (type) => {
    switch (type) {
      case "civil":
        return (
          <Badge className="bg-primary/10 text-primary border-primary/20 border">
            <FileText className="mr-1 h-3 w-3" /> 민사
          </Badge>
        );
      case "payment_order":
        return (
          <Badge className="bg-secondary/20 text-secondary-foreground border-secondary/30 border">
            <CreditCard className="mr-1 h-3 w-3" /> 지급명령
          </Badge>
        );
      case "debt":
        return (
          <Badge className="bg-success/10 text-success border-success/20 border">
            <Briefcase className="mr-1 h-3 w-3" /> 채권
          </Badge>
        );
      default:
        return (
          <Badge className="bg-muted text-muted-foreground border-muted/50 border">{type}</Badge>
        );
    }
  };

  const getCaseStatusBadge = (status, color) => {
    let icon = null;
    let badgeClass = "";

    // color가 있으면 직접 사용
    if (color) {
      return <Badge style={{ backgroundColor: color, color: "#fff" }}>{status}</Badge>;
    }

    // status가 UUID 형태인 경우 constants에서 가져오기
    if (status && status.length > 10) {
      const statusInfo = getStatusById(status);
      return (
        <Badge style={{ backgroundColor: statusInfo.color, color: "#fff" }}>
          {statusInfo.name}
        </Badge>
      );
    }

    // 그렇지 않으면 기존 로직 사용
    switch (status) {
      case "in_progress":
      case "active": // 이전 상태값 호환성 유지
        icon = <Timer className="mr-1 h-3 w-3" />;
        badgeClass = "bg-primary/10 hover:bg-primary/20";
        break;
      case "pending":
        icon = <Hourglass className="mr-1 h-3 w-3" />;
        badgeClass = "bg-warning/10 hover:bg-warning/20";
        break;
      case "completed":
      case "closed": // 이전 상태값 호환성 유지
        icon = <CheckCircle2 className="mr-1 h-3 w-3" />;
        badgeClass = "bg-secondary/30 hover:bg-secondary/40";
        break;
      default:
        icon = <AlertCircle className="mr-1 h-3 w-3" />;
        badgeClass = "bg-muted hover:bg-muted/80";
    }

    return (
      <Badge className={`${badgeClass} text-muted-foreground border`}>
        {icon}
        {status === "active" || status === "in_progress"
          ? "진행중"
          : status === "pending"
          ? "대기중"
          : status === "closed" || status === "completed"
          ? "완료"
          : status}
      </Badge>
    );
  };

  const formatCurrency = (amount) => {
    if (!amount) return "0원";
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // 채권 분류 배지 함수 추가
  const getDebtCategoryBadge = (category) => {
    switch (category) {
      case "normal":
        return (
          <Badge variant="outline" className="bg-green-600/10 text-green-600 border-green-600/20">
            정상채권
          </Badge>
        );
      case "bad":
        return (
          <Badge
            variant="outline"
            className="bg-destructive/10 text-destructive border-destructive/20"
          >
            악성채권
          </Badge>
        );
      case "interest":
        return (
          <Badge
            variant="outline"
            className="bg-warning/10 text-warning-foreground border-warning/20"
          >
            관심채권
          </Badge>
        );
      case "special":
        return (
          <Badge
            variant="outline"
            className="bg-secondary/50 text-secondary-foreground border-secondary/30"
          >
            특수채권
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-green-600/10 text-green-600 border-green-600/20">
            정상채권
          </Badge>
        );
    }
  };

  // 페이지네이션 구성요소 개선
  const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    // 표시할 페이지 버튼 계산
    const getPageButtons = () => {
      // 총 페이지가 7개 이하면 모든 페이지 버튼 표시
      if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
      }

      // 현재 페이지가 앞쪽에 있을 때
      if (currentPage <= 4) {
        return [1, 2, 3, 4, 5, "...", totalPages];
      }

      // 현재 페이지가 뒤쪽에 있을 때
      if (currentPage >= totalPages - 3) {
        return [
          1,
          "...",
          totalPages - 4,
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages,
        ];
      }

      // 현재 페이지가 중간에 있을 때
      return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
    };

    const pageButtons = getPageButtons();

    return (
      <div className="flex justify-center py-4">
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            이전
          </Button>

          {pageButtons.map((pageNum, index) =>
            pageNum === "..." ? (
              <Button key={`ellipsis-${index}`} variant="outline" size="sm" disabled>
                ...
              </Button>
            ) : (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </Button>
            )
          )}

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => onPageChange(currentPage + 1)}
          >
            다음
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="container py-6 px-4 md:px-6">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">사건 목록</h1>
            {(individualId || organizationId) && clientName && (
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-sm font-normal px-2">
                  {clientName} 의뢰인의 사건만 표시
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => router.push("/cases")}
                >
                  필터 해제
                </Button>
              </div>
            )}
            <p className="text-muted-foreground mt-2">
              {individualId || organizationId
                ? `${clientName} 의뢰인의 사건 ${totalCases}건`
                : `총 ${totalCases}건의 사건이 있습니다`}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Link href="/cases/clients">
              <Button variant="outline" className="w-full sm:w-auto flex items-center gap-2">
                <Users className="h-4 w-4" />
                의뢰인 목록
              </Button>
            </Link>
            <Link href="/cases/new">
              <Button className="w-full sm:w-auto flex items-center gap-2">
                <Plus className="h-4 w-4" />새 사건 등록
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative col-span-1 md:col-span-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <Input
              type="search"
              placeholder="사건번호, 법원, 내용으로 검색..."
              className="pl-9 w-full"
              value={searchTerm}
              onChange={handleSearchInputChange}
              onKeyDown={(e) => e.key === "Enter" && handleSearch(e)}
            />
          </div>
          <div className="flex gap-2">
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="flex-1 flex items-center justify-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  필터 및 정렬
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader className="mb-4">
                  <SheetTitle>필터링 및 정렬</SheetTitle>
                  <SheetDescription>
                    사건 목록을 필터링하거나 원하는 순서로 정렬하세요.
                  </SheetDescription>
                </SheetHeader>

                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">사건 유형</label>
                    <Select value={caseType} onValueChange={setCaseType}>
                      <SelectTrigger>
                        <SelectValue placeholder="모든 유형" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">모든 유형</SelectItem>
                        <SelectItem value="civil">민사</SelectItem>
                        <SelectItem value="payment_order">지급명령</SelectItem>
                        <SelectItem value="debt">채권</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">상태</label>
                    <Select value={caseStatus} onValueChange={setCaseStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="모든 상태" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">모든 상태</SelectItem>
                        <SelectItem value="active">진행중</SelectItem>
                        <SelectItem value="pending">대기중</SelectItem>
                        <SelectItem value="closed">종결</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">정렬 기준</label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger>
                        <SelectValue placeholder="정렬 기준" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="created_at">등록일</SelectItem>
                        <SelectItem value="filing_date">접수일</SelectItem>
                        <SelectItem value="principal_amount">금액</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">정렬 방향</label>
                    <Select value={sortOrder} onValueChange={setSortOrder}>
                      <SelectTrigger>
                        <SelectValue placeholder="정렬 방향" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">내림차순 (최신순)</SelectItem>
                        <SelectItem value="asc">오름차순 (과거순)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <SheetFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleFilterReset();
                      setIsFilterOpen(false);
                    }}
                  >
                    초기화
                  </Button>
                  <Button
                    onClick={() => {
                      fetchCases();
                      setIsFilterOpen(false);
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    적용하기
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      <Card className="border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-md">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse w-1/2"></div>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-16 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"
                  ></div>
                ))}
              </div>
            </div>
          ) : cases.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
                사건 없음
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
                {searchTerm || caseType || caseStatus
                  ? "검색 조건에 맞는 사건이 없습니다. 필터를 초기화하거나 다른 검색어를 입력해 보세요."
                  : "등록된 사건이 없습니다. 신규 사건을 등록해 보세요."}
              </p>
              {searchTerm || caseType || caseStatus ? (
                <Button variant="outline" onClick={handleFilterReset}>
                  필터 초기화
                </Button>
              ) : (
                <Link href="/cases/new">
                  <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                    신규 사건 등록
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800">
                    <TableHead>상태</TableHead>
                    <TableHead className="w-[150px]">사건번호</TableHead>
                    <TableHead>내용</TableHead>
                    <TableHead>의뢰인</TableHead>
                    <TableHead>당사자</TableHead>
                    <TableHead>유형</TableHead>
                    <TableHead>금액</TableHead>
                    <TableHead>채권분류</TableHead>
                    <TableHead className="text-right">등록일</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cases.map((caseItem) => (
                    <TableRow
                      key={caseItem.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/cases/${caseItem.id}`)}
                    >
                      <TableCell>
                        {getCaseStatusBadge(caseItem.status, caseItem.status_info?.color)}
                      </TableCell>
                      <TableCell className="font-medium">{caseItem.case_number || "-"}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {caseItem.case_info || "제목 없음"}
                      </TableCell>
                      <TableCell className="text-primary">
                        {caseItem.clientInfo || "미등록"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center">
                            <Badge
                              variant="outline"
                              className="bg-primary/10 text-primary border-primary/20 mr-2 text-xs font-medium"
                            >
                              채권자
                            </Badge>
                            <span className="truncate max-w-[150px]">
                              {caseItem.creditor_name || "-"}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Badge
                              variant="outline"
                              className="bg-destructive/10 text-destructive border-destructive/20 mr-2 text-xs font-medium"
                            >
                              채무자
                            </Badge>
                            <span className="truncate max-w-[150px]">
                              {caseItem.debtor_name || "-"}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getCaseTypeBadge(caseItem.case_type)}</TableCell>
                      <TableCell>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {formatCurrency(caseItem.principal_amount)}
                        </span>
                      </TableCell>
                      <TableCell>{getDebtCategoryBadge(caseItem.debt_category)}</TableCell>
                      <TableCell className="text-right text-gray-500 dark:text-gray-400">
                        {format(new Date(caseItem.created_at), "yyyy.MM.dd", {
                          locale: ko,
                        })}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/cases/${caseItem.id}`);
                          }}
                          className="opacity-50 hover:opacity-100 transition-opacity"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {!loading && cases.length > 0 && (
            <div className="p-4 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  총 {totalCases}개 중 {(page - 1) * pageSize + 1}-
                  {Math.min(page * pageSize, totalCases)}개 표시
                </div>

                <div className="flex items-center gap-4">
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(value) => {
                      setPageSize(parseInt(value));
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[110px] h-8">
                      <SelectValue placeholder="페이지 크기" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10개씩 보기</SelectItem>
                      <SelectItem value="20">20개씩 보기</SelectItem>
                      <SelectItem value="30">30개씩 보기</SelectItem>
                      <SelectItem value="50">50개씩 보기</SelectItem>
                    </SelectContent>
                  </Select>

                  <Pagination
                    currentPage={page}
                    totalPages={Math.ceil(totalCases / pageSize)}
                    onPageChange={handlePageChange}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// 메인 컴포넌트에서는 Suspense로 감싸서 사용
export default function CasesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin">
              <RefreshCw className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">로딩 중...</p>
          </div>
        </div>
      }
    >
      <CasesContent />
    </Suspense>
  );
}
