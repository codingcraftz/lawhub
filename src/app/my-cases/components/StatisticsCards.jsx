"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  BarChart3,
  CircleDollarSign,
  FileText,
  CheckCheck,
  FileClock,
  TrendingUp,
  PieChartIcon,
  FileBarChart,
  BadgePercent,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function StatisticsCards({ stats, recoveryStats }) {
  // 통화 형식으로 변환하는 함수
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // 월별 회수 데이터를 위한 상태 (임시 데이터)
  const [monthlyRecoveryStats, setMonthlyRecoveryStats] = useState([]);
  const [monthlyStatsLoading, setMonthlyStatsLoading] = useState(true);

  // 컴포넌트 마운트시 임시 월별 데이터 생성
  useEffect(() => {
    // 로딩 상태 활성화
    setMonthlyStatsLoading(true);

    // 데이터 생성 약간 지연시켜서 로딩 효과 확인
    setTimeout(() => {
      const currentDate = new Date();
      const lastSixMonths = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(currentDate.getMonth() - i);
        return {
          name: date
            .toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit" })
            .replace(". ", "-")
            .replace(".", ""),
          회수금액: Math.floor(Math.random() * 5000000) + 1000000,
          회수건수: Math.floor(Math.random() * 10) + 1,
        };
      }).reverse();

      setMonthlyRecoveryStats(lastSixMonths);
      setMonthlyStatsLoading(false);
    }, 500);
  }, []);

  return (
    <div className="space-y-6">
      {/* 기본 통계 카드 */}
      <div className="grid grid-cols-2 gap-4 mb-6 md:grid-cols-4">
        <Card className="overflow-hidden shadow-sm border-0">
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-4">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none text-muted-foreground">총 사건</p>
                <p className="text-2xl font-bold">{stats.totalCases}</p>
              </div>
              <div className="p-2 bg-blue-100/50 dark:bg-blue-900/20 rounded-lg">
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
            </div>
            <div className="flex bg-blue-50 dark:bg-blue-900/10">
              <div className="flex-1 py-2 px-4 text-xs border-r border-blue-100 dark:border-blue-900/30">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center">
                    <CheckCheck className="h-3 w-3 mr-1" /> 완료
                  </span>
                  <span className="font-medium">{stats.closedCases}</span>
                </div>
              </div>
              <div className="flex-1 py-2 px-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center">
                    <FileClock className="h-3 w-3 mr-1" /> 진행중
                  </span>
                  <span className="font-medium">{stats.activeCases}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden shadow-sm border-0">
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-4">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none text-muted-foreground">총 채권액</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(recoveryStats.totalDebtAmount).replace("₩", "")}
                </p>
              </div>
              <div className="p-2 bg-amber-100/50 dark:bg-amber-900/20 rounded-lg">
                <CircleDollarSign className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            <div className="flex bg-amber-50 dark:bg-amber-900/10">
              <div className="flex-1 py-2 px-4 text-xs border-r border-amber-100 dark:border-amber-900/30">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" /> 원금
                  </span>
                  <span className="font-medium">
                    {formatCurrency(recoveryStats.totalPrincipalAmount).replace("₩", "")}
                  </span>
                </div>
              </div>
              <div className="flex-1 py-2 px-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center">
                    <BadgePercent className="h-3 w-3 mr-1" /> 이자/비용
                  </span>
                  <span className="font-medium">
                    {formatCurrency(
                      recoveryStats.totalDebtAmount - recoveryStats.totalPrincipalAmount
                    ).replace("₩", "")}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden shadow-sm border-0">
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-4">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none text-muted-foreground">회수금액</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(recoveryStats.totalRecoveredAmount).replace("₩", "")}
                </p>
              </div>
              <div className="p-2 bg-green-100/50 dark:bg-green-900/20 rounded-lg">
                <PieChartIcon className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/10 py-2 px-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">회수율</span>
                <span className="font-medium">{recoveryStats.recoveryRate.toFixed(1)}%</span>
              </div>
              <div className="mt-1 h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{
                    width: `${Math.min(recoveryStats.recoveryRate, 100)}%`,
                  }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden shadow-sm border-0">
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-4">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none text-muted-foreground">
                  잔여 채권액
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    recoveryStats.totalDebtAmount - recoveryStats.totalRecoveredAmount
                  ).replace("₩", "")}
                </p>
              </div>
              <div className="p-2 bg-red-100/50 dark:bg-red-900/20 rounded-lg">
                <FileBarChart className="h-5 w-5 text-red-600" />
              </div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/10 py-2 px-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">미회수율</span>
                <span className="font-medium">
                  {(100 - recoveryStats.recoveryRate).toFixed(1)}%
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full"
                  style={{
                    width: `${Math.min(100 - recoveryStats.recoveryRate, 100)}%`,
                  }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 상세 통계 카드 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 채권 총액 상세 분석 카드 */}
        <Card className="lg:col-span-1 shadow-sm overflow-hidden border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-lg flex items-center">
              <CircleDollarSign className="h-5 w-5 mr-2 text-amber-500" /> 채권 구성
            </CardTitle>
            <CardDescription>원금, 이자, 비용의 비율</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-4">
              <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-4">
                {formatCurrency(recoveryStats.totalDebtAmount)}
              </div>
              <div className="w-full max-w-xs">
                <div className="flex justify-between text-sm mb-1">
                  <span>원금</span>
                  <span className="font-medium">
                    {formatCurrency(recoveryStats.totalPrincipalAmount)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${
                        (recoveryStats.totalPrincipalAmount / recoveryStats.totalDebtAmount) * 100
                      }%`,
                    }}
                  ></div>
                </div>

                <div className="flex justify-between text-sm mb-1">
                  <span>이자</span>
                  <span className="font-medium">
                    {formatCurrency(
                      (recoveryStats.totalDebtAmount - recoveryStats.totalPrincipalAmount) * 0.7
                    )}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                  <div
                    className="bg-purple-500 h-2 rounded-full"
                    style={{
                      width: `${
                        (((recoveryStats.totalDebtAmount - recoveryStats.totalPrincipalAmount) *
                          0.7) /
                          recoveryStats.totalDebtAmount) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>

                <div className="flex justify-between text-sm mb-1">
                  <span>비용</span>
                  <span className="font-medium">
                    {formatCurrency(
                      (recoveryStats.totalDebtAmount - recoveryStats.totalPrincipalAmount) * 0.3
                    )}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{
                      width: `${
                        (((recoveryStats.totalDebtAmount - recoveryStats.totalPrincipalAmount) *
                          0.3) /
                          recoveryStats.totalDebtAmount) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 회수 현황 카드 */}
        <Card className="lg:col-span-2 shadow-sm overflow-hidden border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-lg flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-emerald-500" /> 회수 현황
            </CardTitle>
            <CardDescription>회수금액과 회수율 분석</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-col space-y-6">
              {/* 회수 통계 요약 */}
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-1 mx-auto border border-emerald-200 dark:border-emerald-800/50">
                    <CircleDollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-xs text-muted-foreground">회수금액</p>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(recoveryStats.totalRecoveredAmount)}
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-1 mx-auto border border-purple-200 dark:border-purple-800/50">
                    <PieChartIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <p className="text-xs text-muted-foreground">회수율</p>
                  <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    {recoveryStats.recoveryRate.toFixed(1)}%
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-1 mx-auto border border-red-200 dark:border-red-800/50">
                    <FileBarChart className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <p className="text-xs text-muted-foreground">잔여 채권액</p>
                  <p className="text-lg font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(
                      recoveryStats.totalDebtAmount - recoveryStats.totalRecoveredAmount
                    )}
                  </p>
                </div>
              </div>

              {/* 회수율 진행 바 */}
              <div>
                <div className="mb-1 text-sm font-medium flex justify-between">
                  <span>회수 진행률</span>
                  <span>{recoveryStats.recoveryRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-4">
                  <div
                    className="h-4 rounded-full bg-emerald-500 flex items-center justify-end"
                    style={{ width: `${Math.min(recoveryStats.recoveryRate, 100)}%` }}
                  >
                    {recoveryStats.recoveryRate >= 10 && (
                      <span className="px-2 text-xs text-white font-medium">
                        {recoveryStats.recoveryRate.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 월별 회수 통계 */}
              <div>
                <h4 className="text-sm font-medium mb-3">월별 회수 추이</h4>
                <div className="relative h-[180px] flex items-end space-x-2 border-b border-l border-gray-200 dark:border-gray-700 p-2">
                  {monthlyStatsLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  ) : monthlyRecoveryStats.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-muted-foreground text-sm">회수 데이터가 없습니다</p>
                    </div>
                  ) : (
                    monthlyRecoveryStats.map((item, index) => {
                      // 최대값 기준으로 높이 계산
                      const maxValue = Math.max(...monthlyRecoveryStats.map((d) => d.회수금액));
                      const height = (item.회수금액 / maxValue) * 100;

                      return (
                        <div key={index} className="flex flex-col items-center flex-1">
                          <div className="w-full flex justify-center">
                            <div
                              className="w-5/6 rounded-t-sm bg-emerald-500 dark:bg-emerald-600 relative group cursor-pointer"
                              style={{ height: `${Math.max(height, 15)}%` }}
                            >
                              <div className="absolute inset-x-0 bottom-full mb-1 hidden group-hover:block z-10">
                                <div className="bg-black text-white text-xs rounded py-1 px-2 text-center mx-auto w-max transform -translate-x-1/2 left-1/2 relative">
                                  {formatCurrency(item.회수금액)}
                                </div>
                              </div>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs text-white font-semibold">
                                  {item.회수건수}건
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {item.name.split("-")[1]}월
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
