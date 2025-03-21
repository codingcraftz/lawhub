"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { useUser } from "@/contexts/UserContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getStatusById } from "@/utils/constants";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Briefcase,
  Search,
  UserPlus,
  UserMinus,
  CheckCircle2,
  AlertCircle,
  X,
  Users,
  User,
  Building2,
  FileText,
  Shield,
  ExternalLink,
  UserCog,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function CaseHandlersPage() {
  const router = useRouter();
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState([]);
  const [handlers, setHandlers] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [handlerSearchTerm, setHandlerSearchTerm] = useState("");
  const [filteredCases, setFilteredCases] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [showAddHandlerModal, setShowAddHandlerModal] = useState(false);
  const [showRemoveHandlerModal, setShowRemoveHandlerModal] = useState(false);
  const [selectedHandler, setSelectedHandler] = useState(null);
  const [handlerToRemove, setHandlerToRemove] = useState(null);
  const [staffTypeFilter, setStaffTypeFilter] = useState("all");
  const [caseStatusFilter, setCaseStatusFilter] = useState("all");
  const [handlerTypeFilter, setHandlerTypeFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("handlers");
  const [isFetchingCases, setIsFetchingCases] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [staffCurrentPage, setStaffCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // 페이지 로드 시 데이터 가져오기
  useEffect(() => {
    if (user && user.role === "admin") {
      // 직원 정보와 담당자 정보만 초기에 가져옴
      fetchStaffUsers();
      fetchHandlers();
    } else {
      // 관리자가 아닌 경우 접근 제한
      router.push("/unauthorized");
    }
  }, [user, router]);

  // 사건 목록 가져오기 - 검색 시에만 호출
  const fetchCases = async () => {
    setLoading(true);
    try {
      console.log("담당자 관리 페이지 - 사건 정보 로딩 중...");

      // 모든 사건 가져오기
      const { data: casesData, error: casesError } = await supabase
        .from("test_cases")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (casesError) throw casesError;

      // 담당자 정보 가져오기
      const { data: handlersData, error: handlersError } = await supabase
        .from("test_case_handlers")
        .select("case_id, user_id, user:user_id(id, name, profile_image)");

      if (handlersError) throw handlersError;

      // 모든 사건 정보에 담당자 정보와 상태 정보 추가하기
      const casesWithHandlers = casesData.map((caseItem) => {
        // 담당자 정보 추가
        const handlers = handlersData.filter((h) => h.case_id === caseItem.id) || [];

        // status_id로 상태 정보 가져오기
        let statusInfo = { name: "알 수 없음", color: "#999999" };
        if (caseItem.status_id) {
          statusInfo = getStatusById(caseItem.status_id);
        }

        return {
          ...caseItem,
          handlers: handlers.map((h) => h.user),
          status_info: {
            name: statusInfo.name,
            color: statusInfo.color,
          },
        };
      });

      setCases(casesWithHandlers);
      setFilteredCases(casesWithHandlers);
      setTotalItems(casesWithHandlers.length);
      setTotalPages(Math.ceil(casesWithHandlers.length / itemsPerPage));
    } catch (error) {
      console.error("사건 정보 로딩 실패:", error);
      toast.error("사건 정보를 불러오는데 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  // 담당자 정보 가져오기
  const fetchHandlers = async () => {
    try {
      const { data: handlersData, error: handlersError } = await supabase
        .from("test_case_handlers")
        .select("*, user:user_id(id, name, email, profile_image, role, employee_type)");

      if (handlersError) throw handlersError;
      setHandlers(handlersData || []);
    } catch (error) {
      console.error("담당자 정보 가져오기 실패:", error);
      toast.error("담당자 정보를 불러오는데 실패했습니다");
    }
  };

  // 직원 사용자 목록 가져오기
  const fetchStaffUsers = async () => {
    try {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("role", "staff");

      if (userError) throw userError;
      setStaffUsers(userData || []);
      setFilteredStaff(userData || []);

      // 직원 목록을 가져오면 로딩 상태 종료
      setLoading(false);
    } catch (error) {
      console.error("직원 목록 가져오기 실패:", error);
      toast.error("직원 목록을 불러오는데 실패했습니다");
      setLoading(false);
    }
  };

  // 사건 검색 필터링
  useEffect(() => {
    if (cases.length === 0) return;

    let filtered = [...cases];

    // 검색어 필터링
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          (c.creditor_name && c.creditor_name.toLowerCase().includes(term)) ||
          (c.debtor_name && c.debtor_name.toLowerCase().includes(term)) ||
          (c.case_number && c.case_number.toLowerCase().includes(term))
      );
    }

    // 상태 필터링
    if (caseStatusFilter !== "all") {
      filtered = filtered.filter((c) => {
        if (caseStatusFilter === "active") {
          return c.status === "active" || c.status === "in_progress" || c.status === "pending";
        } else if (caseStatusFilter === "completed") {
          return c.status === "closed" || c.status === "completed";
        }
        return true;
      });
    }

    setFilteredCases(filtered);
  }, [cases, searchTerm, caseStatusFilter]);

  // 직원 검색 필터링
  useEffect(() => {
    if (staffUsers.length === 0) return;

    let filtered = [...staffUsers];

    // 검색어 필터링
    if (handlerSearchTerm.trim()) {
      const term = handlerSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          (user.name && user.name.toLowerCase().includes(term)) ||
          (user.email && user.email.toLowerCase().includes(term))
      );
    }

    // 직원 유형 필터링
    if (staffTypeFilter !== "all") {
      filtered = filtered.filter((user) => user.employee_type === staffTypeFilter);
    }

    setFilteredStaff(filtered);
    setStaffCurrentPage(1); // 필터링 결과가 변경되면 첫 페이지로 이동
  }, [staffUsers, handlerSearchTerm, staffTypeFilter]);

  // 상태에 따른 배지 색상
  const getCaseStatusBadge = (status, statusInfo) => {
    if (statusInfo && statusInfo.color) {
      return (
        <Badge
          style={{ backgroundColor: statusInfo.color, color: "#fff" }}
          className="text-xs whitespace-nowrap"
        >
          {statusInfo.name || status}
        </Badge>
      );
    }

    let badgeClass = "";
    let icon = null;

    switch (status) {
      case "in_progress":
      case "active":
        badgeClass = "bg-blue-100 text-blue-700 border-blue-200";
        icon = <CheckCircle2 className="h-3 w-3 mr-1" />;
        return <Badge className={`${badgeClass} text-xs flex items-center`}>{icon}진행중</Badge>;
      case "pending":
        badgeClass = "bg-amber-100 text-amber-700 border-amber-200";
        icon = <AlertCircle className="h-3 w-3 mr-1" />;
        return <Badge className={`${badgeClass} text-xs flex items-center`}>{icon}대기중</Badge>;
      case "completed":
      case "closed":
        badgeClass = "bg-green-100 text-green-700 border-green-200";
        icon = <CheckCircle2 className="h-3 w-3 mr-1" />;
        return <Badge className={`${badgeClass} text-xs flex items-center`}>{icon}완료</Badge>;
      default:
        badgeClass = "bg-gray-100 text-gray-700 border-gray-200";
        return <Badge className={`${badgeClass} text-xs`}>{status}</Badge>;
    }
  };

  // 담당자 유형에 따른 배지
  const getHandlerTypeBadge = (employeeType) => {
    switch (employeeType) {
      case "internal":
        return (
          <Badge className="bg-blue-100 text-blue-700 border border-blue-200 text-xs">
            <Building2 className="h-3 w-3 mr-1" />
            내부직원
          </Badge>
        );
      case "external":
        return (
          <Badge className="bg-amber-100 text-amber-700 border border-amber-200 text-xs">
            <ExternalLink className="h-3 w-3 mr-1" />
            외부직원
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-700 border border-gray-200 text-xs">
            <User className="h-3 w-3 mr-1" />
            기타
          </Badge>
        );
    }
  };

  // 담당자 추가 모달 열기
  const handleOpenAddHandlerModal = (caseItem) => {
    setSelectedCase(caseItem);
    setShowAddHandlerModal(true);
  };

  // 담당자 제거 모달 열기
  const handleOpenRemoveHandlerModal = (caseItem, handler) => {
    setSelectedCase(caseItem);
    setHandlerToRemove(handler);
    setShowRemoveHandlerModal(true);
  };

  // 담당자 할당 처리
  const handleAssignHandler = async () => {
    if (!selectedCase || !selectedHandler) {
      toast.error("사건과 담당자를 모두 선택해주세요");
      return;
    }

    try {
      // 이미 담당자로 등록되어 있는지 확인
      const existingHandlers = handlers.filter(
        (h) => h.case_id === selectedCase.id && h.user_id === selectedHandler
      );

      if (existingHandlers.length > 0) {
        toast.error("이미 해당 사건의 담당자로 등록되어 있습니다");
        return;
      }

      // 새 담당자 등록
      const { error } = await supabase.from("test_case_handlers").insert({
        case_id: selectedCase.id,
        user_id: selectedHandler,
        role: "담당자",
      });

      if (error) throw error;

      toast.success("담당자가 성공적으로 등록되었습니다");
      fetchHandlers(); // 담당자 목록 갱신
      setShowAddHandlerModal(false);
      setSelectedHandler(null);
    } catch (error) {
      console.error("담당자 등록 실패:", error);
      toast.error("담당자 등록에 실패했습니다");
    }
  };

  // 빠른 담당자 할당 처리 (바로 선택한 직원 할당)
  const handleQuickAssign = async (caseItem, userId) => {
    if (!caseItem || !userId) {
      toast.error("사건과 담당자 정보가 필요합니다");
      return;
    }

    try {
      // 이미 담당자로 등록되어 있는지 확인
      const existingHandlers = handlers.filter(
        (h) => h.case_id === caseItem.id && h.user_id === userId
      );

      if (existingHandlers.length > 0) {
        toast.error("이미 해당 사건의 담당자로 등록되어 있습니다");
        return;
      }

      // 로딩 상태 표시
      toast.loading("담당자를 등록 중입니다...");

      // 새 담당자 등록
      const { error } = await supabase.from("test_case_handlers").insert({
        case_id: caseItem.id,
        user_id: userId,
        role: "담당자",
      });

      if (error) throw error;

      toast.dismiss();
      toast.success("담당자가 성공적으로 등록되었습니다");

      // 담당자 목록 갱신
      fetchHandlers();
    } catch (error) {
      toast.dismiss();
      console.error("담당자 등록 실패:", error);
      toast.error("담당자 등록에 실패했습니다");
    }
  };

  // 담당자 제거 처리
  const handleRemoveHandler = async () => {
    if (!handlerToRemove) {
      toast.error("제거할 담당자 정보가 없습니다");
      return;
    }

    try {
      const { error } = await supabase
        .from("test_case_handlers")
        .delete()
        .eq("id", handlerToRemove.id);

      if (error) throw error;

      toast.success("담당자가 성공적으로 제거되었습니다");
      fetchHandlers(); // 담당자 목록 갱신
      setShowRemoveHandlerModal(false);
      setHandlerToRemove(null);
    } catch (error) {
      console.error("담당자 제거 실패:", error);
      toast.error("담당자 제거에 실패했습니다");
    }
  };

  // 사건의 담당자 목록 가져오기
  const getCaseHandlers = (caseId) => {
    return handlers.filter((handler) => handler.case_id === caseId);
  };

  // 직원 유형을 한글로 변환
  const getEmployeeTypeText = (type) => {
    switch (type) {
      case "internal":
        return "내부직원";
      case "external":
        return "외부직원";
      default:
        return "미지정";
    }
  };

  // 탭 변경 핸들러
  const handleTabChange = (value) => {
    setActiveTab(value);
  };

  // 직원이 담당하는 사건 정보 가져오기
  const fetchStaffCases = async (caseIds) => {
    if (!caseIds || caseIds.length === 0) {
      setCases([]);
      setFilteredCases([]);
      return;
    }

    setIsFetchingCases(true);
    try {
      // 사건 정보 가져오기
      const { data: casesData, error: casesError } = await supabase
        .from("test_cases")
        .select("*, status_info:status_id(*)")
        .in("id", caseIds)
        .order("created_at", { ascending: false });

      if (casesError) throw casesError;

      // 각 사건의 당사자 정보 가져오기
      const caseParties = await enrichCasesWithPartyInfo(casesData || []);

      setCases(caseParties);
      setFilteredCases(caseParties);
    } catch (error) {
      console.error("담당 사건 정보 가져오기 실패:", error);
      toast.error("담당 사건 정보를 불러오는데 실패했습니다");
    } finally {
      setIsFetchingCases(false);
    }
  };

  // 사건 정보에 당사자 정보 추가 (담당 사건 목록용)
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

      // 이자 정보 가져오기
      const { data: interestsData, error: interestsError } = await supabase
        .from("test_case_interests")
        .select("*")
        .in("case_id", caseIds);

      if (interestsError) throw interestsError;

      // 당사자 정보와 원리금 정보로 사건 정보 보강
      return cases.map((caseItem) => {
        const caseParties = partiesData
          ? partiesData.filter((p) => p.case_id === caseItem.id) || []
          : [];

        const caseInterests = interestsData
          ? interestsData.filter((i) => i.case_id === caseItem.id) || []
          : [];

        const creditor = caseParties.find((p) =>
          ["creditor", "plaintiff", "applicant"].includes(p.party_type)
        );

        const debtor = caseParties.find((p) =>
          ["debtor", "defendant", "respondent"].includes(p.party_type)
        );

        // 원금 (principal_amount가 있으면 사용, 없으면 0)
        const principal = parseFloat(caseItem.principal_amount || 0);

        // 이자 계산
        let totalInterest = 0;

        // 간단한 이자 계산 (실제로는 더 복잡한 계산이 필요할 수 있음)
        caseInterests.forEach((interest) => {
          const rate = parseFloat(interest.rate || 0) / 100; // 비율로 변환
          // 원금에 이자율을 곱한 값을 이자로 간주 (실제로는 기간에 따른 계산 필요)
          totalInterest += principal * rate;
        });

        // 총 원리금 계산
        const totalDebt = principal + totalInterest;

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
          total_debt: totalDebt,
        };
      });
    } catch (err) {
      console.error("사건 정보 보강 실패:", err);
      return cases;
    }
  };

  // 원리금 금액 형식화
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return "0원";
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // 페이지네이션을 위한 현재 페이지 데이터 계산
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredCases.slice(startIndex, endIndex);
  };

  // 직원 목록의 페이지네이션을 위한 현재 페이지 데이터 계산
  const getCurrentStaffPageData = () => {
    const startIndex = (staffCurrentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredStaff.slice(startIndex, endIndex);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Card className="border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-md mb-6">
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-10 w-48" />
              </div>
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-80 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <Card className="border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-md mb-6">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <UserCog className="h-6 w-6 mr-2 text-primary" /> 사건 담당자 관리
          </CardTitle>
          <CardDescription>
            사건별 담당자를 추가하거나 제거할 수 있습니다. 외부직원은 담당으로 지정된 사건만 볼 수
            있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="handlers" className="flex items-center">
                <Users className="h-4 w-4 mr-2" /> 직원 목록 ({filteredStaff.length})
              </TabsTrigger>
              <TabsTrigger value="cases" className="flex items-center">
                <Briefcase className="h-4 w-4 mr-2" /> 사건 검색 결과 ({filteredCases.length})
              </TabsTrigger>
            </TabsList>

            {/* 직원 목록 탭 */}
            <TabsContent value="handlers">
              <div className="flex flex-col space-y-4">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="relative flex-1">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                    <Input
                      placeholder="직원 이름, 이메일로 검색"
                      value={handlerSearchTerm}
                      onChange={(e) => setHandlerSearchTerm(e.target.value)}
                      className="pl-9 w-full"
                    />
                  </div>
                  <Select value={staffTypeFilter} onValueChange={setStaffTypeFilter}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="직원 유형 필터" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">모든 직원</SelectItem>
                      <SelectItem value="internal">내부직원</SelectItem>
                      <SelectItem value="external">외부직원</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                        <TableHead className="w-[40%]">직원 정보</TableHead>
                        <TableHead className="w-[15%]">유형</TableHead>
                        <TableHead className="w-[35%]">담당 사건</TableHead>
                        <TableHead className="w-[10%] text-right">관리</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStaff.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                            <div className="flex flex-col items-center">
                              <Users className="h-8 w-8 mb-2 text-gray-300 dark:text-gray-600" />
                              <p>검색 결과가 없습니다.</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        getCurrentStaffPageData().map((staffUser) => {
                          const userHandlers = handlers.filter((h) => h.user_id === staffUser.id);
                          const handledCases = userHandlers
                            .map((h) => {
                              const caseInfo = cases.find((c) => c.id === h.case_id);
                              return caseInfo || null;
                            })
                            .filter(Boolean);

                          return (
                            <TableRow
                              key={staffUser.id}
                              className={cn(
                                "hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer",
                                selectedStaff?.id === staffUser.id
                                  ? "bg-blue-50 dark:bg-blue-900/10"
                                  : ""
                              )}
                              onClick={() => setSelectedStaff(staffUser)}
                            >
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar>
                                    <AvatarImage src={staffUser.profile_image} />
                                    <AvatarFallback className="bg-primary/10 text-primary">
                                      {staffUser.name?.charAt(0) || "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">{staffUser.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {staffUser.email}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {getHandlerTypeBadge(staffUser.employee_type || "internal")}
                              </TableCell>
                              <TableCell>
                                {handledCases.length === 0 ? (
                                  <div className="text-sm text-muted-foreground italic">
                                    담당 사건 없음
                                  </div>
                                ) : (
                                  <div className="flex flex-wrap gap-2">
                                    {handledCases.slice(0, 3).map((caseItem) => (
                                      <Badge
                                        key={caseItem.id}
                                        variant="outline"
                                        className="text-xs"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          router.push(`/cases/${caseItem.id}`);
                                        }}
                                      >
                                        {caseItem.case_number || "사건번호 미지정"}
                                      </Badge>
                                    ))}
                                    {handledCases.length > 3 && (
                                      <Badge variant="outline" className="text-xs bg-gray-50">
                                        +{handledCases.length - 3}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="outline" size="sm" className="text-xs h-8">
                                      관리 <ChevronDown className="h-3.5 w-3.5 ml-1" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(`/admin/users/edit?id=${staffUser.id}`);
                                      }}
                                    >
                                      <UserCog className="h-4 w-4 mr-2" />
                                      직원 정보 관리
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedStaff(staffUser);
                                        setActiveTab("cases");
                                        // 이 직원에 할당된 사건 리스트를 가져오기
                                        const staffCases = handlers
                                          .filter((h) => h.user_id === staffUser.id)
                                          .map((h) => h.case_id);
                                        if (staffCases.length > 0) {
                                          // 담당 사건 정보 가져오기
                                          fetchStaffCases(staffCases);
                                        } else {
                                          setCases([]);
                                          setFilteredCases([]);
                                          toast.info("담당 사건이 없습니다.");
                                        }
                                      }}
                                    >
                                      <Briefcase className="h-4 w-4 mr-2" />
                                      담당 사건 보기
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>

                {filteredStaff.length > 0 && (
                  <div className="flex justify-between items-center mt-4">
                    <div className="flex-1"></div>
                    <div>
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() =>
                                staffCurrentPage > 1 && setStaffCurrentPage(staffCurrentPage - 1)
                              }
                              className={cn(
                                staffCurrentPage <= 1 && "pointer-events-none opacity-50"
                              )}
                            />
                          </PaginationItem>

                          {Array.from(
                            { length: Math.min(5, Math.ceil(filteredStaff.length / itemsPerPage)) },
                            (_, i) => {
                              const pageNumber = i + 1;
                              const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);

                              // 페이지 번호 조정
                              let showNumber = pageNumber;

                              if (totalPages > 5) {
                                if (staffCurrentPage <= 3) {
                                  showNumber = pageNumber;
                                } else if (staffCurrentPage >= totalPages - 2) {
                                  showNumber = totalPages - 5 + pageNumber;
                                } else {
                                  showNumber = staffCurrentPage - 3 + pageNumber;
                                }

                                if (showNumber <= 0 || showNumber > totalPages) {
                                  return null;
                                }
                              }

                              return (
                                <PaginationItem key={showNumber}>
                                  <PaginationLink
                                    onClick={() => setStaffCurrentPage(showNumber)}
                                    isActive={staffCurrentPage === showNumber}
                                  >
                                    {showNumber}
                                  </PaginationLink>
                                </PaginationItem>
                              );
                            }
                          )}

                          {Math.ceil(filteredStaff.length / itemsPerPage) > 5 &&
                            staffCurrentPage <
                              Math.ceil(filteredStaff.length / itemsPerPage) - 2 && (
                              <PaginationItem>
                                <PaginationEllipsis />
                              </PaginationItem>
                            )}

                          {Math.ceil(filteredStaff.length / itemsPerPage) > 5 &&
                            staffCurrentPage <
                              Math.ceil(filteredStaff.length / itemsPerPage) - 2 && (
                              <PaginationItem>
                                <PaginationLink
                                  onClick={() =>
                                    setStaffCurrentPage(
                                      Math.ceil(filteredStaff.length / itemsPerPage)
                                    )
                                  }
                                >
                                  {Math.ceil(filteredStaff.length / itemsPerPage)}
                                </PaginationLink>
                              </PaginationItem>
                            )}

                          <PaginationItem>
                            <PaginationNext
                              onClick={() =>
                                staffCurrentPage < Math.ceil(filteredStaff.length / itemsPerPage) &&
                                setStaffCurrentPage(staffCurrentPage + 1)
                              }
                              className={cn(
                                staffCurrentPage >=
                                  Math.ceil(filteredStaff.length / itemsPerPage) &&
                                  "pointer-events-none opacity-50"
                              )}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                    <div className="flex-1 flex justify-end">
                      <Select
                        value={itemsPerPage.toString()}
                        onValueChange={(value) => setItemsPerPage(Number(value))}
                      >
                        <SelectTrigger className="w-[110px] text-xs">
                          <span>페이지당 {itemsPerPage}개</span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5개</SelectItem>
                          <SelectItem value="10">10개</SelectItem>
                          <SelectItem value="20">20개</SelectItem>
                          <SelectItem value="50">50개</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* 선택된 직원 정보 및 사건 검색 폼 */}
                {selectedStaff && (
                  <Card className="mt-6 border-blue-100 dark:border-blue-900/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center">
                        <UserCog className="h-5 w-5 mr-2 text-blue-500" />
                        {selectedStaff.name} 담당자의 사건 검색
                      </CardTitle>
                      <CardDescription>
                        당사자 이름으로 사건을 검색하여 담당자를 지정할 수 있습니다.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-3">
                        <div className="relative flex-1">
                          <Search
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                            size={16}
                          />
                          <Input
                            placeholder="의뢰인 또는 당사자 이름으로 검색"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                          />
                        </div>
                        <Button
                          onClick={() => {
                            if (searchTerm.trim().length >= 2) {
                              fetchCases();
                              setActiveTab("cases");
                            } else {
                              toast.error("검색어는 2글자 이상 입력해주세요.");
                            }
                          }}
                          disabled={isFetchingCases || searchTerm.trim().length < 2}
                        >
                          {isFetchingCases ? (
                            <>
                              <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              검색 중...
                            </>
                          ) : (
                            <>
                              <Search className="h-4 w-4 mr-2" />
                              사건 검색
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* 사건 목록 탭 */}
            <TabsContent value="cases">
              <div className="flex flex-col space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg flex items-center mb-2">
                  {isFetchingCases ? (
                    <div className="flex items-center">
                      <div className="animate-spin h-5 w-5 mr-3 rounded-full border-2 border-blue-500 border-t-transparent" />
                      <p>사건 정보를 가져오는 중...</p>
                    </div>
                  ) : (
                    <>
                      <Briefcase className="h-5 w-5 mr-2 text-blue-500" />
                      <p>
                        <span className="font-medium">
                          {selectedStaff ? selectedStaff.name : "검색"} 결과
                        </span>
                        : 총 {filteredCases.length}건의 사건이 검색되었습니다.
                      </p>
                    </>
                  )}
                </div>

                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                        <TableHead className="w-[15%]">사건 ID</TableHead>
                        <TableHead className="w-[25%]">채권자</TableHead>
                        <TableHead className="w-[25%]">채무자</TableHead>
                        <TableHead className="w-[20%]">원리금</TableHead>
                        <TableHead className="w-[15%] text-right">담당자 설정</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCases.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                            <div className="flex flex-col items-center">
                              <Briefcase className="h-8 w-8 mb-2 text-gray-300 dark:text-gray-600" />
                              <p>검색 결과가 없습니다.</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        getCurrentPageData().map((caseItem) => {
                          const caseHandlers = getCaseHandlers(caseItem.id);
                          const isAlreadyAssigned =
                            selectedStaff &&
                            caseHandlers.some((h) => h.user_id === selectedStaff.id);

                          return (
                            <TableRow
                              key={caseItem.id}
                              className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-default"
                            >
                              <TableCell>
                                <div className="flex items-center font-medium">
                                  <FileText className="h-4 w-4 mr-2 text-gray-500" />
                                  {caseItem.id ? caseItem.id.substring(0, 8) + "..." : "ID 미지정"}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {getCaseStatusBadge(caseItem.status, caseItem.status_info)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div
                                  className={cn(
                                    "font-medium text-blue-600 dark:text-blue-400",
                                    caseItem.search_matched_creditor &&
                                      "bg-yellow-100 dark:bg-yellow-900/20 px-1 py-0.5 rounded"
                                  )}
                                >
                                  {caseItem.creditor_name || "-"}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">채권자</div>
                              </TableCell>
                              <TableCell>
                                <div
                                  className={cn(
                                    "font-medium text-red-600 dark:text-red-400",
                                    caseItem.search_matched_debtor &&
                                      "bg-yellow-100 dark:bg-yellow-900/20 px-1 py-0.5 rounded"
                                  )}
                                >
                                  {caseItem.debtor_name || "-"}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">채무자</div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium text-lg">
                                  {formatCurrency(caseItem.total_debt)}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  원금: {formatCurrency(caseItem.principal_amount || 0)}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                {selectedStaff ? (
                                  isAlreadyAssigned ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-xs h-8 bg-gray-100"
                                      disabled
                                    >
                                      <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-green-500" />
                                      담당 중
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-xs h-8"
                                      onClick={() => handleQuickAssign(caseItem, selectedStaff.id)}
                                    >
                                      <UserPlus className="h-3.5 w-3.5 mr-1" />
                                      담당 추가
                                    </Button>
                                  )
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-8"
                                    onClick={() => handleOpenAddHandlerModal(caseItem)}
                                  >
                                    <UserPlus className="h-3.5 w-3.5 mr-1" />
                                    담당자 추가
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>

                {filteredCases.length > 0 && (
                  <div className="flex justify-center mt-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                            className={cn(currentPage <= 1 && "pointer-events-none opacity-50")}
                          />
                        </PaginationItem>

                        {Array.from(
                          { length: Math.min(5, Math.ceil(filteredCases.length / itemsPerPage)) },
                          (_, i) => {
                            const pageNumber = i + 1;
                            const totalPages = Math.ceil(filteredCases.length / itemsPerPage);

                            // 페이지 번호 조정 (1, 2, ..., 현재, ..., 마지막-1, 마지막)
                            let showNumber = pageNumber;

                            if (totalPages > 5) {
                              if (currentPage <= 3) {
                                // 처음 5페이지 보이기
                                showNumber = pageNumber;
                              } else if (currentPage >= totalPages - 2) {
                                // 마지막 5페이지 보이기
                                showNumber = totalPages - 5 + pageNumber;
                              } else {
                                // 현재 페이지 중심으로 앞뒤로 2페이지씩 보이기
                                showNumber = currentPage - 3 + pageNumber;
                              }

                              if (showNumber <= 0 || showNumber > totalPages) {
                                return null;
                              }
                            }

                            return (
                              <PaginationItem key={showNumber}>
                                <PaginationLink
                                  onClick={() => setCurrentPage(showNumber)}
                                  isActive={currentPage === showNumber}
                                >
                                  {showNumber}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          }
                        )}

                        {Math.ceil(filteredCases.length / itemsPerPage) > 5 &&
                          currentPage < Math.ceil(filteredCases.length / itemsPerPage) - 2 && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}

                        {Math.ceil(filteredCases.length / itemsPerPage) > 5 &&
                          currentPage < Math.ceil(filteredCases.length / itemsPerPage) - 2 && (
                            <PaginationItem>
                              <PaginationLink
                                onClick={() =>
                                  setCurrentPage(Math.ceil(filteredCases.length / itemsPerPage))
                                }
                              >
                                {Math.ceil(filteredCases.length / itemsPerPage)}
                              </PaginationLink>
                            </PaginationItem>
                          )}

                        <PaginationItem>
                          <PaginationNext
                            onClick={() =>
                              currentPage < Math.ceil(filteredCases.length / itemsPerPage) &&
                              setCurrentPage(currentPage + 1)
                            }
                            className={cn(
                              currentPage >= Math.ceil(filteredCases.length / itemsPerPage) &&
                                "pointer-events-none opacity-50"
                            )}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}

                {/* 새로운 검색 상자 */}
                <div className="flex justify-between items-center">
                  <div className="flex gap-3 w-full max-w-md">
                    <div className="relative flex-1">
                      <Search
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={16}
                      />
                      <Input
                        placeholder="다른 당사자 이름으로 검색"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Button
                      onClick={() => {
                        if (searchTerm.trim().length >= 2) {
                          fetchCases();
                        } else {
                          toast.error("검색어는 2글자 이상 입력해주세요.");
                        }
                      }}
                      disabled={isFetchingCases || searchTerm.trim().length < 2}
                    >
                      <Search className="h-4 w-4 mr-2" />
                      검색
                    </Button>
                  </div>
                  <div>
                    <Select
                      value={itemsPerPage.toString()}
                      onValueChange={(value) => setItemsPerPage(Number(value))}
                    >
                      <SelectTrigger className="w-[110px] text-xs">
                        <span>페이지당 {itemsPerPage}개</span>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5개</SelectItem>
                        <SelectItem value="10">10개</SelectItem>
                        <SelectItem value="20">20개</SelectItem>
                        <SelectItem value="50">50개</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" onClick={() => setActiveTab("handlers")}>
                    <Users className="h-4 w-4 mr-2" />
                    직원 목록으로
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 담당자 추가 모달 */}
      <Dialog open={showAddHandlerModal} onOpenChange={setShowAddHandlerModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>담당자 추가</DialogTitle>
            <DialogDescription>
              {selectedCase && (
                <div className="mt-2">
                  <div className="mb-3">
                    <div className="text-sm text-muted-foreground">사건 ID:</div>
                    <strong className="text-base">
                      {selectedCase.id && selectedCase.id.substring(0, 8) + "..."}
                    </strong>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-sm text-muted-foreground">채권자:</div>
                      <div className="font-medium text-blue-600 dark:text-blue-400">
                        {selectedCase.creditor_name || "-"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">채무자:</div>
                      <div className="font-medium text-red-600 dark:text-red-400">
                        {selectedCase.debtor_name || "-"}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-sm text-muted-foreground">원리금:</div>
                    <div className="font-medium">{formatCurrency(selectedCase.total_debt)}</div>
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="handler">담당자 선택</Label>
                <Select onValueChange={setSelectedHandler}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="담당자 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffUsers.map((staffUser) => (
                      <SelectItem key={staffUser.id} value={staffUser.id}>
                        <div className="flex items-center gap-2">
                          <span>{staffUser.name}</span>
                          <Badge variant="outline" className="text-xs ml-2">
                            {getEmployeeTypeText(staffUser.employee_type || "internal")}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">취소</Button>
            </DialogClose>
            <Button onClick={handleAssignHandler}>담당자 등록</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 담당자 제거 모달 */}
      <Dialog open={showRemoveHandlerModal} onOpenChange={setShowRemoveHandlerModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>담당자 제거</DialogTitle>
            <DialogDescription>
              {selectedCase && handlerToRemove && (
                <div className="mt-2">
                  <div className="mb-3">
                    <div className="text-sm text-muted-foreground">사건 ID:</div>
                    <strong className="text-base">
                      {selectedCase.id && selectedCase.id.substring(0, 8) + "..."}
                    </strong>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-sm text-muted-foreground">채권자:</div>
                      <div className="font-medium text-blue-600 dark:text-blue-400">
                        {selectedCase.creditor_name || "-"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">채무자:</div>
                      <div className="font-medium text-red-600 dark:text-red-400">
                        {selectedCase.debtor_name || "-"}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 mb-2">
                    <div className="text-sm text-muted-foreground">담당자:</div>
                    <div className="flex items-center">
                      <span className="font-medium">{handlerToRemove.user?.name}</span>
                      {handlerToRemove.user?.employee_type && (
                        <Badge className="ml-2 text-xs">
                          {getEmployeeTypeText(handlerToRemove.user.employee_type)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-md">
                    이 담당자를 정말 제거하시겠습니까?
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">취소</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleRemoveHandler}>
              담당자 제거
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
