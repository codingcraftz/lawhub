"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { supabase } from "@/utils/supabase";
import { getStatusByValue, getCaseTypeByValue, getDebtCategoryByValue } from "@/utils/constants";
import { format } from "date-fns";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Briefcase,
  ChevronDown,
  Search,
  GanttChartSquare,
  Timer,
  Hourglass,
  CheckCircle2,
  AlertCircle,
  Scale,
  CircleDollarSign,
  ChevronRight,
  MoreHorizontal,
  ExternalLink,
  FileSpreadsheet,
  ListFilter,
  Bell,
  X,
} from "lucide-react";
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
  DialogClose,
} from "@/components/ui/dialog";

// LawsuitManager와 RecoveryActivities 컴포넌트 가져오기
const LawsuitManager = dynamic(() => import("@/app/cases/[id]/components/LawsuitManager"), {
  loading: () => <p>소송 정보를 불러오는 중...</p>,
  ssr: false,
});

const RecoveryActivities = dynamic(() => import("@/app/cases/[id]/components/RecoveryActivities"), {
  loading: () => <p>채권 정보를 불러오는 중...</p>,
  ssr: false,
});

export function StaffCasesTable({
  cases = [],
  personalCases = [],
  organizationCases = [],
  selectedTab = "personal",
  statusFilter = "all",
  searchTerm = "",
  onSearchChange,
  onStatusChange,
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  casesPerPage = 10,
  onPageChange,
  onPageSizeChange,
  formatCurrency,
  onRefreshData,
  kcbFilter = "all",
  notificationFilter = "all",
  onKcbFilterChange,
  onNotificationFilterChange,
}) {
  console.log("StaffCasesTable cases:", cases.length, "statusFilter:", statusFilter);
  const router = useRouter();
  const [filteredCases, setFilteredCases] = useState(cases);
  const [inputSearchTerm, setInputSearchTerm] = useState(searchTerm);

  useEffect(() => {
    console.log("CasesTable props:", {
      casesLength: cases.length,
      personalCasesLength: personalCases.length,
      searchTerm,
      currentPage,
      totalPages,
      statusFilter,
      kcbFilter,
      notificationFilter,
      onPageChange: !!onPageChange,
      casesPerPage,
    });
  }, [
    cases,
    personalCases,
    searchTerm,
    currentPage,
    totalPages,
    statusFilter,
    kcbFilter,
    notificationFilter,
    onPageChange,
    casesPerPage,
  ]);

  // cases props가 변경되면 바로 적용
  useEffect(() => {
    setFilteredCases(cases);
  }, [cases]);

  // searchTerm prop이 변경될 때 입력 필드 업데이트
  useEffect(() => {
    setInputSearchTerm(searchTerm);
  }, [searchTerm]);

  // 검색 핸들러 - 검색 버튼 클릭 또는 엔터 키 입력 시 실행
  const handleSearch = () => {
    if (onSearchChange) {
      onSearchChange(inputSearchTerm);
    }
  };

  // 엔터 키 처리
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // 상태에 따른 배지 색상
  const getCaseStatusBadge = (status) => {
    // 상태값이 없는 경우 기본값 처리
    if (!status) {
      return (
        <Badge className="border bg-gray-100 text-gray-700 border-gray-200 text-xs whitespace-nowrap min-w-[65px] flex justify-center py-1">
          <AlertCircle className="mr-1 h-3 w-3" />알 수 없음
        </Badge>
      );
    }

    const statusInfo = getStatusByValue(status);
    let IconComponent = null;
    switch (statusInfo.icon) {
      case "Timer":
        IconComponent = Timer;
        break;
      case "Hourglass":
        IconComponent = Hourglass;
        break;
      case "CheckCircle2":
        IconComponent = CheckCircle2;
        break;
      case "AlertCircle":
      default:
        IconComponent = AlertCircle;
        break;
    }

    return (
      <Badge
        className={cn(
          "text-xs whitespace-nowrap min-w-[65px] flex justify-center py-1 border",
          statusInfo.className
        )}
      >
        <IconComponent className="mr-1 h-3 w-3" />
        {statusInfo.name}
      </Badge>
    );
  };

  const [showLawsuitModal, setShowLawsuitModal] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [selectedCaseTitle, setSelectedCaseTitle] = useState("");
  const [modalRefreshNeeded, setModalRefreshNeeded] = useState(false);

  const handleMenuAction = (action, caseItem, e) => {
    e.stopPropagation(); // 이벤트 버블링 방지

    switch (action) {
      case "detail":
        router.push(`/cases/${caseItem.id}`);
        break;
      case "lawsuit":
        setSelectedCaseId(caseItem.id);
        setSelectedCaseTitle(`${caseItem.creditor_name} vs ${caseItem.debtor_name}`);
        setShowLawsuitModal(true);
        break;
      case "recovery":
        setSelectedCaseId(caseItem.id);
        setSelectedCaseTitle(`${caseItem.creditor_name} vs ${caseItem.debtor_name}`);
        setShowRecoveryModal(true);
        break;
      default:
        break;
    }
  };

  // 상태별 카운트 계산
  const activeCasesCount = personalCases.filter(
    (c) => c.status === "active" || c.status === "in_progress" || c.status === "pending"
  ).length;

  const completedCasesCount = personalCases.filter(
    (c) => c.status === "completed" || c.status === "closed"
  ).length;

  const handleModalClose = (refreshNeeded = false) => {
    if (refreshNeeded || modalRefreshNeeded) {
      console.log("모달이 닫히면서 데이터 새로고침 실행");
      onRefreshData && onRefreshData();
      setModalRefreshNeeded(false);
    }
  };

  const handleDataChange = () => {
    console.log("데이터 변경 감지됨");
    setModalRefreshNeeded(true);
  };

  const handleOpenLawsuitModal = (caseData) => {
    setSelectedCaseId(caseData.id);
    setSelectedCaseTitle(`${caseData.creditor_name} vs ${caseData.debtor_name}`);
    setShowLawsuitModal(true);
  };

  const handleOpenRecoveryModal = (caseData) => {
    setSelectedCaseId(caseData.id);
    setSelectedCaseTitle(`${caseData.creditor_name} vs ${caseData.debtor_name}`);
    setShowRecoveryModal(true);
  };

  const calculateCasesCount = () => {
    return totalItems;
  };

  const casesCount = calculateCasesCount();

  // 페이지네이션 컴포넌트
  function Pagination({ currentPage, totalPages, onPageChange }) {
    // 시작 페이지와 끝 페이지 계산
    const maxPages = 5; // 페이지네이터에 표시할 최대 페이지 수
    let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(totalPages, startPage + maxPages - 1);

    // 최소 maxPages 페이지를 표시하도록 조정
    if (endPage - startPage + 1 < maxPages) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    // 페이지 배열 생성
    const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

    console.log("Pagination - current:", currentPage, "total:", totalPages, "pages:", pages);

    // 페이지 변경 핸들러
    const handlePageClick = (page, e) => {
      e.preventDefault();

      // 현재 페이지와 같은 페이지를 클릭한 경우 아무것도 하지 않음
      if (page === currentPage) {
        console.log("이미 현재 페이지입니다:", page);
        return;
      }

      // 페이지 범위 체크
      if (page < 1 || page > totalPages) {
        console.error("유효하지 않은 페이지 번호:", page);
        return;
      }

      // onPageChange가 존재하면 호출
      if (typeof onPageChange === "function") {
        console.log("페이지 클릭:", page);
        try {
          onPageChange(page);
        } catch (error) {
          console.error("페이지 변경 중 오류 발생:", error);
          toast.error("페이지 변경 중 오류가 발생했습니다", {
            description: "잠시 후 다시 시도해주세요.",
          });
        }
      } else {
        console.warn("페이지 변경 핸들러가 없습니다");
      }
    };

    return (
      <div className="flex items-center justify-center mt-4 gap-1">
        {/* 처음 페이지로 버튼 */}
        <button
          onClick={(e) => handlePageClick(1, e)}
          disabled={currentPage === 1}
          className={`w-8 h-8 flex items-center justify-center rounded ${
            currentPage === 1
              ? "text-gray-400 cursor-not-allowed"
              : "text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
        >
          <svg
            className="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L6.414 9H17a1 1 0 010 2H6.414l3.293 3.293a1 1 0 01-1.414 1.414z"
              clipRule="evenodd"
            ></path>
          </svg>
        </button>

        {/* 이전 페이지 버튼 */}
        <button
          onClick={(e) => handlePageClick(currentPage - 1, e)}
          disabled={currentPage === 1}
          className={`w-8 h-8 flex items-center justify-center rounded ${
            currentPage === 1
              ? "text-gray-400 cursor-not-allowed"
              : "text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
        >
          <svg
            className="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            ></path>
          </svg>
        </button>

        {/* 페이지 숫자 버튼 */}
        {pages.map((page) => (
          <button
            key={page}
            onClick={(e) => handlePageClick(page, e)}
            className={`w-8 h-8 flex items-center justify-center rounded ${
              currentPage === page
                ? "bg-blue-500 text-white"
                : "text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            {page}
          </button>
        ))}

        {/* 다음 페이지 버튼 */}
        <button
          onClick={(e) => handlePageClick(currentPage + 1, e)}
          disabled={currentPage === totalPages}
          className={`w-8 h-8 flex items-center justify-center rounded ${
            currentPage === totalPages
              ? "text-gray-400 cursor-not-allowed"
              : "text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
        >
          <svg
            className="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            ></path>
          </svg>
        </button>

        {/* 마지막 페이지로 버튼 */}
        <button
          onClick={(e) => handlePageClick(totalPages, e)}
          disabled={currentPage === totalPages}
          className={`w-8 h-8 flex items-center justify-center rounded ${
            currentPage === totalPages
              ? "text-gray-400 cursor-not-allowed"
              : "text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
        >
          <svg
            className="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L13.586 11H3a1 1 0 010-2h10.586l-3.293-3.293a1 1 0 010-1.414z"
              clipRule="evenodd"
            ></path>
          </svg>
        </button>
      </div>
    );
  }

  return (
    <>
      <Card className="border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-md">
        <CardHeader className="pb-3">
          <div className="flex flex-col space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg flex items-center">
                  <Briefcase className="h-5 w-5 mr-2 text-primary" /> 사건 목록
                </CardTitle>
                <CardDescription>
                  총 {totalItems}건 중 {cases.length}건 표시
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-auto flex items-center">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <Input
                  placeholder="당사자 이름으로 검색"
                  value={inputSearchTerm}
                  onChange={(e) => setInputSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-9 w-full sm:w-[200px]"
                />
                <Button variant="default" size="sm" onClick={handleSearch} className="ml-2">
                  검색
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => onStatusChange && onStatusChange("all")}
                className="flex items-center gap-1 h-8 px-2 text-xs sm:text-sm flex-1 sm:flex-none"
              >
                <ListFilter className="h-4 w-4 sm:mr-1 hidden sm:inline" />
                상태: 전체
              </Button>
              <Button
                variant={statusFilter === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => onStatusChange && onStatusChange("active")}
                className="flex items-center gap-1 h-8 px-2 text-xs sm:text-sm flex-1 sm:flex-none"
              >
                <Timer className="h-4 w-4 sm:mr-1 hidden sm:inline" />
                진행중
              </Button>
              <Button
                variant={statusFilter === "completed" ? "default" : "outline"}
                size="sm"
                onClick={() => onStatusChange && onStatusChange("completed")}
                className="flex items-center gap-1 h-8 px-2 text-xs sm:text-sm flex-1 sm:flex-none"
              >
                <CheckCircle2 className="h-4 w-4 sm:mr-1 hidden sm:inline" />
                완료
              </Button>

              <Select
                value={kcbFilter}
                onValueChange={(value) => onKcbFilterChange && onKcbFilterChange(value)}
              >
                <SelectTrigger className="h-8 px-2 text-xs sm:text-sm w-[110px] sm:w-[120px]">
                  <span className="flex items-center gap-1">
                    <span className="hidden sm:inline">KCB 조회:</span>
                    <span className="sm:hidden">KCB:</span>
                    {kcbFilter === "all" && "전체"}
                    {kcbFilter === "yes" && (
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-600 border-green-200 text-xs"
                      >
                        Y
                      </Badge>
                    )}
                    {kcbFilter === "no" && (
                      <Badge
                        variant="outline"
                        className="bg-gray-50 text-gray-500 border-gray-200 text-xs"
                      >
                        N
                      </Badge>
                    )}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="yes">확인됨 (Y)</SelectItem>
                  <SelectItem value="no">미확인 (N)</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={notificationFilter}
                onValueChange={(value) =>
                  onNotificationFilterChange && onNotificationFilterChange(value)
                }
              >
                <SelectTrigger className="h-8 px-2 text-xs sm:text-sm w-[110px] sm:w-[130px]">
                  <span className="flex items-center gap-1">
                    <span className="hidden sm:inline">납부안내:</span>
                    <span className="sm:hidden">안내:</span>
                    {notificationFilter === "all" && "전체"}
                    {notificationFilter === "yes" && (
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-600 border-blue-200 text-xs"
                      >
                        Y
                      </Badge>
                    )}
                    {notificationFilter === "no" && (
                      <Badge
                        variant="outline"
                        className="bg-gray-50 text-gray-500 border-gray-200 text-xs"
                      >
                        N
                      </Badge>
                    )}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="yes">발송됨 (Y)</SelectItem>
                  <SelectItem value="no">미발송 (N)</SelectItem>
                </SelectContent>
              </Select>

              {/* 검색어 표시 및 취소 배지 추가 */}
              {searchTerm && (
                <div className="flex-1 sm:flex-none flex justify-end">
                  <Badge
                    variant="secondary"
                    className="ml-auto flex items-center gap-1 px-2 py-1 h-8"
                  >
                    <span>검색: {searchTerm}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 p-0 ml-1 hover:bg-gray-200 rounded-full"
                      onClick={() => {
                        setInputSearchTerm("");
                        onSearchChange && onSearchChange("");
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                </div>
              )}

              {/* KCB 필터 배지 */}
              {kcbFilter !== "all" && (
                <div className="flex-1 sm:flex-none flex justify-end">
                  <Badge
                    variant="secondary"
                    className="ml-auto flex items-center gap-1 px-2 py-1 h-8"
                  >
                    <span>KCB: {kcbFilter === "yes" ? "확인됨" : "미확인"}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 p-0 ml-1 hover:bg-gray-200 rounded-full"
                      onClick={() => onKcbFilterChange && onKcbFilterChange("all")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                </div>
              )}

              {/* 납부안내 필터 배지 */}
              {notificationFilter !== "all" && (
                <div className="flex-1 sm:flex-none flex justify-end">
                  <Badge
                    variant="secondary"
                    className="ml-auto flex items-center gap-1 px-2 py-1 h-8"
                  >
                    <span>납부안내: {notificationFilter === "yes" ? "발송됨" : "미발송"}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 p-0 ml-1 hover:bg-gray-200 rounded-full"
                      onClick={() =>
                        onNotificationFilterChange && onNotificationFilterChange("all")
                      }
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex flex-col items-center">
          <div className="overflow-x-auto w-full max-w-[1200px]">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <TableHead className="pl-4">상태</TableHead>
                  <TableHead>당사자</TableHead>
                  <TableHead>원리금</TableHead>
                  <TableHead>회수금</TableHead>
                  <TableHead className="hidden sm:table-cell text-center">회수율</TableHead>
                  <TableHead className="text-center">KCB조회</TableHead>
                  <TableHead className="text-center">납부안내</TableHead>
                  <TableHead className="text-center">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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
                      <TableCell className="py-3 pl-4">
                        {getCaseStatusBadge(caseItem.status)}
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex gap-2 justify-start">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center">
                              <Badge
                                variant="outline"
                                className="bg-blue-50 text-blue-600 border-blue-200 mr-2 text-xs font-medium px-1.5 w-[55px] text-center flex-shrink-0 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
                              >
                                채권자
                              </Badge>
                              <span className="text-sm truncate max-w-[190px]">
                                {caseItem.creditor_name || "-"}
                              </span>
                            </div>
                            <div className="items-center">
                              <Badge
                                variant="outline"
                                className="bg-destructive/10 text-destructive border-destructive/20 mr-2 text-xs font-medium px-1.5 w-[55px] text-center flex-shrink-0"
                              >
                                채무자
                              </Badge>
                              <span className="text-sm truncate max-w-[190px]">
                                {caseItem.debtor_name || "-"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="font-medium text-gray-900 dark:text-gray-100 text-sm md:text-base">
                          {formatCurrency(caseItem.principal_amount)}
                        </span>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="font-medium text-gray-700 dark:text-gray-300 text-sm md:text-base">
                          {formatCurrency(caseItem.recovered_amount)}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell py-3 ">
                        {(() => {
                          const recoveryRate =
                            caseItem.principal_amount && caseItem.recovered_amount
                              ? Math.round(
                                  (caseItem.recovered_amount / caseItem.principal_amount) * 100
                                )
                              : 0;

                          // 회수율에 따른 배지 색상 결정
                          let badgeClassName =
                            "bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
                          let progressColor = "bg-gray-200 dark:bg-gray-700";

                          if (recoveryRate > 0) {
                            badgeClassName =
                              "bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
                            progressColor = "bg-blue-500 dark:bg-blue-600";
                          }
                          if (recoveryRate >= 50) {
                            badgeClassName =
                              "bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800";
                            progressColor = "bg-amber-500 dark:bg-amber-600";
                          }
                          if (recoveryRate >= 80) {
                            badgeClassName =
                              "bg-green-50 text-green-600 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
                            progressColor = "bg-green-500 dark:bg-green-600";
                          }

                          return (
                            <div className="flex flex-col items-center">
                              <Badge
                                className={`${badgeClassName} text-xs min-w-[55px] flex justify-center mx-auto py-1 mb-1`}
                              >
                                {recoveryRate}%
                              </Badge>
                              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${progressColor}`}
                                  style={{ width: `${recoveryRate}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="text-center py-3">
                        {caseItem.debtor_kcb_checked ? (
                          <div className="flex flex-col items-center">
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-600 border-green-200 text-xs"
                            >
                              Y
                            </Badge>
                            <span className="text-[10px] text-muted-foreground mt-1">
                              {caseItem.debtor_kcb_checked_date
                                ? format(new Date(caseItem.debtor_kcb_checked_date), "yy.MM.dd")
                                : ""}
                            </span>
                          </div>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-gray-50 text-gray-500 border-gray-200 text-xs"
                          >
                            N
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center py-3">
                        {caseItem.debtor_payment_notification_sent ? (
                          <div className="flex flex-col items-center">
                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-blue-600 border-blue-200 text-xs"
                            >
                              Y
                            </Badge>
                            <span className="text-[10px] text-muted-foreground mt-1">
                              {caseItem.debtor_payment_notification_date
                                ? format(
                                    new Date(caseItem.debtor_payment_notification_date),
                                    "yy.MM.dd"
                                  )
                                : ""}
                            </span>
                          </div>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-gray-50 text-gray-500 border-gray-200 text-xs"
                          >
                            N
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center py-3 pr-4">
                        {/* 기존 메뉴 버튼 */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => e.stopPropagation()}
                              className="h-7 w-7 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                              title="더 보기"
                            >
                              <MoreHorizontal className="h-4 w-4 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={(e) => handleMenuAction("detail", caseItem, e)}
                              className="cursor-pointer"
                            >
                              <ExternalLink className="h-4 w-4 mr-2 text-blue-500" />
                              <span>상세페이지 이동</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => handleMenuAction("lawsuit", caseItem, e)}
                              className="cursor-pointer"
                            >
                              <Scale className="h-4 w-4 mr-2 text-indigo-500" />
                              <span>소송정보 보기</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => handleMenuAction("recovery", caseItem, e)}
                              className="cursor-pointer"
                            >
                              <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-500" />
                              <span>회수현황 보기</span>
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
          {/* 페이지네이션 영역 수정 */}
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 w-full max-w-[1200px]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-3">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                총 {totalItems}개 중{" "}
                {totalItems > 0 ? Math.min((currentPage - 1) * casesPerPage + 1, totalItems) : 0}-
                {Math.min(currentPage * casesPerPage, totalItems)}개 표시 (페이지: {currentPage}/
                {totalPages})
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="flex justify-center flex-1 sm:flex-none">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={onPageChange}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 소송 정보 모달 */}
      <Dialog
        open={showLawsuitModal}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            console.log("소송 정보 모달 닫힘");
            handleModalClose(true); // 항상 새로고침 실행하도록 변경
          }
          setShowLawsuitModal(isOpen);
        }}
      >
        <DialogContent className="max-w-[95vw] w-[1200px] max-h-[90vh] h-[800px] p-6 overflow-hidden">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Scale className="h-5 w-5 text-indigo-500" />
              <span>소송 정보: {selectedCaseTitle}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto pr-2" style={{ maxHeight: "calc(800px - 100px)" }}>
            {selectedCaseId && (
              <LawsuitManager caseId={selectedCaseId} onDataChange={handleDataChange} />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 채권 정보 모달 */}
      <Dialog
        open={showRecoveryModal}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            console.log("채권 정보 모달 닫힘");
            handleModalClose(true); // 항상 새로고침 실행하도록 변경
          }
          setShowRecoveryModal(isOpen);
        }}
      >
        <DialogContent className="max-w-[95vw] w-[1200px] max-h-[90vh] h-[800px] p-6 overflow-hidden">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
              <span>채권 정보: {selectedCaseTitle}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto pr-2" style={{ maxHeight: "calc(800px - 100px)" }}>
            {selectedCaseId && (
              <RecoveryActivities caseId={selectedCaseId} onDataChange={handleDataChange} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
