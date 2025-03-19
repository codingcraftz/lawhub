import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/format";
import { supabase } from "@/utils/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import CalendarView from "@/components/Calendar";
import {
  RefreshCw,
  DollarSign,
  PieChart,
  CreditCard,
  Percent,
  BarChart3,
  Bell,
} from "lucide-react";
import { toast } from "sonner";
import CaseNotifications from "./CaseNotifications";

export default function CaseDashboard({ caseId, caseData }) {
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [recoveryData, setRecoveryData] = useState({
    principalAmount: caseData?.principal_amount || 0,
    totalAmount: 0, // 원리금 (채권원금 + 이자 + 비용)
    recoveredAmount: 0, // 회수금액
    recoveryRate: 0, // 회수율
    isLoading: true,
  });

  useEffect(() => {
    calculateRecoveryData();
    fetchSchedules();
  }, [caseId]);

  // 월 변경 시 해당 월의 일정 가져오기
  useEffect(() => {
    fetchSchedules();
  }, [currentMonth]);

  // 일정 정보 가져오기
  const fetchSchedules = async () => {
    setLoadingSchedules(true);
    try {
      const startDate = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        1
      ).toISOString();
      const endDate = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        0,
        23,
        59,
        59
      ).toISOString();

      const { data, error } = await supabase
        .from("test_schedules")
        .select("*")
        .eq("case_id", caseId)
        .gte("event_date", startDate)
        .lte("event_date", endDate)
        .order("event_date", { ascending: true });

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error("일정 정보 조회 실패:", error);
      toast.error("일정 정보 조회에 실패했습니다");
    } finally {
      setLoadingSchedules(false);
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

  // 일정 관련 처리 함수
  const handleAddSchedule = (date) => {
    // 일정 추가 모달 열기 로직 (후에 구현)
    toast.info("일정 추가 기능은 준비 중입니다");
  };

  const handleEditSchedule = (schedule) => {
    // 일정 수정 모달 열기 로직 (후에 구현)
    toast.info("일정 수정 기능은 준비 중입니다");
  };

  const handleDeleteSchedule = (schedule) => {
    // 일정 삭제 확인 및 처리 로직 (후에 구현)
    toast.info("일정 삭제 기능은 준비 중입니다");
  };

  const handleRefreshSchedules = (month) => {
    setCurrentMonth(month);
    fetchSchedules();
  };

  return (
    <div className="space-y-8">
      {/* 채권 회수 현황 요약 */}
      <Card className="border-0 bg-white/90 dark:bg-slate-900/90 shadow-md rounded-xl overflow-hidden backdrop-blur-sm">
        <CardHeader className="pb-2 border-b border-gray-100 dark:border-gray-800">
          <CardTitle className="text-xl font-bold flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
            채권 회수 현황
          </CardTitle>
          <CardDescription>이 사건의 채권 원금, 회수 금액 및 회수율을 보여줍니다.</CardDescription>
        </CardHeader>
        <CardContent className="py-4">
          {recoveryData.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                <div className="flex items-center mb-2">
                  <DollarSign className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    채권 원금
                  </span>
                </div>
                <div className="font-bold text-gray-900 dark:text-white">
                  {formatCurrency(recoveryData.principalAmount)}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                <div className="flex items-center mb-2">
                  <PieChart className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    총 채권액
                  </span>
                </div>
                <div className="font-bold text-gray-900 dark:text-white">
                  {formatCurrency(recoveryData.totalAmount)}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                <div className="flex items-center mb-2">
                  <CreditCard className="w-5 h-5 mr-2 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    회수 금액
                  </span>
                </div>
                <div className="font-bold text-gray-900 dark:text-white">
                  {formatCurrency(recoveryData.recoveredAmount)}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                <div className="flex items-center mb-2">
                  <Percent className="w-5 h-5 mr-2 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    회수율
                  </span>
                </div>
                <div className="font-bold text-gray-900 dark:text-white">
                  {recoveryData.recoveryRate.toFixed(1)}%
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-0 pb-4">
          <div className="w-full mt-2">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">회수 진행률</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {recoveryData.recoveryRate.toFixed(1)}%
              </p>
            </div>
            <div className="relative h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(recoveryData.recoveryRate, 100)}%` }}
              />
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* 일정 달력 - 새 컴포넌트 사용 */}
      <CalendarView
        schedules={schedules}
        onAddSchedule={handleAddSchedule}
        onEditSchedule={handleEditSchedule}
        onDeleteSchedule={handleDeleteSchedule}
        isLoading={loadingSchedules}
        onRefresh={handleRefreshSchedules}
        title="사건 일정 달력"
        description="소송 기일, 분납 일정 등을 달력 형태로 확인할 수 있습니다."
      />
    </div>
  );
}
