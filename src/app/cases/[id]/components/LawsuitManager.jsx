"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

// 모달 컴포넌트 가져오기
import AddSubmissionModal from "./modals/AddSubmissionModal";
import AddLawsuitModal from "./modals/AddLawsuitModal";

const LAWSUIT_TYPES = {
  civil: { label: "민사소송", variant: "default" },
  payment_order: { label: "지급명령", variant: "secondary" },
  property_disclosure: { label: "재산명시", variant: "outline" },
  execution: { label: "강제집행", variant: "destructive" },
};

const LAWSUIT_STATUS = {
  pending: { label: "예정", variant: "outline" },
  filed: { label: "접수", variant: "secondary" },
  in_progress: { label: "진행", variant: "default" },
  decision: { label: "결정", variant: "success" },
  completed: { label: "완료", variant: "destructive" },
  appeal: { label: "항소", variant: "warning" },
};

export default function LawsuitManager({ caseId }) {
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
            party_type
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

  const handleDeleteSubmission = async (submissionId) => {
    try {
      // 첨부파일 정보 조회
      const { data: submissionData, error: fetchError } = await supabase
        .from("test_lawsuit_submissions")
        .select("file_url")
        .eq("id", submissionId)
        .single();

      if (fetchError) throw fetchError;

      // 파일이 있으면 삭제
      if (submissionData.file_url) {
        const { error: storageError } = await supabase.storage
          .from(BUCKET_NAME)
          .remove([submissionData.file_url]);

        if (storageError) {
          console.error("파일 삭제 실패:", storageError);
        }
      }

      // 내역 삭제
      const { error } = await supabase
        .from("test_lawsuit_submissions")
        .delete()
        .eq("id", submissionId);

      if (error) throw error;

      // 목록 업데이트
      setSubmissions(submissions.filter((item) => item.id !== submissionId));
      toast.success("송달/제출 내역이 삭제되었습니다");
    } catch (error) {
      console.error("송달/제출 내역 삭제 실패:", error);
      toast.error("송달/제출 내역 삭제에 실패했습니다");
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
      // 소송 삭제 (관련 송달/제출 내역도 cascade로 함께 삭제됨)
      const { error } = await supabase.from("test_case_lawsuits").delete().eq("id", lawsuitId);

      if (error) throw error;

      // 목록 업데이트
      setLawsuits(lawsuits.filter((item) => item.id !== lawsuitId));

      // 삭제한 소송이 현재 선택된 소송이면, 다른 소송 선택
      if (activeTab === lawsuitId) {
        if (lawsuits.length > 1) {
          const remainingLawsuits = lawsuits.filter((item) => item.id !== lawsuitId);
          setActiveTab(remainingLawsuits[0]?.id || null);
        } else {
          setActiveTab(null);
        }
      }

      toast.success("소송이 삭제되었습니다");
    } catch (error) {
      console.error("소송 삭제 실패:", error);
      toast.error("소송 삭제에 실패했습니다");
    }
  };

  const handleDownloadFile = async (fileUrl, fileName) => {
    try {
      // fileUrl이 전체 URL인 경우 경로만 추출
      let filePath = fileUrl;
      if (fileUrl.startsWith("http")) {
        // URL에서 파일 경로 추출 (bucket URL 이후의 부분)
        const match = fileUrl.match(/\/storage\/v1\/object\/public\/case-files\/(.+)/);
        if (match && match[1]) {
          filePath = match[1];
        } else {
          // URL 형식이 다른 경우 직접 열기
          window.open(fileUrl, "_blank");
          return;
        }
      }

      console.log("다운로드 시도:", filePath);
      const { data, error } = await supabase.storage.from(BUCKET_NAME).download(filePath);

      if (error) {
        console.error("파일 다운로드 오류:", error);
        // 기존 URL이 다른 버킷(case-documents 또는 lawsuit-documents)을 사용하는 경우 시도
        if (error.message.includes("does not exist")) {
          // 이전 버킷들에서 다운로드 시도
          for (const oldBucket of ["case-documents", "lawsuit-documents"]) {
            try {
              console.log(`${oldBucket} 버킷에서 다운로드 시도`);
              const { data: oldData } = await supabase.storage.from(oldBucket).download(fileUrl);

              if (oldData) {
                // 파일 다운로드 처리
                const url = URL.createObjectURL(oldData);
                const a = document.createElement("a");
                a.href = url;
                a.download = fileName || fileUrl.split("/").pop();
                document.body.appendChild(a);
                a.click();
                URL.revokeObjectURL(url);
                document.body.removeChild(a);
                return;
              }
            } catch (oldError) {
              console.log(`${oldBucket} 버킷에서 다운로드 실패:`, oldError);
            }
          }
        }

        throw error;
      }

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || filePath.split("/").pop();
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("파일 다운로드 실패:", error);
      toast.error("파일 다운로드에 실패했습니다", {
        description: error.message,
      });
    }
  };

  const handleSubmissionSuccess = () => {
    if (activeTab) {
      fetchSubmissions(activeTab);
    }
  };

  const handleLawsuitSuccess = () => {
    fetchLawsuits();
    fetchParties();
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
      <div className="text-center py-12 border rounded-md">
        <p className="mb-4 text-muted-foreground">등록된 소송이 없습니다</p>
        {user && (user.role === "admin" || user.role === "staff") && (
          <Button variant="outline" onClick={handleAddLawsuit}>
            <Plus className="mr-2 h-4 w-4" /> 소송 등록하기
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">소송 관리</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchLawsuits}>
            <RefreshCw className="mr-1 h-4 w-4" />
            새로고침
          </Button>
          {user && (user.role === "admin" || user.role === "staff") && (
            <Button size="sm" onClick={handleAddLawsuit}>
              <Plus className="mr-1 h-4 w-4" />
              소송 등록
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 w-full flex flex-wrap h-auto bg-background border">
          {lawsuits.map((lawsuit) => {
            const typeInfo = LAWSUIT_TYPES[lawsuit.lawsuit_type] || {
              label: "기타",
              variant: "outline",
            };
            const statusInfo = LAWSUIT_STATUS[lawsuit.status] || {
              label: "상태없음",
              variant: "outline",
            };

            return (
              <TabsTrigger
                key={lawsuit.id}
                value={lawsuit.id}
                className="py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                <div className="flex flex-col items-start text-left gap-1 px-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>
                    <span className="font-medium">{lawsuit.case_number}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusInfo.variant} className="text-xs">
                      {statusInfo.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{lawsuit.court_name}</span>
                  </div>
                </div>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {lawsuits.map((lawsuit) => (
          <TabsContent key={lawsuit.id} value={lawsuit.id} className="border rounded-md p-4">
            <div className="space-y-4">
              {/* 소송 기본 정보 */}
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">
                      접수일:{" "}
                      <span className="font-medium">
                        {format(new Date(lawsuit.filing_date), "yyyy년 MM월 dd일", { locale: ko })}
                      </span>
                    </p>
                  </div>

                  {lawsuit.description && <p className="text-sm mb-2">{lawsuit.description}</p>}
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

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">송달/제출 내역</h3>
                  {user && (user.role === "admin" || user.role === "staff") && (
                    <Button size="sm" onClick={handleAddSubmission}>
                      <Plus className="h-4 w-4 mr-1" />
                      내역 추가
                    </Button>
                  )}
                </div>

                {loadingSubmissions ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="text-center py-8 bg-muted/20 rounded-md">
                    <File className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">등록된 송달/제출 내역이 없습니다</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {submissions.map((submission) => (
                      <Card key={submission.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={
                                    submission.submission_type === "송달문서"
                                      ? "default"
                                      : "secondary"
                                  }
                                >
                                  {submission.submission_type}
                                </Badge>
                                <span className="font-medium">{submission.document_type}</span>
                              </div>

                              <p className="text-sm text-muted-foreground">
                                {submission.submission_date
                                  ? format(
                                      new Date(submission.submission_date),
                                      "yyyy년 MM월 dd일",
                                      { locale: ko }
                                    )
                                  : format(new Date(submission.created_at), "yyyy년 MM월 dd일", {
                                      locale: ko,
                                    })}
                                {submission.created_by_user?.name &&
                                  ` · ${submission.created_by_user.name}`}
                              </p>

                              {submission.description && (
                                <p className="text-sm">{submission.description}</p>
                              )}

                              {submission.file_url && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleDownloadFile(
                                      submission.file_url,
                                      submission.document_type
                                    )
                                  }
                                  className="mt-2"
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  첨부파일
                                </Button>
                              )}
                            </div>

                            {user && (user.role === "admin" || user.role === "staff") && (
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditSubmission(submission)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>

                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>송달/제출 내역 삭제</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        이 내역을 정말로 삭제하시겠습니까? 이 작업은 되돌릴 수
                                        없습니다.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>취소</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteSubmission(submission.id)}
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
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* 송달/제출 내역 추가/수정 모달 */}
      {showAddSubmissionModal && (
        <AddSubmissionModal
          open={showAddSubmissionModal}
          onOpenChange={setShowAddSubmissionModal}
          onSuccess={handleSubmissionSuccess}
          caseId={caseId}
          lawsuitId={activeTab}
          editingSubmission={editingSubmission}
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
    </div>
  );
}
