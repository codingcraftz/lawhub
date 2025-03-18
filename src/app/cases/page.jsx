"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
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

export default function CasesPage() {
  const router = useRouter();
  const { user } = useUser();

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
  }, [user, page, pageSize, caseType, caseStatus, sortBy, sortOrder]);

  const fetchCases = async () => {
    setLoading(true);

    try {
      // 사건 쿼리 구성
      let query = supabase
        .from("test_cases")
        .select("*, status_info:status_id(name, color)", { count: "exact" });

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

      // 정렬 적용
      query = query.order(sortBy, { ascending: sortOrder === "asc" });

      // 페이지네이션 적용
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setCases(data || []);
      setTotalCases(count || 0);
    } catch (error) {
      console.error("Error fetching cases:", error);
      toast.error("사건 목록을 불러오는데 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCases();
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
          <Badge className="bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-800/50 border border-blue-200 dark:border-blue-800/50">
            <FileText className="mr-1 h-3 w-3" /> 민사
          </Badge>
        );
      case "payment_order":
        return (
          <Badge className="bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-800/50 border border-purple-200 dark:border-purple-800/50">
            <CreditCard className="mr-1 h-3 w-3" /> 지급명령
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
        icon = <Clock className="mr-1 h-3 w-3" />;
        bgClass = "bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-800/50";
        textClass = "text-blue-700 dark:text-blue-300";
        borderClass = "border-blue-200 dark:border-blue-800/50";
        break;
      case "pending":
        icon = <AlertCircle className="mr-1 h-3 w-3" />;
        bgClass = "bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-800/50";
        textClass = "text-amber-700 dark:text-amber-300";
        borderClass = "border-amber-200 dark:border-amber-800/50";
        break;
      case "closed":
        icon = <Check className="mr-1 h-3 w-3" />;
        bgClass = "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700";
        textClass = "text-gray-700 dark:text-gray-300";
        borderClass = "border-gray-200 dark:border-gray-700";
        break;
      default:
        icon = null;
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

  const formatCurrency = (amount) => {
    if (!amount) return "0원";
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 dark:from-gray-100 dark:via-gray-200 dark:to-gray-300 bg-clip-text text-transparent">
              사건 관리
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              민사소송 및 채권관리 사건 목록입니다
            </p>
          </div>

          <div className="flex items-center gap-2">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Input
                type="search"
                placeholder="사건번호, 법원명, 내용 검색..."
                className="w-[250px] pl-9 bg-white/90 dark:bg-gray-900/80 border-gray-200 dark:border-gray-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </form>

            <Button
              variant="outline"
              size="icon"
              onClick={fetchCases}
              className="bg-white/90 dark:bg-gray-900/80 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <RefreshCw className="h-4 w-4 text-gray-500" />
            </Button>

            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-white/90 dark:bg-gray-900/80 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  필터
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[300px]">
                <SheetHeader>
                  <SheetTitle>필터 설정</SheetTitle>
                  <SheetDescription>사건 목록 필터링 옵션을 설정하세요</SheetDescription>
                </SheetHeader>

                <div className="py-6 space-y-4">
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

            <Link href="/cases/new">
              <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-0 shadow-sm">
                <PlusCircle className="h-4 w-4 mr-2" />
                신규 등록
              </Button>
            </Link>
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
                    <TableHead className="w-[180px]">사건번호</TableHead>
                    <TableHead>내용</TableHead>
                    <TableHead>당사자</TableHead>
                    <TableHead>유형</TableHead>
                    <TableHead>금액</TableHead>
                    <TableHead>법원</TableHead>
                    <TableHead>상태</TableHead>
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
                      <TableCell className="font-medium">{caseItem.case_number || "-"}</TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {caseItem.case_info || "제목 없음"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            {caseItem.plaintiff || caseItem.creditor || "-"}
                          </span>
                          <span className="text-gray-400 dark:text-gray-500">
                            vs. {caseItem.defendant || caseItem.debtor || "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getCaseTypeBadge(caseItem.case_type)}</TableCell>
                      <TableCell>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {formatCurrency(caseItem.principal_amount)}
                        </span>
                      </TableCell>
                      <TableCell>{caseItem.court_name || "-"}</TableCell>
                      <TableCell>
                        {getCaseStatusBadge(caseItem.status, caseItem.status_info?.color)}
                      </TableCell>
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
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                총 {totalCases}개 중 {(page - 1) * pageSize + 1}-
                {Math.min(page * pageSize, totalCases)}개 표시
              </div>
              <Pagination>
                <PaginationContent>
                  {page > 1 && (
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(page - 1)}
                        className="cursor-pointer"
                      />
                    </PaginationItem>
                  )}
                  {Array.from({ length: Math.min(5, Math.ceil(totalCases / pageSize)) }, (_, i) => {
                    const pageNumber = i + 1;
                    const isVisible =
                      pageNumber === 1 ||
                      pageNumber === Math.ceil(totalCases / pageSize) ||
                      (pageNumber >= page - 1 && pageNumber <= page + 1);

                    if (!isVisible && pageNumber === 2) {
                      return (
                        <PaginationItem key="ellipsis-start">
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }

                    if (!isVisible && pageNumber === Math.ceil(totalCases / pageSize) - 1) {
                      return (
                        <PaginationItem key="ellipsis-end">
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }

                    if (isVisible) {
                      return (
                        <PaginationItem key={pageNumber}>
                          <PaginationLink
                            isActive={pageNumber === page}
                            onClick={() => handlePageChange(pageNumber)}
                            className={cn(
                              "cursor-pointer",
                              pageNumber === page ? "bg-blue-500 text-white hover:bg-blue-600" : ""
                            )}
                          >
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }

                    return null;
                  })}
                  {page < Math.ceil(totalCases / pageSize) && (
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => handlePageChange(page + 1)}
                        className="cursor-pointer"
                      />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
