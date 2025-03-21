"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, RefreshCw, Trash2, Edit, Download, Calendar, File } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// 모달 컴포넌트 가져오기
import AddSubmissionModal from "./modals/AddSubmissionModal";
import AddLawsuitModal from "./modals/AddLawsuitModal";
import ScheduleFormModal from "./modals/ScheduleFormModal";
// CaseTimeline 컴포넌트 가져오기
import CaseTimeline from "./LawsuitSubmissions";

const LAWSUIT_TYPES = {
  civil: { label: "민사소송", variant: "default" },
  payment_order: { label: "지급명령", variant: "secondary" },
  property_disclosure: { label: "재산명시", variant: "outline" },
  execution: { label: "강제집행", variant: "destructive" },
};

const LAWSUIT_STATUS = {
  pending: { label: "대기중", variant: "outline" },
  in_progress: { label: "진행", variant: "default" },
  completed: { label: "완료", variant: "destructive" },
};

const PARTY_ORDER = {
  plaintiff: 1, // 원고
  creditor: 2, // 채권자
  applicant: 3, // 신청인
  defendant: 4, // 피고
  debtor: 5, // 채무자
  respondent: 6, // 피신청인
};

export default function LawsuitManager({ caseId, onDataChange }) {
  const { user } = useUser();
  const [lawsuits, setLawsuits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [activeTab, setActiveTab] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [parties, setParties] = useState([]);

  // 모달 상태
  const [showAddSubmissionModal, setShowAddSubmissionModal] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState(null);
  const [showAddLawsuitModal, setShowAddLawsuitModal] = useState(false);
  const [editingLawsuit, setEditingLawsuit] = useState(null);
  // 기일 모달 관련 상태 추가
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);

  // 스토리지 버킷 이름 정의
  const BUCKET_NAME = "case-files";

  useEffect(() => {
    if (caseId) {
      fetchLawsuits();
      fetchParties();
    }
  }, [caseId]);

  useEffect(() => {
    if (activeTab) {
      fetchSubmissions(activeTab);
    }
  }, [activeTab]);

  const fetchLawsuits = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("test_case_lawsuits")
        .select(
          `
          *,
          test_lawsuit_parties(
            id,
            party_id,
            party_type,
            party:party_id(
              id,
              name,
              company_name,
              entity_type
            )
          )
        `
        )
        .eq("case_id", caseId)
        .order("filing_date", { ascending: false });

      if (error) throw error;

      setLawsuits(data || []);

      // 첫 번째 소송을 기본 선택
      if (data && data.length > 0 && !activeTab) {
        setActiveTab(data[0].id);
      }
    } catch (error) {
      console.error("소송 조회 실패:", error);
      toast.error("소송 목록을 불러오는데 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const fetchParties = async () => {
    try {
      const { data, error } = await supabase
        .from("test_case_parties")
        .select("*")
        .eq("case_id", caseId);

      if (error) throw error;
      setParties(data || []);
    } catch (error) {
      console.error("당사자 조회 실패:", error);
      toast.error("당사자 목록을 불러오는데 실패했습니다");
    }
  };

  const fetchSubmissions = async (lawsuitId) => {
    setLoadingSubmissions(true);
    try {
      // test_lawsuit_submissions 테이블이 아직 생성되지 않았거나 쿼리 문제가 있을 수 있음
      const { data, error } = await supabase
        .from("test_lawsuit_submissions")
        .select(
          `
          id,
          lawsuit_id,
          submission_type,
          document_type,
          submission_date,
          description,
          file_url,
          created_at,
          created_by,
          created_by_user:created_by(id, name, email)
        `
        )
        .eq("lawsuit_id", lawsuitId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("송달/제출 내역 조회 실패:", error);
        toast.error("송달/제출 내역을 불러오는데 실패했습니다");
        setSubmissions([]);
        return;
      }

      console.log("송달/제출 내역 조회 결과:", data);
      setSubmissions(data || []);
    } catch (error) {
      console.error("송달/제출 내역 조회 중 예외 발생:", error);
      toast.error("송달/제출 내역을 불러오는데 실패했습니다");
      setSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleAddSubmission = () => {
    setEditingSubmission(null);
    setShowAddSubmissionModal(true);
  };

  const handleEditSubmission = (submission) => {
    setEditingSubmission(submission);
    setShowAddSubmissionModal(true);
  };

  // 기일 추가 핸들러
  const handleAddSchedule = () => {
    setEditingSchedule(null);
    setShowAddScheduleModal(true);
  };

  // 기일 편집 핸들러
  const handleEditSchedule = (schedule) => {
    setEditingSchedule(schedule);
    setShowAddScheduleModal(true);
  };

  const getPartyTypeLabel = (partyType) => {
    switch (partyType) {
      case "plaintiff":
        return "원고";
      case "defendant":
        return "피고";
      case "creditor":
        return "채권자";
      case "debtor":
        return "채무자";
      case "applicant":
        return "신청인";
      case "respondent":
        return "피신청인";
      default:
        return "기타";
    }
  };

  const handleAddLawsuit = () => {
    setEditingLawsuit(null);
    setShowAddLawsuitModal(true);
  };

  const handleEditLawsuit = (lawsuit) => {
    setEditingLawsuit(lawsuit);
    setShowAddLawsuitModal(true);
  };

  const handleDeleteLawsuit = async (lawsuitId) => {
    try {
      // 1. 해당 소송에 속한 모든 제출 삭제
      const { error: submissionsError } = await supabase
        .from("test_lawsuit_submissions")
        .delete()
        .eq("lawsuit_id", lawsuitId);

      if (submissionsError) throw submissionsError;

      // 2. 해당 소송에 속한 기일 정보 삭제
      const { error: schedulesError } = await supabase
        .from("test_lawsuit_schedules")
        .delete()
        .eq("lawsuit_id", lawsuitId);

      if (schedulesError) throw schedulesError;

      // 3. 해당 소송에 속한 당사자 관계 삭제
      const { error: partiesError } = await supabase
        .from("test_lawsuit_parties")
        .delete()
        .eq("lawsuit_id", lawsuitId);

      if (partiesError) throw partiesError;

      // 4. 마지막으로 소송 자체 삭제
      const { error } = await supabase.from("test_case_lawsuits").delete().eq("id", lawsuitId);

      if (error) throw error;

      toast.success("소송 정보가 삭제되었습니다");

      // 소송 목록 새로고침
      fetchLawsuits();

      // 활성 탭 초기화
      setActiveTab(null);
      setSubmissions([]);

      // 데이터 변경 알림
      if (onDataChange) onDataChange();
    } catch (error) {
      console.error("소송 삭제 실패:", error);
      toast.error("소송 삭제에 실패했습니다");
    }
  };

  const handleSubmissionSuccess = (data) => {
    setEditingSubmission(null);
    setShowAddSubmissionModal(false);
    toast.success("제출 정보가 저장되었습니다");
    // 제출 정보 다시 불러오기
    fetchSubmissions(activeTab);
    // 데이터 변경 알림
    if (onDataChange) onDataChange();
  };

  const handleLawsuitSuccess = (addedLawsuit) => {
    setEditingLawsuit(null);
    setShowAddLawsuitModal(false);
    fetchLawsuits();
    // 데이터 변경 알림
    if (onDataChange) onDataChange();
  };

  const renderLawsuitInfo = (lawsuit) => {
    if (!lawsuit) return null;

    const getLawsuitType = (type) => {
      return LAWSUIT_TYPES[type] || { label: type, variant: "default" };
    };

    const getStatusBadge = (status) => {
      const statusInfo = LAWSUIT_STATUS[status] || { label: status, variant: "default" };
      return (
        <Badge variant={statusInfo.variant} className="ml-2">
          {statusInfo.label}
        </Badge>
      );
    };

    const formatDate = (dateStr) => {
      if (!dateStr) return "미지정";
      return format(new Date(dateStr), "yyyy년 MM월 dd일", { locale: ko });
    };

    const { label: typeLabel } = getLawsuitType(lawsuit.lawsuit_type);

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            {lawsuit.description && (
              <p className="whitespace-pre-line text-gray-400">{lawsuit.description}</p>
            )}
            {lawsuit.test_lawsuit_parties && lawsuit.test_lawsuit_parties.length > 0 ? (
              (() => {
                // lawsuit 내부에서 실시간으로 데이터 그룹화
                const groupedParties = lawsuit.test_lawsuit_parties.reduce((acc, partyRel) => {
                  // party 정보가 partyRel.party에 있는 경우 (조인된 경우)
                  const party = partyRel.party || parties.find((p) => p.id === partyRel.party_id);
                  if (!party) return acc;

                  const label = getPartyTypeLabel(partyRel.party_type);
                  if (!acc[label]) acc[label] = [];

                  // entity_type에 따라 이름 표시 방법 결정
                  const partyName =
                    party.entity_type === "individual"
                      ? party.name
                      : party.company_name || "이름 정보 없음";

                  acc[label].push(partyName);
                  return acc;
                }, {});

                // 정렬된 키 리스트
                const sortedPartyTypes = Object.keys(groupedParties).sort(
                  (a, b) => (PARTY_ORDER[a] || 99) - (PARTY_ORDER[b] || 99)
                );

                return (
                  <div className="space-y-2">
                    {sortedPartyTypes.map((partyType) => (
                      <p key={partyType} className="text-sm">
                        <span className="font-medium">{partyType}:</span>{" "}
                        {groupedParties[partyType].join(", ")}
                      </p>
                    ))}
                  </div>
                );
              })()
            ) : (
              <p className="text-sm text-muted-foreground">등록된 당사자가 없습니다.</p>
            )}
          </div>

          {user && (user.role === "admin" || user.role === "staff") && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleEditLawsuit(lawsuit)}>
                <Edit className="h-4 w-4 mr-1" />
                수정
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-red-500">
                    <Trash2 className="h-4 w-4 mr-1" />
                    삭제
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>소송 삭제</AlertDialogTitle>
                    <AlertDialogDescription>
                      이 소송을 정말로 삭제하시겠습니까? 관련된 모든 송달/제출 내역도 함께
                      삭제됩니다. 이 작업은 되돌릴 수 없습니다.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>취소</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDeleteLawsuit(lawsuit.id)}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      삭제
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>

        {/* CaseTimeline 컴포넌트 사용 - AddSubmissionModal과 연결 */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-lg ">소송 진행 타임라인</h3>
            {user && (user.role === "admin" || user.role === "staff") && (
              <div className="flex space-x-2">
                <Button size="sm" onClick={handleAddSchedule}>
                  <Calendar className="h-4 w-4 mr-1" />
                  기일 추가
                </Button>
                <Button size="sm" onClick={handleAddSubmission}>
                  문서 추가
                </Button>
              </div>
            )}
          </div>
          <CaseTimeline
            id="timeline-component"
            lawsuit={lawsuits.find((l) => l.id === activeTab)}
            viewOnly={!(user && (user.role === "admin" || user.role === "staff"))}
            onSuccess={() => {
              toast.success("타임라인이 업데이트되었습니다");
            }}
            onEdit={handleEditSubmission}
            onScheduleEdit={handleEditSchedule}
            onScheduleAdd={handleAddSchedule}
          />
        </div>
      </div>
    );
  };

  // 로딩 상태 표시
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full max-w-[300px]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // 소송이 없는 경우
  if (lawsuits.length === 0) {
    return (
      <div className="text-center py-12 border rounded-md bg-white/90 dark:bg-slate-900/90 shadow-md backdrop-blur-sm">
        <File className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
        <p className="mb-4 text-muted-foreground">등록된 소송이 없습니다</p>
        {user && (user.role === "admin" || user.role === "staff") && (
          <Button
            variant="outline"
            onClick={handleAddLawsuit}
            className="bg-white/90 hover:bg-gray-100 dark:bg-slate-800/90 dark:hover:bg-slate-800 border border-gray-200 dark:border-gray-700"
          >
            <Plus className="mr-2 h-4 w-4" /> 소송 등록하기
          </Button>
        )}
        {showAddLawsuitModal && (
          <AddLawsuitModal
            open={showAddLawsuitModal}
            onOpenChange={setShowAddLawsuitModal}
            onSuccess={handleLawsuitSuccess}
            caseId={caseId}
            parties={parties}
            editingLawsuit={editingLawsuit}
          />
        )}
      </div>
    );
  }

  return (
    <Card className="space-y-6 border-0 bg-white/90 dark:bg-slate-900/90 shadow-md rounded-xl overflow-hidden backdrop-blur-sm">
      <CardHeader className="pb-2 border-b border-gray-100 dark:border-gray-800">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-semibold">소송 관리</CardTitle>
          <div className="flex gap-2">
            {user && (user.role === "admin" || user.role === "staff") && (
              <Button size="sm" onClick={handleAddLawsuit}>
                <Plus className="mr-1 h-4 w-4" />
                소송 등록
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-3">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4 w-full flex flex-wrap h-auto bg-gray-50 dark:bg-gray-900/50 border rounded-lg overflow-hidden">
            {loading ? (
              <div className="w-full p-2">
                <Skeleton className="h-8 w-full" />
              </div>
            ) : lawsuits.length === 0 ? (
              <div className="text-center py-10 border rounded-md bg-white/90 dark:bg-slate-900/90 shadow-sm backdrop-blur-sm">
                <File className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2 text-foreground">등록된 소송이 없습니다</h3>
                <p className="text-muted-foreground mb-4">
                  소송 정보를 추가하면 이 곳에 표시됩니다.
                </p>
                {user && (user.role === "admin" || user.role === "staff") && (
                  <Button
                    onClick={handleAddLawsuit}
                    className="bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-600 dark:hover:bg-blue-700"
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    소송 등록하기
                  </Button>
                )}
              </div>
            ) : (
              lawsuits.map((lawsuit) => {
                const type = LAWSUIT_TYPES[lawsuit.lawsuit_type] || {
                  label: lawsuit.lawsuit_type,
                  variant: "default",
                };
                const status = LAWSUIT_STATUS[lawsuit.status] || {
                  label: lawsuit.status,
                  variant: "default",
                };

                return (
                  <TabsTrigger
                    key={lawsuit.id}
                    value={lawsuit.id}
                    className="flex-none h-auto py-2 px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 border-b-2 border-transparent data-[state=active]:border-blue-500"
                  >
                    <div className="flex flex-col items-start space-y-1">
                      <div className="flex items-center">
                        <span>{type.label}</span>
                        <span className="mx-1">-</span>
                        <span className="font-mono">{lawsuit.case_number}</span>
                      </div>
                      <Badge variant={status.variant} className="text-xs">
                        {status.label}
                      </Badge>
                    </div>
                  </TabsTrigger>
                );
              })
            )}
          </TabsList>

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-[200px] w-full" />
              <Skeleton className="h-[100px] w-full" />
              <Skeleton className="h-[150px] w-full" />
            </div>
          ) : lawsuits.length === 0 ? (
            <div className="text-center py-10 border rounded-md bg-white/90 dark:bg-slate-900/90 shadow-sm backdrop-blur-sm">
              <File className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2 text-foreground">등록된 소송이 없습니다</h3>
              <p className="text-muted-foreground mb-4">소송 정보를 추가하면 이 곳에 표시됩니다.</p>
              {user && (user.role === "admin" || user.role === "staff") && (
                <Button
                  onClick={handleAddLawsuit}
                  className="bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-600 dark:hover:bg-blue-700"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  소송 등록하기
                </Button>
              )}
            </div>
          ) : (
            lawsuits.map((lawsuit) => (
              <TabsContent key={lawsuit.id} value={lawsuit.id}>
                <div className="space-y-6">{renderLawsuitInfo(lawsuit)}</div>
              </TabsContent>
            ))
          )}
        </Tabs>
      </CardContent>

      {/* 송달/제출 내역 추가/수정 모달 */}
      {showAddSubmissionModal && (
        <AddSubmissionModal
          open={showAddSubmissionModal}
          onOpenChange={setShowAddSubmissionModal}
          onSuccess={handleSubmissionSuccess}
          parties={parties}
          caseId={caseId}
          lawsuitId={activeTab}
          editingSubmission={editingSubmission}
          lawsuitType={lawsuits.find((l) => l.id === activeTab)?.lawsuit_type}
        />
      )}

      {/* 소송 추가/수정 모달 */}
      {showAddLawsuitModal && (
        <AddLawsuitModal
          open={showAddLawsuitModal}
          onOpenChange={setShowAddLawsuitModal}
          onSuccess={handleLawsuitSuccess}
          caseId={caseId}
          parties={parties}
          editingLawsuit={editingLawsuit}
        />
      )}

      {/* 기일 추가/수정 모달 */}
      {showAddScheduleModal && (
        <ScheduleFormModal
          open={showAddScheduleModal}
          onOpenChange={setShowAddScheduleModal}
          onSuccess={handleSubmissionSuccess}
          lawsuit={lawsuits.find((l) => l.id === activeTab)}
          editingSchedule={editingSchedule}
        />
      )}
    </Card>
  );
}
