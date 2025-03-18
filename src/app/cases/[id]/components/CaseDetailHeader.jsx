import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CaseDetailHeader({ caseData, onRefresh }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-200 dark:to-gray-400 bg-clip-text text-transparent">
          {caseData.case_info || "제목 없음"}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 flex flex-wrap items-center gap-2">
          {caseData.court_name && (
            <span className="flex items-center px-3 py-1 bg-blue-50 dark:bg-blue-950/40 rounded-full text-sm">
              <span className="font-medium text-blue-600 dark:text-blue-400">법원:</span>
              <span className="ml-1">{caseData.court_name}</span>
            </span>
          )}
          {caseData.case_number && (
            <span className="flex items-center px-3 py-1 bg-amber-50 dark:bg-amber-950/40 rounded-full text-sm">
              <span className="font-medium text-amber-600 dark:text-amber-400">사건번호:</span>
              <span className="ml-1">{caseData.case_number}</span>
            </span>
          )}
        </p>
      </div>
      {onRefresh && (
        <Button
          variant="outline"
          size="sm"
          className="mt-3 sm:mt-0 flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm transition-all"
          onClick={onRefresh}
        >
          <RefreshCw size={14} className="text-blue-500 dark:text-blue-400" />
          새로고침
        </Button>
      )}
    </div>
  );
}
