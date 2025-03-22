"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  FileText,
  CheckCheck,
  FileClock,
  CircleDollarSign,
  TrendingUp,
  BadgePercent,
  CheckCircle,
  Clock,
} from "lucide-react";

export default function StatisticsCards({ stats, recoveryStats }) {
  // 통화 형식으로 변환하는 함수
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-2 gap-4 mb-8 md:grid-cols-4">
      <Card className="overflow-hidden">
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

      <Card className="overflow-hidden">
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

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-4">
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none text-muted-foreground">회수금액</p>
              <p className="text-2xl font-bold">
                {formatCurrency(recoveryStats.totalRecoveredAmount).replace("₩", "")}
              </p>
            </div>
            <div className="p-2 bg-green-100/50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
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

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-4">
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none text-muted-foreground">평균 처리일</p>
              <p className="text-2xl font-bold">{stats.avgProcessingDays || 0}일</p>
            </div>
            <div className="p-2 bg-purple-100/50 dark:bg-purple-900/20 rounded-lg">
              <Clock className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/10 py-2 px-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">진행중 사건</span>
              <span className="font-medium">{stats.activeCases}건</span>
            </div>
            <div className="mt-1 h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full"
                style={{
                  width: `${Math.min((stats.activeCases / stats.totalCases) * 100 || 0, 100)}%`,
                }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
