"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  FileText,
  PlusCircle,
  RefreshCw,
  Search,
  ArrowUpRight,
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
  Gavel,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency as formatUtil } from "@/utils/format";
import Link from "next/link";
import { StaffCasesTable } from "../clients/[id]/StaffCasesTable";

function CasesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("case_number");
  const [results, setResults] = useState([]);
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => {
    const queryType = searchParams.get("type");
    const queryTerm = searchParams.get("q");
    const queryPage = searchParams.get("page");
    const queryPageSize = searchParams.get("pageSize");

    if (queryType) setSearchType(queryType);
    if (queryPageSize) setPageSize(parseInt(queryPageSize));

    if (queryTerm) {
      setSearchTerm(queryTerm);
      const currentPage = queryPage ? parseInt(queryPage) : 1;
      setPage(currentPage);
      performSearch(queryTerm, queryType || "case_number", currentPage);
    }
  }, [searchParams]);

  const performSearch = async (term, type, currentPage = 1) => {
    if (!term) {
      setResults([]);
      setTotalResults(0);
      return;
    }

    setLoading(true);

    try {
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      if (type === "case_number") {
        const { data, error, count } = await supabase
          .from("test_case_lawsuits")
          .select(
            `
            id,
            case_id,
            lawsuit_type,
            court_name,
            case_number,
            status,
            cases:case_id(
              principal_amount,
              clients:test_case_clients(
                individual:individual_id(name),
                organization:organization_id(name)
              )
            )
          `,
            { count: "exact" }
          )
          .ilike("case_number", `%${term}%`)
          .range(from, to);

        if (error) throw error;

        const processedData = data.map((lawsuit) => {
          let clientName = "미등록";

          if (lawsuit.cases?.clients && lawsuit.cases.clients.length > 0) {
            const clientsWithName = lawsuit.cases.clients
              .map((client) => {
                if (client.individual?.name) return client.individual.name;
                if (client.organization?.name) return client.organization.name;
                return null;
              })
              .filter(Boolean);

            if (clientsWithName.length > 0) {
              clientName = clientsWithName.join(", ");
            }
          }

          return {
            ...lawsuit,
            clientName,
          };
        });

        setResults(processedData);
        setTotalResults(count || 0);
      } else {
        const { data, error, count } = await supabase
          .from("test_case_parties")
          .select(
            `
            id,
            case_id,
            party_type,
            entity_type,
            name,
            company_name,
            cases:case_id(
              id,
              status,
              principal_amount,
              created_at,
              parties:test_case_parties(
                id,
                party_type,
                entity_type,
                name,
                company_name
              )
            )
          `,
            { count: "exact" }
          )
          .or(`name.ilike.%${term}%,company_name.ilike.%${term}%`)
          .range(from, to);

        if (error) throw error;

        const processedData = data.map((party) => {
          const allParties = party.cases?.parties || [];

          const creditor = allParties.find((p) =>
            ["creditor", "plaintiff", "applicant"].includes(p.party_type)
          );

          const debtor = allParties.find((p) =>
            ["debtor", "defendant", "respondent"].includes(p.party_type)
          );

          const creditorName = creditor
            ? creditor.entity_type === "individual"
              ? creditor.name
              : creditor.company_name
            : "미등록";

          const debtorName = debtor
            ? debtor.entity_type === "individual"
              ? debtor.name
              : debtor.company_name
            : "미등록";

          return {
            id: party.cases?.id || party.case_id,
            case_id: party.case_id,
            status: party.cases?.status || "unknown",
            principal_amount: party.cases?.principal_amount || 0,
            recovered_amount: 0,
            creditor_name: creditorName,
            debtor_name: debtorName,
            created_at: party.cases?.created_at,
            searched_party: {
              id: party.id,
              type: party.party_type,
              entity_type: party.entity_type,
              name: party.entity_type === "individual" ? party.name : party.company_name,
            },
          };
        });

        setResults(processedData);
        setTotalResults(count || 0);
      }
    } catch (error) {
      console.error("검색 오류:", error);
      toast.error("검색 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();

    const params = new URLSearchParams();
    if (searchTerm) params.set("q", searchTerm);
    params.set("type", searchType);
    params.set("page", "1");

    router.push(`/cases?${params.toString()}`);
    performSearch(searchTerm, searchType, 1);
  };

  const handleSearchInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);

    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());

    if (searchTerm) params.set("q", searchTerm);
    params.set("type", searchType);

    router.push(`/cases?${params.toString()}`);
    performSearch(searchTerm, searchType, newPage);
  };

  const handlePageSizeChange = (size) => {
    const newSize = parseInt(size);
    setPageSize(newSize);
    setPage(1);

    const params = new URLSearchParams(searchParams);
    params.set("page", "1");
    params.set("pageSize", newSize.toString());

    if (searchTerm) params.set("q", searchTerm);
    params.set("type", searchType);

    router.push(`/cases?${params.toString()}`);
    performSearch(searchTerm, searchType, 1);
  };

  const renderLawsuitTypeBadge = (type) => {
    switch (type) {
      case "civil":
        return (
          <Badge className="bg-primary/10 text-primary border-primary/20 border">
            <Scale className="mr-1 h-3 w-3" /> 민사
          </Badge>
        );
      case "criminal":
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20 border">
            <Gavel className="mr-1 h-3 w-3" /> 형사
          </Badge>
        );
      case "administrative":
        return (
          <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/20 border">
            <FileText className="mr-1 h-3 w-3" /> 행정
          </Badge>
        );
      case "family":
        return (
          <Badge className="bg-pink-500/10 text-pink-700 border-pink-500/20 border">
            <Users className="mr-1 h-3 w-3" /> 가사
          </Badge>
        );
      case "Constitutional":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20 border">
            <FileText className="mr-1 h-3 w-3" /> 헌법
          </Badge>
        );
      case "patent":
        return (
          <Badge className="bg-purple-500/10 text-purple-700 border-purple-500/20 border">
            <FileText className="mr-1 h-3 w-3" /> 특허
          </Badge>
        );
      default:
        return (
          <Badge className="bg-muted text-muted-foreground border-muted/50 border">
            {type || "기타"}
          </Badge>
        );
    }
  };

  const PaginationComponent = ({ currentPage, totalPages, onPageChange }) => {
    const getPageButtons = () => {
      if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
      }

      if (currentPage <= 4) {
        return [1, 2, 3, 4, 5, "...", totalPages];
      }

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

  const formatMoney = (amount) => {
    return formatUtil(amount);
  };

  return (
    <div className="container py-6 px-4 md:px-6">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">사건 검색</h1>
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

        <Tabs value={searchType} onValueChange={setSearchType} className="mt-4">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="case_number">사건번호</TabsTrigger>
            <TabsTrigger value="party_name">당사자 이름</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSearch} className="flex w-full mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Input
                type="search"
                placeholder={
                  searchType === "case_number"
                    ? "사건번호 입력 (예: 2024가단123456)"
                    : "당사자 이름 입력"
                }
                className="pl-9 w-full"
                value={searchTerm}
                onChange={handleSearchInputChange}
              />
            </div>
            <Button type="submit" className="ml-2">
              검색
            </Button>
          </form>

          <Card className="border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">
                {searchTerm && results.length > 0 ? (
                  <>
                    '{searchTerm}' 검색 결과 ({totalResults}건)
                  </>
                ) : (
                  "검색 결과"
                )}
              </CardTitle>
              <CardDescription>
                {searchTerm && results.length > 0
                  ? searchType === "case_number"
                    ? "사건번호로 검색한 결과입니다"
                    : "당사자 이름으로 검색한 결과입니다"
                  : "검색 버튼을 클릭하여 결과를 확인하세요"}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-4">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse w-1/2"></div>
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-16 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"
                      ></div>
                    ))}
                  </div>
                </div>
              ) : searchTerm && results.length === 0 && searchParams.get("q") ? (
                <div className="flex flex-col items-center justify-center p-12">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
                    검색 결과 없음
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
                    '{searchTerm}'에 대한 검색 결과가 없습니다. 다른 검색어로 시도해보세요.
                  </p>
                </div>
              ) : !searchParams.get("q") ? (
                <div className="flex flex-col items-center justify-center p-12">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <Search className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
                    검색어를 입력하세요
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
                    위 검색창에 검색어를 입력하고 검색 버튼을 클릭하세요.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <TabsContent value="case_number">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800">
                          <TableHead>소송 유형</TableHead>
                          <TableHead>법원명</TableHead>
                          <TableHead>사건번호</TableHead>
                          <TableHead>의뢰인</TableHead>
                          <TableHead>원리금</TableHead>
                          <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.map((item) => (
                          <TableRow
                            key={item.id}
                            className="border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                            onClick={() => router.push(`/cases/${item.case_id}`)}
                          >
                            <TableCell>{renderLawsuitTypeBadge(item.lawsuit_type)}</TableCell>
                            <TableCell>{item.court_name || "-"}</TableCell>
                            <TableCell className="font-medium">{item.case_number || "-"}</TableCell>
                            <TableCell>{item.clientName || "미등록"}</TableCell>
                            <TableCell>{formatMoney(item.cases?.principal_amount || 0)}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/cases/${item.case_id}`);
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
                  </TabsContent>

                  <TabsContent value="party_name">
                    {searchType === "party_name" && (
                      <StaffCasesTable
                        cases={results}
                        personalCases={results}
                        organizationCases={[]}
                        selectedTab="personal"
                        searchTerm=""
                        onSearchChange={() => {}}
                        currentPage={page}
                        totalPages={Math.ceil(totalResults / pageSize)}
                        totalItems={totalResults}
                        casesPerPage={pageSize}
                        onPageChange={handlePageChange}
                        onPageSizeChange={handlePageSizeChange}
                        formatCurrency={formatMoney}
                        notifications={[]}
                      />
                    )}
                  </TabsContent>
                </div>
              )}

              {!loading && results.length > 0 && (
                <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      총 {totalResults}개 중 {(page - 1) * pageSize + 1}-
                      {Math.min(page * pageSize, totalResults)}개 표시
                    </div>

                    {searchType === "case_number" && (
                      <PaginationComponent
                        currentPage={page}
                        totalPages={Math.ceil(totalResults / pageSize)}
                        onPageChange={handlePageChange}
                      />
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </div>
  );
}

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
