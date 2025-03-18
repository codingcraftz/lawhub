import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/utils/format";
import { supabase } from "@/utils/supabase";
import RecoveryActivities from "./RecoveryActivities";
import CaseNotifications from "./CaseNotifications";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  ChevronRight,
  Scale,
  CircleDollarSign,
  TrendingUp,
  Gavel,
  FileText,
  Calendar,
  RefreshCw,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function CaseDashboard({ caseId, caseData, parties, clients }) {
  const [lawsuits, setLawsuits] = useState([]);
  const [loadingLawsuits, setLoadingLawsuits] = useState(true);
  const [recoveryData, setRecoveryData] = useState({
    principalAmount: caseData?.principal_amount || 0,
    totalAmount: 0, // 원리금 (수임원금 + 이자 + 비용)
    recoveredAmount: 0, // 회수금액
    recoveryRate: 0, // 회수율
    isLoading: true,
  });

  useEffect(() => {
    fetchLawsuits();
    calculateRecoveryData();
  }, [caseId]);

  // 소송 정보 가져오기
  const fetchLawsuits = async () => {
    setLoadingLawsuits(true);
    try {
      const { data, error } = await supabase
        .from("test_case_lawsuits")
        .select(
          `
          *,
          lawsuit_parties:test_lawsuit_parties(
            id,
            party_type,
            party:test_case_parties(*)
          )
        `
        )
        .eq("case_id", caseId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLawsuits(data || []);
    } catch (error) {
      console.error("소송 정보 조회 실패:", error);
      toast.error("소송 정보 조회 실패");
    } finally {
      setLoadingLawsuits(false);
    }
  };

  // 회수 데이터 계산
  const calculateRecoveryData = async () => {
    setRecoveryData((prev) => ({ ...prev, isLoading: true }));
    try {
      // 회수 활동에서 납부 금액 합계 조회
      const { data: recoveryData, error: recoveryError } = await supabase
        .from("test_recovery_activities")
        .select("amount")
        .eq("case_id", caseId)
        .eq("activity_type", "payment")
        .eq("status", "completed");

      if (recoveryError) throw recoveryError;

      // 이자 및 비용 정보 조회
      const { data: interestData, error: interestError } = await supabase
        .from("test_case_interests")
        .select("*")
        .eq("case_id", caseId);

      if (interestError) throw interestError;

      const { data: expenseData, error: expenseError } = await supabase
        .from("test_case_expenses")
        .select("amount")
        .eq("case_id", caseId);

      if (expenseError) throw expenseError;

      // 이자 금액 계산 (간단히 합산)
      const interestAmount = interestData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;

      // 비용 합계 계산
      const expenseAmount = expenseData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;

      // 원리금 총액 계산 (원금 + 이자 + 비용)
      const principalAmount = caseData?.principal_amount || 0;
      const totalAmount = principalAmount + interestAmount + expenseAmount;

      // 회수 금액 계산
      const recoveredAmount = recoveryData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;

      // 회수율 계산 (소수점 2자리까지)
      const recoveryRate = totalAmount > 0 ? (recoveredAmount / totalAmount) * 100 : 0;

      setRecoveryData({
        principalAmount,
        totalAmount,
        recoveredAmount,
        recoveryRate,
        isLoading: false,
      });
    } catch (error) {
      console.error("회수 데이터 계산 실패:", error);
      setRecoveryData((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // 소송 유형 텍스트
  const getLawsuitTypeText = (type) => {
    switch (type) {
      case "civil":
        return "민사";
      case "criminal":
        return "형사";
      case "administrative":
        return "행정";
      case "family":
        return "가사";
      case "bankruptcy":
        return "파산";
      case "rehabilitation":
        return "회생";
      default:
        return type;
    }
  };

  // 소송 상태에 따른 배지
  const getLawsuitStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-amber-100 hover:bg-amber-200 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-800/50 border border-amber-200 dark:border-amber-800/50">
            <Calendar className="w-3 h-3 mr-1" />
            대기
          </Badge>
        );
      case "filed":
        return (
          <Badge className="bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-800/50 border border-blue-200 dark:border-blue-800/50">
            <FileText className="w-3 h-3 mr-1" />
            소제기
          </Badge>
        );
      case "in_progress":
        return (
          <Badge className="bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-800/50 border border-purple-200 dark:border-purple-800/50">
            <RefreshCw className="w-3 h-3 mr-1" />
            진행중
          </Badge>
        );
      case "decision":
        return (
          <Badge className="bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-800/50 border border-green-200 dark:border-green-800/50">
            <Gavel className="w-3 h-3 mr-1" />
            판결
          </Badge>
        );
      case "appeal":
        return (
          <Badge className="bg-orange-100 hover:bg-orange-200 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 dark:hover:bg-orange-800/50 border border-orange-200 dark:border-orange-800/50">
            <ArrowUpRight className="w-3 h-3 mr-1" />
            항소
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-800/50 border border-emerald-200 dark:border-emerald-800/50">
            완료
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* 요약 정보 대시보드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 회수 현황 카드 */}
        <Card className="border-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-xl text-blue-800 dark:text-blue-300">
              <CircleDollarSign className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
              회수 현황
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recoveryData.isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-2 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">수임 원금</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(recoveryData.principalAmount)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">원리금 합계</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(recoveryData.totalAmount)}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500 dark:text-gray-400">회수 진행률</p>
                    <p className="text-sm font-medium">{recoveryData.recoveryRate.toFixed(1)}%</p>
                  </div>
                  <div className="mt-2 relative h-2 overflow-hidden rounded-full bg-blue-100 dark:bg-blue-950/60">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 rounded-full"
                      style={{ width: `${Math.min(recoveryData.recoveryRate, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1 text-sm">
                    <p className="text-gray-500 dark:text-gray-400">
                      {formatCurrency(recoveryData.recoveredAmount)}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400">
                      {formatCurrency(recoveryData.totalAmount)}
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30"
                  onClick={calculateRecoveryData}
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  새로고침
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 당사자 정보 카드 */}
        <Card className="border-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40 shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-xl text-emerald-800 dark:text-emerald-300">
              <Scale className="mr-2 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              당사자 정보
            </CardTitle>
          </CardHeader>
          <CardContent>
            {parties.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">등록된 당사자가 없습니다</p>
              </div>
            ) : (
              <div className="space-y-3">
                {parties.slice(0, 4).map((party) => (
                  <div
                    key={party.id}
                    className="p-3 rounded-lg bg-white/60 dark:bg-emerald-900/20 border border-green-100 dark:border-emerald-900/30 flex justify-between items-center"
                  >
                    <div>
                      <Badge
                        className={cn(
                          "mb-1",
                          party.party_type === "plaintiff" || party.party_type === "creditor"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-900/50"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-900/50"
                        )}
                      >
                        {party.party_type === "plaintiff"
                          ? "원고"
                          : party.party_type === "defendant"
                          ? "피고"
                          : party.party_type === "creditor"
                          ? "채권자"
                          : party.party_type === "debtor"
                          ? "채무자"
                          : party.party_type}
                      </Badge>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {party.name || party.company_name || "무명"}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                ))}

                {parties.length > 4 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
                  >
                    더보기 ({parties.length - 4})
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 소송 정보 카드 */}
        <Card className="border-0 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/40 dark:to-violet-950/40 shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-xl text-purple-800 dark:text-purple-300">
              <Gavel className="mr-2 h-5 w-5 text-purple-600 dark:text-purple-400" />
              소송 정보
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingLawsuits ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : lawsuits.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">등록된 소송이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lawsuits.slice(0, 3).map((lawsuit) => (
                  <div
                    key={lawsuit.id}
                    className="p-3 rounded-lg bg-white/60 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-900/30 hover:border-purple-200 dark:hover:border-purple-800/50 transition-colors cursor-pointer"
                  >
                    <div className="flex justify-between items-start">
                      <div className="mb-1">
                        <span className="font-medium text-purple-700 dark:text-purple-300">
                          {getLawsuitTypeText(lawsuit.type)}
                        </span>
                        {lawsuit.court && (
                          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                            {lawsuit.court}
                          </span>
                        )}
                      </div>
                      {getLawsuitStatusBadge(lawsuit.status)}
                    </div>
                    <p className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                      {lawsuit.title || lawsuit.case_number || "제목 없음"}
                    </p>
                    {lawsuit.filing_date && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        소제기일: {formatDate(lawsuit.filing_date)}
                      </p>
                    )}
                  </div>
                ))}

                {lawsuits.length > 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/30"
                  >
                    더보기 ({lawsuits.length - 3})
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 최근 활동 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 회수 활동 */}
        <Card className="border-0 bg-white/80 dark:bg-slate-900/80 shadow-md rounded-xl overflow-hidden backdrop-blur-sm">
          <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800 mb-2">
            <CardTitle className="text-xl font-semibold">최근 회수 활동</CardTitle>
          </CardHeader>
          <CardContent className="p-4 max-h-[400px] overflow-y-auto">
            <RecoveryActivities caseId={caseId} limit={5} compact={true} />
          </CardContent>
        </Card>

        {/* 알림 */}
        <Card className="border-0 bg-white/80 dark:bg-slate-900/80 shadow-md rounded-xl overflow-hidden backdrop-blur-sm">
          <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800 mb-2">
            <CardTitle className="text-xl font-semibold">최근 알림</CardTitle>
          </CardHeader>
          <CardContent className="p-4 max-h-[400px] overflow-y-auto">
            <CaseNotifications caseId={caseId} limit={5} compact={true} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
