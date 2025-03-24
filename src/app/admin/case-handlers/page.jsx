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
    if (user) {
      if (user.role === "admin") {
        // 관리자인 경우 직원 정보와 담당자 정보만 초기에 가져옴
        fetchStaffUsers();
        fetchHandlers();
      } else if (user.role === "staff") {
        // 스탭 사용자인 경우 자신이 담당하는 사건 가져오기
        console.log("스탭 사용자의 담당 사건 조회 시작...");
        fetchStaffCasesForCurrentUser();
      } else {
        // 권한이 없는 경우
        router.push("/unauthorized");
      }
    }
  }, [user, router]);

  // 현재 로그인한 스탭 사용자가 담당하는 사건 가져오기
  const fetchStaffCasesForCurrentUser = async () => {
    if (!user || user.role !== "staff") return;

    setLoading(true);
    try {
      // 현재 사용자가 담당하는 사건 ID 목록 가져오기
      const { data: handlerData, error: handlerError } = await supabase
        .from("test_case_handlers")
        .select("case_id")
        .eq("user_id", user.id);

      if (handlerError) {
        console.error("담당 사건 조회 실패:", handlerError);
        toast.error("담당 사건 조회에 실패했습니다");
        setLoading(false);
        return;
      }

      if (!handlerData || handlerData.length === 0) {
        console.log("담당하는 사건이 없습니다");
        setCases([]);
        setFilteredCases([]);
        setLoading(false);
        toast.info("담당하는 사건이 없습니다. 관리자에게 문의하세요.");
        return;
      }

      // 담당 사건 ID 목록 추출
      const caseIds = handlerData.map((item) => item.case_id);
      console.log(`${caseIds.length}개의 담당 사건 ID를 찾았습니다`);

      // 담당 사건 정보 가져오기
      fetchStaffCases(caseIds);

      // 직원 탭이 아닌 사건 탭을 기본으로 선택
      setActiveTab("cases");
    } catch (error) {
      console.error("담당 사건 조회 중 오류 발생:", error);
      toast.error("담당 사건 조회 중 오류가 발생했습니다");
      setLoading(false);
    }
  };

  // 사건 목록 가져오기 - 검색 시에만 호출, 검색어로 필터링하여 가져오기
  const fetchCases = async () => {
    if (!searchTerm.trim() || searchTerm.trim().length < 2) {
      toast.error("검색어는 2글자 이상 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      console.log(`검색어 "${searchTerm}"로 사건 정보 검색 중...`);

      // 검색어로 당사자(채권자, 채무자) 정보 검색
      const { data: partiesData, error: partiesError } = await supabase
        .from("test_case_parties")
        .select("case_id")
        .or(`name.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%`);

      if (partiesError) {
        console.error("당사자 정보 검색 실패:", partiesError);
        throw partiesError;
      }

      // 검색된 사건 ID 추출
      let caseIds = [];
      if (partiesData && partiesData.length > 0) {
        caseIds = [...new Set(partiesData.map((p) => p.case_id))]; // 중복 제거
        console.log(`당사자 정보에서 ${caseIds.length}개의 사건 ID를 찾았습니다.`);
      } else {
        console.log("당사자 정보에서 일치하는 사건이 없습니다.");
      }

      // 소송 정보에서도 검색 (case_number로 검색)
      const { data: lawsuitsData, error: lawsuitsError } = await supabase
        .from("test_case_lawsuits")
        .select("case_id")
        .ilike("case_number", `%${searchTerm}%`);

      if (lawsuitsError) {
        console.error("소송 정보 검색 실패:", lawsuitsError.message || lawsuitsError);
        console.log("소송 정보 검색 결과 없이 계속 진행합니다.");
      } else if (lawsuitsData && lawsuitsData.length > 0) {
        // 소송 정보에서 찾은 사건 ID 추가 (중복 제거)
        const lawsuitCaseIds = lawsuitsData.map((l) => l.case_id);
        caseIds = [...new Set([...caseIds, ...lawsuitCaseIds])];
        console.log(`소송 정보에서 ${lawsuitsData.length}개의 사건 ID를 추가로 찾았습니다.`);
      }

      // 검색 결과가 없는 경우 처리
      if (caseIds.length === 0) {
        console.log("검색 결과가 없습니다.");
        setCases([]);
        setFilteredCases([]);
        setTotalItems(0);
        setTotalPages(0);
        setLoading(false);
        toast.info(`"${searchTerm}" 검색 결과가 없습니다.`);
        return;
      }

      // 찾은 사건 ID로 사건 정보 가져오기 (배치 처리)
      console.log(`총 ${caseIds.length}개의 사건 ID로 상세 정보를 조회합니다.`);
      const batchSize = 50;
      let allCases = [];

      for (let i = 0; i < caseIds.length; i += batchSize) {
        const batchIds = caseIds.slice(i, i + batchSize);
        console.log(`배치 ${Math.floor(i / batchSize) + 1}: ${batchIds.length}개 ID 처리 중`);

        const { data: casesData, error: casesError } = await supabase
          .from("test_cases")
          .select("*")
          .in("id", batchIds)
          .order("created_at", { ascending: false });

        if (casesError) {
          console.error(
            `배치 ${Math.floor(i / batchSize) + 1} 사건 정보 가져오기 실패:`,
            casesError
          );
          console.log("해당 배치는 건너뛰고 계속 진행합니다.");
        } else if (casesData && casesData.length > 0) {
          allCases = [...allCases, ...casesData];
          console.log(
            `배치 ${Math.floor(i / batchSize) + 1}에서 ${
              casesData.length
            }개의 사건 정보를 가져왔습니다.`
          );
        }
      }

      if (allCases.length === 0) {
        console.log("사건 정보를 가져오지 못했습니다.");
        setCases([]);
        setFilteredCases([]);
        setTotalItems(0);
        setTotalPages(0);
        setLoading(false);
        toast.info(`"${searchTerm}" 검색 결과가 없습니다.`);
        return;
      }

      console.log(`총 ${allCases.length}개의 사건 정보를 가져왔습니다.`);

      // 담당자 정보 가져오기
      const { data: handlersData, error: handlersError } = await supabase
        .from("test_case_handlers")
        .select("case_id, user_id, user:user_id(id, name, profile_image)");

      if (handlersError) {
        console.error("담당자 데이터 가져오기 실패:", handlersError);
        console.log("담당자 정보 없이 계속 진행합니다.");
      }

      // handlersData가 없어도 빈 배열로 처리
      const handlersList = handlersData || [];
      console.log(`${handlersList.length}개의 담당자 데이터를 가져왔습니다.`);

      // 각 사건의 당사자 정보를 가져와서 사건 정보 보강
      const enrichedCases = await enrichCasesWithPartyInfo(allCases);
      console.log("당사자 정보 보강 완료");

      // 소송 정보 가져오기 (이미 검색했던 소송 정보 재활용)
      const caseNumberMap = {};

      // 소송 정보 가져오기 (배치 처리)
      for (let i = 0; i < caseIds.length; i += batchSize) {
        const batchIds = caseIds.slice(i, i + batchSize);

        try {
          const { data: batchLawsuitsData, error: batchLawsuitsError } = await supabase
            .from("test_case_lawsuits")
            .select("case_id, case_number")
            .in("case_id", batchIds);

          if (batchLawsuitsError) {
            console.error(
              `배치 ${Math.floor(i / batchSize) + 1} 소송 정보 가져오기 실패:`,
              batchLawsuitsError.message || batchLawsuitsError
            );
            console.log("해당 배치 소송 정보 없이 계속 진행합니다.");
          } else if (batchLawsuitsData && batchLawsuitsData.length > 0) {
            console.log(
              `배치 ${Math.floor(i / batchSize) + 1}에서 ${
                batchLawsuitsData.length
              }개의 소송 정보를 가져왔습니다.`
            );
            batchLawsuitsData.forEach((lawsuit) => {
              if (lawsuit.case_id && lawsuit.case_number) {
                caseNumberMap[lawsuit.case_id] = lawsuit.case_number;
              }
            });
          }
        } catch (err) {
          console.error(
            `배치 ${Math.floor(i / batchSize) + 1} 소송 정보 가져오기 중 예외 발생:`,
            err
          );
          console.log("해당 배치 소송 정보 없이 계속 진행합니다.");
        }
      }

      // 모든 사건 정보에 담당자 정보와 소송번호 추가하기
      const casesWithHandlers = enrichedCases.map((caseItem) => {
        try {
          // 담당자 정보 추가
          const handlers = handlersList.filter((h) => h.case_id === caseItem.id) || [];

          // status_id로 상태 정보 가져오기
          let statusInfo = { name: "알 수 없음", color: "#999999" };
          try {
            if (caseItem.status_id) {
              statusInfo = getStatusById(caseItem.status_id) || statusInfo;
            }
          } catch (statusErr) {
            console.error("상태 정보 가져오기 실패:", statusErr, caseItem.status_id);
          }

          return {
            ...caseItem,
            handlers: handlers.map((h) => h.user),
            // 소송 번호 추가
            case_number: caseNumberMap[caseItem.id] || null,
            // 상태 정보 추가
            status_info: statusInfo,
            // 검색어와 일치하는지 확인 - 하이라이트 표시용
            search_matched_creditor:
              caseItem.creditor_name &&
              caseItem.creditor_name.toLowerCase().includes(searchTerm.toLowerCase()),
            search_matched_debtor:
              caseItem.debtor_name &&
              caseItem.debtor_name.toLowerCase().includes(searchTerm.toLowerCase()),
            search_matched_case_number:
              caseNumberMap[caseItem.id] &&
              caseNumberMap[caseItem.id].toLowerCase().includes(searchTerm.toLowerCase()),
          };
        } catch (itemError) {
          console.error("사건 정보 처리 중 오류:", itemError, caseItem);
          return {
            ...caseItem,
            handlers: [],
            case_number: caseNumberMap[caseItem.id] || null,
            status_info: { name: "알 수 없음", color: "#999999" },
            search_matched_creditor: false,
            search_matched_debtor: false,
            search_matched_case_number: false,
          };
        }
      });

      setCases(casesWithHandlers);
      setFilteredCases(casesWithHandlers);
      setTotalItems(casesWithHandlers.length);
      setTotalPages(Math.ceil(casesWithHandlers.length / itemsPerPage));

      toast.success(`"${searchTerm}" 검색 결과: ${casesWithHandlers.length}건`);
    } catch (error) {
      console.error("사건 정보 로딩 실패:", error);
      console.error(
        "오류 세부 정보:",
        error?.message || "오류 세부 정보 없음",
        error?.code || "코드 없음"
      );

      // 빈 배열로 상태 설정하여 UI가 정상적으로 표시되도록 함
      setCases([]);
      setFilteredCases([]);
      setTotalItems(0);
      setTotalPages(0);

      toast.error(`사건 정보를 불러오는데 실패했습니다: ${error?.message || "알 수 없는 오류"}`);
    } finally {
      setLoading(false);
    }
  };

  // 담당자 정보 가져오기
  const fetchHandlers = async () => {
    try {
      console.log("담당자 정보 가져오기 시작...");
      const { data: handlersData, error: handlersError } = await supabase
        .from("test_case_handlers")
        .select("*, user:user_id(id, name, email, profile_image, role, employee_type)");

      if (handlersError) {
        console.error("담당자 정보 가져오기 실패:", handlersError);
        throw handlersError;
      }

      if (!handlersData) {
        console.warn("담당자 데이터가 없습니다.");
        setHandlers([]);
        return;
      }

      console.log(`${handlersData.length}개의 담당자 정보를 가져왔습니다.`);
      setHandlers(handlersData || []);
    } catch (error) {
      console.error("담당자 정보 가져오기 실패:", error);
      toast.error(
        "담당자 정보를 불러오는데 실패했습니다: " + (error?.message || "알 수 없는 오류")
      );
      setHandlers([]); // 에러 발생 시 빈 배열로 설정
    }
  };

  // 직원 사용자 목록 가져오기
  const fetchStaffUsers = async () => {
    try {
      console.log("직원 목록 가져오기 시작...");
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("role", "staff");

      if (userError) {
        console.error("직원 목록 가져오기 실패:", userError);
        throw userError;
      }

      if (!userData) {
        console.warn("직원 데이터가 없습니다.");
        setStaffUsers([]);
        setFilteredStaff([]);
        setLoading(false);
        return;
      }

      console.log(`${userData.length}명의 직원 정보를 가져왔습니다.`);
      setStaffUsers(userData || []);
      setFilteredStaff(userData || []);

      // 직원 목록을 가져오면 로딩 상태 종료
      setLoading(false);
    } catch (error) {
      console.error("직원 목록 가져오기 실패:", error);
      console.error(
        "오류 세부 정보:",
        error?.message || "오류 세부 정보 없음",
        error?.code || "코드 없음"
      );
      toast.error("직원 목록을 불러오는데 실패했습니다: " + (error?.message || "알 수 없는 오류"));

      // 에러가 발생해도 빈 배열로 설정하여 UI가 정상적으로 표시되도록 함
      setStaffUsers([]);
      setFilteredStaff([]);
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
          return c.status_id === 2 || c.status_id === 3 || c.status_id === 4;
        } else if (caseStatusFilter === "completed") {
          return c.status_id === 5 || c.status_id === 6;
        }
        return true;
      });
    }

    setFilteredCases(filtered);
    setTotalItems(filtered.length);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    setCurrentPage(1); // 필터 변경 시 첫 페이지로 이동
  }, [cases, searchTerm, caseStatusFilter, itemsPerPage]);

  // 검색어 입력 핸들러 - 타임아웃을 사용하여 매 타이핑마다 검색하지 않도록 함
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

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

  // 검색 버튼 클릭 핸들러
  const handleSearch = () => {
    if (searchTerm.trim().length < 2) {
      toast.error("검색어는 2글자 이상 입력해주세요.");
      return;
    }

    // 기존 검색 결과 초기화
    setCases([]);
    setFilteredCases([]);
    setTotalItems(0);
    setTotalPages(0);

    // 사건 검색 실행
    fetchCases();

    // 검색 완료 후 사건 탭으로 전환
    setActiveTab("cases");
  };

  // 빠른 담당자 할당 처리 (바로 선택한 직원 할당)
  const handleQuickAssign = async (caseItem) => {
    if (!caseItem || !selectedStaff) {
      toast.error("사건과 담당자 정보가 필요합니다");
      return;
    }

    try {
      // 이미 담당자로 등록되어 있는지 확인
      const existingHandlers = handlers.filter(
        (h) => h.case_id === caseItem.id && h.user_id === selectedStaff.id
      );

      if (existingHandlers.length > 0) {
        toast.error("이미 해당 사건의 담당자로 등록되어 있습니다");
        return;
      }

      // 로딩 상태 표시
      toast.loading("담당자를 등록 중입니다...");

      // 새 담당자 등록
      const { data, error } = await supabase
        .from("test_case_handlers")
        .insert({
          case_id: caseItem.id,
          user_id: selectedStaff.id,
          role: "담당자",
        })
        .select();

      if (error) throw error;

      toast.dismiss();
      toast.success("담당자가 성공적으로 등록되었습니다");

      // 담당자 목록 갱신
      await fetchHandlers();

      // 담당자가 성공적으로 추가된 경우 알림
      if (data && data.length > 0) {
        console.log("추가된 담당자 정보:", data[0]);

        // 담당자 추가 후 사건 목록도 갱신
        if (selectedStaff) {
          const { data: handlerData } = await supabase
            .from("test_case_handlers")
            .select("case_id")
            .eq("user_id", selectedStaff.id);

          if (handlerData && handlerData.length > 0) {
            const caseIds = handlerData.map((item) => item.case_id);
            fetchStaffCases(caseIds);
          }
        }
      }
    } catch (error) {
      toast.dismiss();
      console.error("담당자 등록 실패:", error);
      toast.error(`담당자 등록에 실패했습니다: ${error.message || "알 수 없는 오류"}`);
    }
  };

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

      // 할당 중인 상태 표시
      toast.loading("담당자를 등록 중입니다...");

      // 새 담당자 등록
      const { data, error } = await supabase
        .from("test_case_handlers")
        .insert({
          case_id: selectedCase.id,
          user_id: selectedHandler,
          role: "담당자",
        })
        .select();

      if (error) throw error;

      toast.dismiss();
      toast.success("담당자가 성공적으로 등록되었습니다");

      // 담당자 목록 갱신
      await fetchHandlers();

      // 성공 후 모달 닫기
      setShowAddHandlerModal(false);
      setSelectedHandler(null);

      // 성공적으로 추가되었음을 알리기 위해 간단한 피드백
      if (data && data.length > 0) {
        const addedHandler = data[0];
        console.log("추가된 담당자 정보:", addedHandler);
      }
    } catch (error) {
      toast.dismiss();
      console.error("담당자 등록 실패:", error);
      toast.error(`담당자 등록에 실패했습니다: ${error.message || "알 수 없는 오류"}`);
    }
  };

  // 담당자 제거 처리
  const handleRemoveHandler = async () => {
    if (!handlerToRemove) {
      toast.error("제거할 담당자 정보가 없습니다");
      return;
    }

    try {
      toast.loading("담당자를 제거하는 중입니다...");

      const { error } = await supabase
        .from("test_case_handlers")
        .delete()
        .eq("id", handlerToRemove.id);

      if (error) throw error;

      toast.dismiss();
      toast.success("담당자가 성공적으로 제거되었습니다");

      // 담당자 목록 갱신
      await fetchHandlers();

      // 성공 후 모달 닫기
      setShowRemoveHandlerModal(false);
      setHandlerToRemove(null);

      // 선택된 직원이 있는 경우 그 직원의 담당 사건 목록 갱신
      if (selectedStaff) {
        const { data: handlerData } = await supabase
          .from("test_case_handlers")
          .select("case_id")
          .eq("user_id", selectedStaff.id);

        if (handlerData && handlerData.length > 0) {
          const caseIds = handlerData.map((item) => item.case_id);
          fetchStaffCases(caseIds);
        } else {
          // 담당 사건이 없는 경우 목록 비우기
          setCases([]);
          setFilteredCases([]);
          setTotalItems(0);
          setTotalPages(0);
        }
      }
    } catch (error) {
      toast.dismiss();
      console.error("담당자 제거 실패:", error);
      toast.error(`담당자 제거에 실패했습니다: ${error.message || "알 수 없는 오류"}`);
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
      setTotalItems(0);
      setTotalPages(0);
      return;
    }

    setIsFetchingCases(true);
    setLoading(true); // 로딩 상태 활성화

    try {
      console.log(`${caseIds.length}개 담당 사건 정보 가져오기 시작...`);

      // 배치 크기 정의
      const batchSize = 50;
      let allCases = [];

      // 케이스 ID를 배치로 나누어 쿼리
      for (let i = 0; i < caseIds.length; i += batchSize) {
        const batchIds = caseIds.slice(i, i + batchSize);
        console.log(`배치 ${Math.floor(i / batchSize) + 1}: ${batchIds.length}개 ID 처리 중`);

        // 사건 정보 가져오기
        const { data: casesData, error: casesError } = await supabase
          .from("test_cases")
          .select("*")
          .in("id", batchIds)
          .order("created_at", { ascending: false });

        if (casesError) {
          console.error(
            `배치 ${Math.floor(i / batchSize) + 1} 사건 정보 가져오기 실패:`,
            casesError
          );
          console.log("해당 배치는 건너뛰고 계속 진행합니다.");
        } else if (casesData && casesData.length > 0) {
          allCases = [...allCases, ...casesData];
          console.log(
            `배치 ${Math.floor(i / batchSize) + 1}에서 ${
              casesData.length
            }개의 사건 정보를 가져왔습니다.`
          );
        }
      }

      if (allCases.length === 0) {
        console.warn("담당 사건이 없습니다.");
        setCases([]);
        setFilteredCases([]);
        setTotalItems(0);
        setTotalPages(0);
        setIsFetchingCases(false);
        setLoading(false);
        return;
      }

      console.log(`총 ${allCases.length}개의 담당 사건을 가져왔습니다.`);

      // 담당자 정보 가져오기
      const { data: handlersData, error: handlersError } = await supabase
        .from("test_case_handlers")
        .select("case_id, user_id, user:user_id(id, name, profile_image)");

      if (handlersError) {
        console.error("담당자 정보 가져오기 실패:", handlersError);
        console.log("담당자 정보 없이 계속 진행합니다.");
      }

      // 담당자 데이터가 없어도 빈 배열로 처리
      const handlersList = handlersData || [];

      // 당사자 정보로 사건 정보 보강
      const enrichedCases = await enrichCasesWithPartyInfo(allCases);

      // 소송 정보는 검색어가 있을 때만 가져옴
      let caseNumberMap = {};

      // 검색어가 있는 경우에만 소송 정보를 가져옴
      if (searchTerm.trim()) {
        console.log(`검색어 "${searchTerm}"를 포함하는 소송 정보 가져오기`);
        // 배치 처리
        for (let i = 0; i < caseIds.length; i += batchSize) {
          const batchIds = caseIds.slice(i, i + batchSize);

          try {
            const { data: batchLawsuitsData, error: batchLawsuitsError } = await supabase
              .from("test_case_lawsuits")
              .select("case_id, case_number")
              .in("case_id", batchIds);

            if (batchLawsuitsError) {
              console.error(
                `배치 ${Math.floor(i / batchSize) + 1} 소송 정보 가져오기 실패:`,
                batchLawsuitsError.message || batchLawsuitsError
              );
              console.log("해당 배치 소송 정보 없이 계속 진행합니다.");
            } else if (batchLawsuitsData && batchLawsuitsData.length > 0) {
              console.log(
                `배치 ${Math.floor(i / batchSize) + 1}에서 ${
                  batchLawsuitsData.length
                }개의 소송 정보를 가져왔습니다.`
              );
              // 소송 번호 매핑
              batchLawsuitsData.forEach((lawsuit) => {
                if (lawsuit.case_id && lawsuit.case_number) {
                  caseNumberMap[lawsuit.case_id] = lawsuit.case_number;
                }
              });
            }
          } catch (err) {
            console.error(
              `배치 ${Math.floor(i / batchSize) + 1} 소송 정보 가져오기 중 예외 발생:`,
              err
            );
            console.log("해당 배치 소송 정보 없이 계속 진행합니다.");
          }
        }
      }

      // 모든 정보 조합
      const finalCases = enrichedCases.map((caseItem) => {
        try {
          // 담당자 정보 추가
          const handlers = handlersList.filter((h) => h.case_id === caseItem.id) || [];

          // 상태 정보 가져오기
          let statusInfo = { name: "알 수 없음", color: "#999999" };
          try {
            if (caseItem.status_id) {
              statusInfo = getStatusById(caseItem.status_id) || statusInfo;
            }
          } catch (statusErr) {
            console.error("상태 정보 가져오기 실패:", statusErr);
          }

          return {
            ...caseItem,
            handlers: handlers.map((h) => h.user),
            case_number: caseNumberMap[caseItem.id] || null,
            status_info: statusInfo,
            // 검색어 일치 여부
            search_matched_creditor:
              searchTerm.trim() &&
              caseItem.creditor_name &&
              caseItem.creditor_name.toLowerCase().includes(searchTerm.toLowerCase()),
            search_matched_debtor:
              searchTerm.trim() &&
              caseItem.debtor_name &&
              caseItem.debtor_name.toLowerCase().includes(searchTerm.toLowerCase()),
            search_matched_case_number:
              searchTerm.trim() &&
              caseNumberMap[caseItem.id] &&
              caseNumberMap[caseItem.id].toLowerCase().includes(searchTerm.toLowerCase()),
          };
        } catch (err) {
          console.error("사건 정보 처리 중 오류:", err);
          return {
            ...caseItem,
            handlers: [],
            case_number: caseNumberMap[caseItem.id] || null,
            status_info: { name: "알 수 없음", color: "#999999" },
            search_matched_creditor: false,
            search_matched_debtor: false,
            search_matched_case_number: false,
          };
        }
      });

      // 모든 사건 설정
      setCases(finalCases);

      // 검색어로 필터링
      let filtered = [...finalCases];
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(
          (c) =>
            (c.creditor_name && c.creditor_name.toLowerCase().includes(term)) ||
            (c.debtor_name && c.debtor_name.toLowerCase().includes(term)) ||
            (c.case_number && c.case_number.toLowerCase().includes(term))
        );
        console.log(`검색어 "${searchTerm}"로 필터링된 결과: ${filtered.length}건`);
      }

      setFilteredCases(filtered);
      setTotalItems(filtered.length);
      setTotalPages(Math.ceil(filtered.length / itemsPerPage));
      setCurrentPage(1); // 결과를 처음 페이지부터 보여주기
    } catch (error) {
      console.error("담당 사건 정보 가져오기 실패:", error);
      console.error(
        "오류 세부 정보:",
        error?.message || "오류 세부 정보 없음",
        error?.code || "코드 없음"
      );
      toast.error(
        "담당 사건 정보를 불러오는데 실패했습니다: " + (error?.message || "알 수 없는 오류")
      );

      // 빈 배열로 상태 설정하여 UI가 정상적으로 표시되도록 함
      setCases([]);
      setFilteredCases([]);
      setTotalItems(0);
      setTotalPages(0);
    } finally {
      setIsFetchingCases(false);
      setLoading(false);
    }
  };

  // 사건 정보에 당사자 정보 추가 (담당 사건 목록용)
  const enrichCasesWithPartyInfo = async (cases) => {
    if (!cases || cases.length === 0) return [];

    const caseIds = cases.map((c) => c.id);
    console.log(`총 ${caseIds.length}개 사건의 당사자 정보 가져오기 시작`);

    try {
      // 배치 크기 정의 (Supabase in 쿼리에는 한계가 있을 수 있음)
      const batchSize = 50;
      let allParties = [];
      let allInterests = [];

      // 케이스 ID를 배치로 나누어 쿼리
      for (let i = 0; i < caseIds.length; i += batchSize) {
        const batchIds = caseIds.slice(i, i + batchSize);
        console.log(`배치 ${Math.floor(i / batchSize) + 1}: ${batchIds.length}개 ID 처리 중`);

        // 각 사건의 당사자 정보 가져오기
        const { data: partiesData, error: partiesError } = await supabase
          .from("test_case_parties")
          .select("*")
          .in("case_id", batchIds);

        if (partiesError) {
          console.error(
            `배치 ${Math.floor(i / batchSize) + 1} 당사자 정보 가져오기 실패:`,
            partiesError
          );
          console.log("해당 배치는 건너뛰고 계속 진행합니다.");
        } else if (partiesData) {
          allParties = [...allParties, ...partiesData];
          console.log(
            `배치 ${Math.floor(i / batchSize) + 1}에서 ${
              partiesData.length
            }개의 당사자 정보를 가져왔습니다.`
          );
        }

        // 이자 정보 가져오기
        const { data: interestsData, error: interestsError } = await supabase
          .from("test_case_interests")
          .select("*")
          .in("case_id", batchIds);

        if (interestsError) {
          console.error(
            `배치 ${Math.floor(i / batchSize) + 1} 이자 정보 가져오기 실패:`,
            interestsError
          );
          console.log("해당 배치의 이자 정보는 건너뛰고 계속 진행합니다.");
        } else if (interestsData) {
          allInterests = [...allInterests, ...interestsData];
          console.log(
            `배치 ${Math.floor(i / batchSize) + 1}에서 ${
              interestsData.length
            }개의 이자 정보를 가져왔습니다.`
          );
        }
      }

      console.log(`총 ${allParties.length}개의 당사자 정보를 가져왔습니다.`);
      console.log(`총 ${allInterests.length}개의 이자 정보를 가져왔습니다.`);

      // 당사자 정보와 원리금 정보로 사건 정보 보강
      const enrichedCases = cases.map((caseItem) => {
        try {
          // 당사자 정보 필터링
          const caseParties = allParties.filter((p) => p.case_id === caseItem.id) || [];

          // 이자 정보 필터링
          const caseInterests = allInterests.filter((i) => i.case_id === caseItem.id) || [];

          // 채권자(원고, 신청인) 찾기
          const creditor = caseParties.find((p) =>
            ["creditor", "plaintiff", "applicant"].includes(p.party_type)
          );

          // 채무자(피고, 피신청인) 찾기
          const debtor = caseParties.find((p) =>
            ["debtor", "defendant", "respondent"].includes(p.party_type)
          );

          // 채권자 이름 결정 (개인 또는 법인)
          let creditorName = null;
          if (creditor) {
            if (creditor.entity_type === "individual") {
              creditorName = creditor.name || "이름 없음";
            } else {
              creditorName = creditor.company_name || "회사명 없음";
            }
          }

          // 채무자 이름 결정 (개인 또는 법인)
          let debtorName = null;
          if (debtor) {
            if (debtor.entity_type === "individual") {
              debtorName = debtor.name || "이름 없음";
            } else {
              debtorName = debtor.company_name || "회사명 없음";
            }
          }

          // 원금 (principal_amount가 있으면 사용, 없으면 0)
          const principal = parseFloat(caseItem.principal_amount || 0);

          // 이자 계산
          let totalInterest = 0;

          // 이자 계산 로직
          if (caseInterests && caseInterests.length > 0) {
            caseInterests.forEach((interest) => {
              try {
                const rate = parseFloat(interest.rate || 0) / 100; // 비율로 변환
                // 원금에 이자율을 곱한 값을 이자로 간주
                totalInterest += principal * rate;
              } catch (err) {
                console.error("이자 계산 중 오류:", err);
              }
            });
          }

          // 총 원리금 계산
          const totalDebt = principal + totalInterest;

          return {
            ...caseItem,
            creditor_name: creditorName,
            debtor_name: debtorName,
            total_debt: totalDebt,
          };
        } catch (err) {
          console.error("사건 정보 처리 중 오류:", err, caseItem);
          return {
            ...caseItem,
            creditor_name: null,
            debtor_name: null,
            total_debt: parseFloat(caseItem.principal_amount || 0),
          };
        }
      });

      console.log(`${enrichedCases.length}개 사건의 당사자 정보 보강 완료`);
      return enrichedCases;
    } catch (err) {
      console.error("사건 정보 보강 실패:", err);
      // 오류가 발생해도 원본 사건 정보는 반환
      return cases.map((caseItem) => ({
        ...caseItem,
        creditor_name: null,
        debtor_name: null,
        total_debt: parseFloat(caseItem.principal_amount || 0),
      }));
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
    if (filteredCases.length === 0) return [];

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredCases.length);
    return filteredCases.slice(startIndex, endIndex);
  };

  // 직원 목록의 페이지네이션을 위한 현재 페이지 데이터 계산
  const getCurrentStaffPageData = () => {
    if (filteredStaff.length === 0) return [];

    const startIndex = (staffCurrentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredStaff.length);
    return filteredStaff.slice(startIndex, endIndex);
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // 직원 페이지 변경 핸들러
  const handleStaffPageChange = (page) => {
    if (page < 1 || page > Math.ceil(filteredStaff.length / itemsPerPage)) return;
    setStaffCurrentPage(page);
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
                              onClick={() => handleStaffPageChange(staffCurrentPage - 1)}
                              disabled={staffCurrentPage === 1}
                              className={
                                staffCurrentPage === 1
                                  ? "opacity-50 cursor-not-allowed"
                                  : "cursor-pointer"
                              }
                            />
                          </PaginationItem>

                          {Array.from({
                            length: Math.min(5, Math.ceil(filteredStaff.length / itemsPerPage)),
                          }).map((_, index) => {
                            let pageNumber;
                            const totalStaffPages = Math.ceil(filteredStaff.length / itemsPerPage);

                            // 현재 페이지를 중심으로 페이지 번호 계산
                            if (totalStaffPages <= 5) {
                              pageNumber = index + 1;
                            } else if (staffCurrentPage <= 3) {
                              pageNumber = index + 1;
                            } else if (staffCurrentPage >= totalStaffPages - 2) {
                              pageNumber = totalStaffPages - 4 + index;
                            } else {
                              pageNumber = staffCurrentPage - 2 + index;
                            }

                            // 페이지 번호가 유효한 범위인지 확인
                            if (pageNumber > 0 && pageNumber <= totalStaffPages) {
                              return (
                                <PaginationItem key={pageNumber}>
                                  <PaginationLink
                                    isActive={staffCurrentPage === pageNumber}
                                    onClick={() => handleStaffPageChange(pageNumber)}
                                  >
                                    {pageNumber}
                                  </PaginationLink>
                                </PaginationItem>
                              );
                            }
                            return null;
                          })}

                          {Math.ceil(filteredStaff.length / itemsPerPage) > 5 &&
                            staffCurrentPage <
                              Math.ceil(filteredStaff.length / itemsPerPage) - 2 && (
                              <>
                                <PaginationItem>
                                  <PaginationEllipsis />
                                </PaginationItem>
                                <PaginationItem>
                                  <PaginationLink
                                    onClick={() =>
                                      handleStaffPageChange(
                                        Math.ceil(filteredStaff.length / itemsPerPage)
                                      )
                                    }
                                  >
                                    {Math.ceil(filteredStaff.length / itemsPerPage)}
                                  </PaginationLink>
                                </PaginationItem>
                              </>
                            )}

                          <PaginationItem>
                            <PaginationNext
                              onClick={() => handleStaffPageChange(staffCurrentPage + 1)}
                              disabled={
                                staffCurrentPage === Math.ceil(filteredStaff.length / itemsPerPage)
                              }
                              className={
                                staffCurrentPage === Math.ceil(filteredStaff.length / itemsPerPage)
                                  ? "opacity-50 cursor-not-allowed"
                                  : "cursor-pointer"
                              }
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
                            onChange={handleSearchChange}
                            className="pl-9"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleSearch();
                              }
                            }}
                          />
                        </div>
                        <Button
                          onClick={handleSearch}
                          disabled={loading || isFetchingCases || searchTerm.trim().length < 2}
                        >
                          {loading ? (
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

                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>사건 번호</TableHead>
                        <TableHead>채권자/원고</TableHead>
                        <TableHead>채무자/피고</TableHead>
                        <TableHead>담당자</TableHead>
                        <TableHead>상태</TableHead>
                        <TableHead className="text-right">작업</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={`skeleton-${i}`}>
                            <TableCell>
                              <Skeleton className="h-4 w-[120px]" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-4 w-[150px]" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-4 w-[150px]" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-4 w-[100px]" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-4 w-[80px]" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-4 w-[100px]" />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : filteredCases.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4">
                            {searchTerm.trim() ? "검색 결과가 없습니다" : "사건 정보가 없습니다"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        getCurrentPageData().map((caseItem) => (
                          <TableRow key={caseItem.id}>
                            <TableCell>
                              <div className="flex items-center font-medium">
                                <FileText className="h-4 w-4 mr-2 text-gray-500" />
                                {caseItem.id ? caseItem.id.substring(0, 8) + "..." : "ID 미지정"}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {caseItem.case_number ? (
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-xs",
                                      caseItem.search_matched_case_number &&
                                        "bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200"
                                    )}
                                  >
                                    {caseItem.case_number}
                                  </Badge>
                                ) : (
                                  <span className="text-xs text-gray-400">사건번호 없음</span>
                                )}
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
                            <TableCell>
                              {selectedStaff ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-8"
                                  onClick={() => handleQuickAssign(caseItem)}
                                >
                                  <UserPlus className="h-3.5 w-3.5 mr-1" />
                                  담당 추가
                                </Button>
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
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* 페이지네이션 컴포넌트 */}
                {filteredCases.length > 0 && (
                  <div className="mt-4 flex justify-center">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={
                              currentPage === 1 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                            }
                          />
                        </PaginationItem>

                        {Array.from({ length: Math.min(5, totalPages) }).map((_, index) => {
                          let pageNumber;

                          // 현재 페이지를 중심으로 페이지 번호 계산
                          if (totalPages <= 5) {
                            pageNumber = index + 1;
                          } else if (currentPage <= 3) {
                            pageNumber = index + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNumber = totalPages - 4 + index;
                          } else {
                            pageNumber = currentPage - 2 + index;
                          }

                          // 페이지 번호가 유효한 범위인지 확인
                          if (pageNumber > 0 && pageNumber <= totalPages) {
                            return (
                              <PaginationItem key={pageNumber}>
                                <PaginationLink
                                  isActive={pageNumber === currentPage}
                                  onClick={() => handlePageChange(pageNumber)}
                                >
                                  {pageNumber}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          }
                          return null;
                        })}

                        {totalPages > 5 && currentPage < totalPages - 2 && (
                          <>
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                            <PaginationItem>
                              <PaginationLink onClick={() => handlePageChange(totalPages)}>
                                {totalPages}
                              </PaginationLink>
                            </PaginationItem>
                          </>
                        )}

                        <PaginationItem>
                          <PaginationNext
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={
                              currentPage === totalPages
                                ? "opacity-50 cursor-not-allowed"
                                : "cursor-pointer"
                            }
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
                        onChange={handleSearchChange}
                        className="pl-9"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSearch();
                          }
                        }}
                      />
                    </div>
                    <Button
                      onClick={handleSearch}
                      disabled={loading || isFetchingCases || searchTerm.trim().length < 2}
                    >
                      {loading ? (
                        <>
                          <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          검색 중...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-2" />
                          검색
                        </>
                      )}
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
