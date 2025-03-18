"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useParams, useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  RefreshCw,
  FileText,
  BarChart2,
  Clock,
  FileUp,
  History,
  Bell,
  AlertTriangle,
  ChevronRight,
  Plus,
  CalendarPlus,
  Scale,
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { formatCurrency, formatDate } from "@/utils/format";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import CaseDetailHeader from "./components/CaseDetailHeader";
import CaseProgressTimeline from "./components/CaseProgressTimeline";
import RecoveryActivities from "./components/RecoveryActivities";
import CaseNotifications from "./components/CaseNotifications";
import CaseDashboard from "./components/CaseDashboard";
import LawsuitManager from "./components/LawsuitManager";
import CaseDocuments from "./components/CaseDocuments";

export default function CasePage() {
  const pathname = usePathname();
  const router = useRouter();
  const { id: caseId } = useParams();
  const { user } = useUser();

  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [parties, setParties] = useState([]);
  const [clients, setClients] = useState([]);

  // 모달 상태 관리
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

  // 케이스 정보 가져오기
  const fetchCaseDetails = async () => {
    setLoading(true);
    try {
      // 기본 정보 가져오기
      const { data: caseData, error: caseError } = await supabase
        .from("test_cases")
        .select("*, status_info:status_id(name, color)")
        .eq("id", caseId)
        .single();

      if (caseError) throw caseError;

      // 당사자 정보 가져오기
      const { data: partiesData, error: partiesError } = await supabase
        .from("test_case_parties")
        .select("*")
        .eq("case_id", caseId);

      if (partiesError) throw partiesError;

      // 의뢰인 정보 가져오기
      const { data: clientsData, error: clientsError } = await supabase
        .from("test_case_clients")
        .select(
          `
          *,
          individual_id(id, name),
          organization_id(id, name, representative_name)
        `
        )
        .eq("case_id", caseId);

      if (clientsError) throw clientsError;

      // 의뢰인 정보 가공
      const processedClients = clientsData.map((client) => {
        return {
          ...client,
          client_type: client.individual_id ? "individual" : "organization",
          individual_name: client.individual_id?.name,
          organization_name: client.organization_id?.name,
          representative_name: client.organization_id?.representative_name,
        };
      });

      setCaseData(caseData);
      setParties(partiesData || []);
      setClients(processedClients || []);
    } catch (error) {
      console.error("케이스 정보 가져오기 실패:", error);
      toast.error("케이스 정보 가져오기 실패", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (caseId && user) {
      fetchCaseDetails();
    }
  }, [caseId, user]);

  if (loading) {
    return (
      <div className="container p-4 mx-auto">
        <div className="space-y-2 mb-6">
          <Button variant="ghost" size="sm" className="mb-6" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            돌아가기
          </Button>
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <Skeleton className="h-[400px] w-full" />
          </div>
          <div className="md:col-span-3">
            <Skeleton className="h-[600px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="container p-4 mx-auto">
        <div className="space-y-2 mb-6">
          <Button variant="ghost" size="sm" className="mb-6" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            돌아가기
          </Button>
          <h2 className="text-xl font-bold">사건 정보를 찾을 수 없습니다</h2>
        </div>
      </div>
    );
  }

  // 상태에 따른 배지 색상 매핑
  const getStatusColor = (status) => {
    const statusMap = {
      active: "bg-blue-500 hover:bg-blue-600",
      pending: "bg-amber-500 hover:bg-amber-600",
      closed: "bg-gray-500 hover:bg-gray-600",
      filed: "bg-emerald-500 hover:bg-emerald-600",
      in_progress: "bg-violet-500 hover:bg-violet-600",
      decision: "bg-sky-500 hover:bg-sky-600",
      completed: "bg-green-500 hover:bg-green-600",
      appeal: "bg-orange-500 hover:bg-orange-600",
    };

    return statusMap[status] || "bg-slate-500 hover:bg-slate-600";
  };

  // 당사자 유형에 따른 색상
  const getPartyTypeColor = (type) => {
    const typeMap = {
      plaintiff: "text-blue-600",
      defendant: "text-red-600",
      creditor: "text-emerald-600",
      debtor: "text-amber-600",
      applicant: "text-purple-600",
      respondent: "text-orange-600",
    };

    return typeMap[type] || "text-gray-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900 dark:to-gray-900">
      <div className="container p-6 mx-auto">
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            className="mb-6 hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            돌아가기
          </Button>
          <CaseDetailHeader caseData={caseData} onRefresh={fetchCaseDetails} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 사이드바 */}
          <div className="md:col-span-1">
            <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl overflow-hidden transition-all hover:shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 pb-4">
                <CardTitle className="text-lg font-semibold">사건 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pt-5">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">사건 번호</p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    {caseData.case_number || "번호 없음"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">상태</p>
                  {caseData.status_info?.color ? (
                    <Badge
                      className="font-medium text-white px-3 py-1"
                      style={{ backgroundColor: caseData.status_info.color }}
                    >
                      {caseData.status_info?.name || "미정"}
                    </Badge>
                  ) : (
                    <Badge
                      className={cn(
                        "font-medium text-white px-3 py-1",
                        getStatusColor(caseData.status)
                      )}
                    >
                      {caseData.status === "active"
                        ? "진행중"
                        : caseData.status === "closed"
                        ? "종결"
                        : caseData.status || "미정"}
                    </Badge>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">금액</p>
                  <p className="font-medium text-gray-800 dark:text-gray-200 text-lg">
                    {formatCurrency(caseData.amount || caseData.principal_amount)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">등록일</p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    {formatDate(caseData.created_at)}
                  </p>
                </div>

                <Separator className="my-2 bg-gray-200 dark:bg-gray-700" />

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 font-medium">
                    당사자
                  </p>
                  <div className="space-y-3">
                    {parties.map((party) => (
                      <div
                        key={party.id}
                        className="text-sm flex justify-between bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg"
                      >
                        <span className={cn("font-medium", getPartyTypeColor(party.party_type))}>
                          {party.party_type === "plaintiff"
                            ? "원고"
                            : party.party_type === "defendant"
                            ? "피고"
                            : party.party_type === "creditor"
                            ? "채권자"
                            : party.party_type === "debtor"
                            ? "채무자"
                            : party.party_type}
                        </span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {party.name || party.company_name || "이름 없음"}
                        </span>
                      </div>
                    ))}
                    {parties.length === 0 && (
                      <div className="text-center py-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                          등록된 당사자 없음
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 font-medium">
                    의뢰인
                  </p>
                  <div className="space-y-3">
                    {clients.map((client) => (
                      <div
                        key={client.id}
                        className="text-sm bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg"
                      >
                        <span className="font-medium text-blue-600 dark:text-blue-400">
                          {client.client_type === "individual"
                            ? client.individual_name || "개인 의뢰인"
                            : client.organization_name || "법인/단체 의뢰인"}
                        </span>
                        {client.client_type === "organization" && client.representative_name && (
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                            (대표: {client.representative_name})
                          </span>
                        )}
                      </div>
                    ))}
                    {clients.length === 0 && (
                      <div className="text-center py-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                          등록된 의뢰인 없음
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator className="my-2 bg-gray-200 dark:bg-gray-700" />

                {user && (user.role === "staff" || user.role === "admin") && (
                  <div className="space-y-3 pt-2">
                    <Button
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all border-0 flex items-center gap-2"
                      data-open-add-lawsuit
                      onClick={() => setShowLawsuitModal(true)}
                    >
                      <Scale size={16} className="text-blue-100" />
                      소송 등록
                    </Button>

                    <Button
                      className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all border-0 flex items-center gap-2"
                      onClick={() => setShowRecoveryModal(true)}
                    >
                      <CalendarPlus size={16} className="text-emerald-100" />
                      회수활동 등록
                    </Button>

                    <Button
                      className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md hover:shadow-lg transition-all border-0 flex items-center gap-2"
                      onClick={() => setShowDocumentModal(true)}
                    >
                      <FileUp size={16} className="text-amber-100" />
                      문서 업로드
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 메인 컨텐츠 */}
          <div className="md:col-span-3">
            <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl overflow-hidden">
              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="w-full border-b rounded-none justify-start bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 h-auto p-0 gap-x-1">
                    <TabsTrigger
                      value="dashboard"
                      className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:font-medium data-[state=active]:shadow-none rounded-none px-5 py-3 data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-700 transition-all"
                    >
                      <BarChart2 className="h-4 w-4 mr-2" />
                      대시보드
                    </TabsTrigger>
                    <TabsTrigger
                      value="progress"
                      className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:font-medium data-[state=active]:shadow-none rounded-none px-5 py-3 data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-700 transition-all"
                    >
                      <History className="h-4 w-4 mr-2" />
                      진행상황
                    </TabsTrigger>
                    <TabsTrigger
                      value="lawsuits"
                      className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:font-medium data-[state=active]:shadow-none rounded-none px-5 py-3 data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-700 transition-all"
                    >
                      <Scale className="h-4 w-4 mr-2" />
                      소송
                    </TabsTrigger>
                    <TabsTrigger
                      value="recovery"
                      className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:font-medium data-[state=active]:shadow-none rounded-none px-5 py-3 data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-700 transition-all"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      회수활동
                    </TabsTrigger>
                    <TabsTrigger
                      value="documents"
                      className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:font-medium data-[state=active]:shadow-none rounded-none px-5 py-3 data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-700 transition-all"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      문서
                    </TabsTrigger>
                    <TabsTrigger
                      value="notifications"
                      className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:font-medium data-[state=active]:shadow-none rounded-none px-5 py-3 data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-700 transition-all"
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      알림
                    </TabsTrigger>
                  </TabsList>

                  <div className="p-5">
                    <TabsContent value="dashboard" className="mt-0">
                      <CaseDashboard
                        caseId={caseId}
                        caseData={caseData}
                        parties={parties}
                        clients={clients}
                      />
                    </TabsContent>

                    <TabsContent value="progress" className="mt-0">
                      <CaseProgressTimeline caseId={caseId} />
                    </TabsContent>

                    <TabsContent value="lawsuits" className="mt-0">
                      <LawsuitManager caseId={caseId} parties={parties} viewMode={true} />
                    </TabsContent>

                    <TabsContent value="recovery" className="mt-0">
                      <RecoveryActivities caseId={caseId} />
                    </TabsContent>

                    <TabsContent value="documents" className="mt-0">
                      <CaseDocuments caseId={caseId} />
                    </TabsContent>

                    <TabsContent value="notifications" className="mt-0">
                      <CaseNotifications caseId={caseId} />
                    </TabsContent>
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
