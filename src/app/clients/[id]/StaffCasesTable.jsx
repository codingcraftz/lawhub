"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { supabase } from "@/utils/supabase";
import { getStatusByValue, getCaseTypeByValue, getDebtCategoryByValue } from "@/utils/constants";
import { format } from "date-fns";

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
  searchTerm = "",
  onSearchChange,
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  casesPerPage = 10,
  onPageChange,
  formatCurrency,
  notifications = [],
}) {
  console.log("cases", cases);
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("all");
  const [filteredCases, setFilteredCases] = useState(cases);

  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [selectedCaseNotifications, setSelectedCaseNotifications] = useState([]);
  const [selectedCaseForNotification, setSelectedCaseForNotification] = useState(null);
  const [updatingNotification, setUpdatingNotification] = useState(false);

  useEffect(() => {
    console.log("CasesTable props:", {
      casesLength: cases.length,
      searchTerm,
      currentPage,
      totalPages,
      onPageChange: !!onPageChange,
      casesPerPage,
    });
  }, [cases, searchTerm, currentPage, totalPages, onPageChange, casesPerPage]);

  useEffect(() => {
    let filtered = cases;

    if (statusFilter !== "all") {
      filtered = filtered.filter((caseItem) => {
        if (statusFilter === "active") {
          return (
            caseItem.status === "active" ||
            caseItem.status === "in_progress" ||
            caseItem.status === "pending"
          );
        } else if (statusFilter === "completed") {
          return caseItem.status === "completed" || caseItem.status === "closed";
        }
        return true;
      });
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          (c.creditor_name && c.creditor_name.toLowerCase().includes(term)) ||
          (c.debtor_name && c.debtor_name.toLowerCase().includes(term))
      );
    }

    setFilteredCases(filtered);
  }, [cases, statusFilter, searchTerm]);

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

  const activeCasesCount = cases.filter(
    (c) => c.status === "active" || c.status === "in_progress" || c.status === "pending"
  ).length;

  const completedCasesCount = cases.filter(
    (c) => c.status === "completed" || c.status === "closed"
  ).length;

  const handleNotificationClick = (e, caseItem) => {
    e.stopPropagation(); // 이벤트 버블링 방지
    const caseNotifications = notifications.filter(
      (notification) => notification.case_id === caseItem.id
    );
    setSelectedCaseForNotification(caseItem);
    setSelectedCaseNotifications(caseNotifications);
    setShowNotificationModal(true);
  };

  const getUnreadNotificationCount = (caseId) => {
    return notifications.filter(
      (notification) => notification.case_id === caseId && !notification.is_read
    ).length;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "lawsuit":
      case "lawsuit_update":
        return <Scale className="h-4 w-4 text-purple-500" />;
      case "recovery_activity":
        return <CircleDollarSign className="h-4 w-4 text-green-500" />;
      case "deadline":
        return <Timer className="h-4 w-4 text-red-500" />;
      case "document":
        return <FileText className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleMarkAsRead = async (e, notificationId) => {
    e.stopPropagation();
    setUpdatingNotification(true);

    try {
      const { error } = await supabase
        .from("test_case_notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (error) throw error;

      // 로컬 상태 업데이트
      setSelectedCaseNotifications((prev) =>
        prev.map((notif) => (notif.id === notificationId ? { ...notif, is_read: true } : notif))
      );

      console.log("알림이 읽음으로 표시되었습니다:", notificationId);
    } catch (error) {
      console.error("알림 상태 업데이트 실패:", error);
    } finally {
      setUpdatingNotification(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!selectedCaseForNotification) return;
    setUpdatingNotification(true);

    try {
      const notificationIds = selectedCaseNotifications.filter((n) => !n.is_read).map((n) => n.id);
      if (notificationIds.length === 0) return;

      const { error } = await supabase
        .from("test_case_notifications")
        .update({ is_read: true })
        .in("id", notificationIds);

      if (error) throw error;
      setSelectedCaseNotifications((prev) => prev.map((notif) => ({ ...notif, is_read: true })));

      console.log("모든 알림이 읽음으로 표시되었습니다");
    } catch (error) {
      console.error("알림 상태 업데이트 실패:", error);
    } finally {
      setUpdatingNotification(false);
    }
  };

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
                  총 {selectedTab === "personal" ? personalCases.length : organizationCases.length}
                  건 중 {filteredCases.length}건 표시
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-auto">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <Input
                  placeholder="당사자 이름으로 검색"
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-9 w-full sm:w-[200px]"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
                className="flex items-center gap-1 h-8 px-2 text-xs sm:text-sm flex-1 sm:flex-none"
              >
                <ListFilter className="h-4 w-4 sm:mr-1 hidden sm:inline" />
                전체 ({cases.length})
              </Button>
              <Button
                variant={statusFilter === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("active")}
                className="flex items-center gap-1 h-8 px-2 text-xs sm:text-sm flex-1 sm:flex-none"
              >
                <Timer className="h-4 w-4 sm:mr-1 hidden sm:inline" />
                진행중 ({activeCasesCount})
              </Button>
              <Button
                variant={statusFilter === "completed" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("completed")}
                className="flex items-center gap-1 h-8 px-2 text-xs sm:text-sm flex-1 sm:flex-none"
              >
                <CheckCircle2 className="h-4 w-4 sm:mr-1 hidden sm:inline" />
                완료 ({completedCasesCount})
              </Button>
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
                  <TableHead className="text-center">알림</TableHead>
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
                  filteredCases
                    .slice((currentPage - 1) * casesPerPage, currentPage * casesPerPage)
                    .map((caseItem) => (
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
                          {console.log("test", caseItem)}
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
                        <TableCell className="text-center py-3">
                          {/* 알림 버튼 */}
                          {getUnreadNotificationCount(caseItem.id) > 0 ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => handleNotificationClick(e, caseItem)}
                              className="h-7 w-7 rounded-full bg-amber-100 hover:bg-amber-200 relative border border-amber-300 animate-pulse"
                            >
                              <Bell className="h-4 w-4 text-amber-600" />
                              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-[10px] text-white rounded-full flex items-center justify-center font-bold shadow-sm">
                                {getUnreadNotificationCount(caseItem.id)}
                              </span>
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => handleNotificationClick(e, caseItem)}
                              className="h-7 w-7 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
                              title="알림 보기"
                            >
                              <Bell className="h-4 w-4" />
                            </Button>
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
                                <span>채권정보 보기</span>
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
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => {
                        const newPage = currentPage - 1;
                        console.log("이전 페이지로 이동:", newPage);
                        if (onPageChange) {
                          onPageChange(newPage);
                        }
                      }}
                    >
                      이전
                    </Button>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum = 0;
                      if (totalPages <= 5) {
                        // 총 페이지가 5 이하면 그대로 표시
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        // 현재 페이지가 앞쪽에 있을 때
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        // 현재 페이지가 뒤쪽에 있을 때
                        pageNum = totalPages - 4 + i;
                      } else {
                        // 현재 페이지가 중간에 있을 때
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            console.log("페이지 변경:", pageNum);
                            if (onPageChange) {
                              onPageChange(pageNum);
                            }
                          }}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages || totalPages === 0}
                      onClick={() => {
                        const newPage = currentPage + 1;
                        console.log("다음 페이지로 이동:", newPage);
                        if (onPageChange) {
                          onPageChange(newPage);
                        }
                      }}
                    >
                      다음
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 소송 정보 모달 */}
      <Dialog open={showLawsuitModal} onOpenChange={setShowLawsuitModal}>
        <DialogContent className="max-w-[95vw] w-[1200px] max-h-[90vh] h-[800px] p-6 overflow-hidden">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Scale className="h-5 w-5 text-indigo-500" />
              <span>소송 정보: {selectedCaseTitle}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto pr-2" style={{ maxHeight: "calc(800px - 100px)" }}>
            {selectedCaseId && <LawsuitManager caseId={selectedCaseId} />}
          </div>
        </DialogContent>
      </Dialog>

      {/* 채권 정보 모달 */}
      <Dialog open={showRecoveryModal} onOpenChange={setShowRecoveryModal}>
        <DialogContent className="max-w-[95vw] w-[1200px] max-h-[90vh] h-[800px] p-6 overflow-hidden">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
              <span>채권 정보: {selectedCaseTitle}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto pr-2" style={{ maxHeight: "calc(800px - 100px)" }}>
            {selectedCaseId && <RecoveryActivities caseId={selectedCaseId} />}
          </div>
        </DialogContent>
      </Dialog>

      {/* 알림 정보 모달 */}
      <Dialog open={showNotificationModal} onOpenChange={setShowNotificationModal}>
        <DialogContent className="max-w-[95vw] w-[600px] max-h-[90vh] h-auto">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Bell className="h-5 w-5 text-amber-500" />
              <span>
                알림 정보: {selectedCaseForNotification?.creditor_name} vs{" "}
                {selectedCaseForNotification?.debtor_name}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto pr-2" style={{ maxHeight: "calc(90vh - 150px)" }}>
            {selectedCaseNotifications && selectedCaseNotifications.length > 0 ? (
              <div className="space-y-3">
                {selectedCaseNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 border rounded-md transition-colors",
                      notification.is_read
                        ? "bg-white dark:bg-gray-900"
                        : "bg-blue-50 dark:bg-blue-900/10"
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
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                          {notification.message}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">
                            {new Date(notification.created_at).toLocaleString("ko-KR", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <div className="flex gap-1">
                            {!notification.is_read && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs px-2"
                                onClick={(e) => handleMarkAsRead(e, notification.id)}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> 읽음
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs px-2"
                              onClick={() => {
                                setShowNotificationModal(false);
                                router.push(`/cases/${notification.case_id}`);
                              }}
                            >
                              <ChevronRight className="h-3.5 w-3.5 mr-1" /> 보기
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500">
                <Bell className="h-10 w-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                <p>이 사건에 대한 알림이 없습니다.</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            {selectedCaseNotifications && selectedCaseNotifications.some((n) => !n.is_read) && (
              <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                <CheckCircle2 className="h-4 w-4 mr-1" /> 모두 읽음 표시
              </Button>
            )}
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                setShowNotificationModal(false);
                router.push(`/cases/${selectedCaseForNotification?.id}`);
              }}
            >
              <ExternalLink className="h-4 w-4 mr-1" /> 사건 페이지로 이동
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
