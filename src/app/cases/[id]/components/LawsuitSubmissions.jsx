"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, isSameDay, isBefore, isAfter } from "date-fns";
import { ko } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  FileText,
  Download,
  ArrowDown,
  ArrowUp,
  Calendar,
  Eye,
  Edit,
  List,
  Trash,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function CaseTimeline({
  lawsuit,
  viewOnly = false,
  onSuccess,
  onEdit,
  onScheduleEdit,
  onScheduleAdd,
}) {
  const { user } = useUser();

  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [fileToUpload, setFileToUpload] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [formData, setFormData] = useState({
    submission_type: "송달문서",
    document_type: "",
    submission_date: new Date(),
    description: "",
  });
  const [editingSubmissionId, setEditingSubmissionId] = useState(null);
  const [editingScheduleId, setEditingScheduleId] = useState(null);

  // 기일 관련 상태 추가
  const [schedules, setSchedules] = useState([]);
  const [scheduleFormData, setScheduleFormData] = useState({
    title: "",
    event_type: "", // 사용자 입력값으로 변경
    event_date: new Date(),
    location: "",
    description: "",
  });

  // 날짜 포맷 함수
  const formatDate = (date) => {
    return format(date, "yyyy-MM-dd HH:mm");
  };

  // 한국어 날짜 포맷 함수
  const formatDateKorean = (date) => {
    return format(date, "yyyy년 MM월 dd일", { locale: ko });
  };

  // 문서 유형 관련 상수
  const submissionTypes = [
    { value: "송달문서", label: "송달문서", icon: ArrowDown },
    { value: "제출문서", label: "제출문서", icon: ArrowUp },
  ];

  const documentTypes = {
    송달문서: [
      { value: "소장", label: "소장" },
      { value: "준비서면", label: "준비서면" },
      { value: "석명준비명령", label: "석명준비명령" },
      { value: "변론기일통지서", label: "변론기일통지서" },
      { value: "결정문", label: "결정문" },
      { value: "판결문", label: "판결문" },
    ],
    제출문서: [
      { value: "답변서", label: "답변서" },
      { value: "준비서면", label: "준비서면" },
      { value: "증거신청서", label: "증거신청서" },
      { value: "사실조회신청서", label: "사실조회신청서" },
      { value: "항소장", label: "항소장" },
      { value: "상고장", label: "상고장" },
    ],
  };

  useEffect(() => {
    if (user && lawsuit?.id) {
      fetchSubmissions();
      fetchSchedules(); // 기일 데이터 가져오기
    }
  }, [user, lawsuit]);

  // 기일 추가 이벤트 리스너
  useEffect(() => {
    const handleAddScheduleEvent = (e) => {
      // 상위 컴포넌트에 기일 추가 요청
      if (onScheduleAdd) {
        onScheduleAdd();
      }
    };

    const element = document.getElementById("timeline-component");
    if (element) {
      element.addEventListener("add-schedule", handleAddScheduleEvent);

      return () => {
        element.removeEventListener("add-schedule", handleAddScheduleEvent);
      };
    }
  }, [onScheduleAdd]);

  // 타임라인 새로고침 이벤트 리스너
  useEffect(() => {
    const handleRefreshTimeline = () => {
      if (lawsuit?.id) {
        fetchSubmissions();
        fetchSchedules();
      }
    };

    const element = document.getElementById("timeline-component");
    if (element) {
      element.addEventListener("refresh-timeline", handleRefreshTimeline);

      return () => {
        element.removeEventListener("refresh-timeline", handleRefreshTimeline);
      };
    }
  }, [lawsuit]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("test_lawsuit_submissions")
        .select(
          `
          *,
          created_by_user:created_by(id, name, email)
        `
        )
        .eq("lawsuit_id", lawsuit.id)
        .order("submission_date", { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error("타임라인 조회 실패:", error);
      toast.error("타임라인 조회 실패", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // 기일 데이터 가져오기
  const fetchSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from("test_schedules")
        .select("*")
        .eq("lawsuit_id", lawsuit.id)
        .order("event_date", { ascending: false });

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error("기일 조회 실패:", error);
      toast.error("기일 조회 실패", {
        description: error.message,
      });
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.submission_type) errors.submission_type = "유형을 선택해주세요";
    if (!formData.document_type) errors.document_type = "문서 종류를 선택해주세요";
    if (!formData.submission_date) errors.submission_date = "날짜를 선택해주세요";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const uploadFile = async (file) => {
    if (!file) return null;

    // 파일 이름에 타임스탬프 추가하여 중복 방지
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}_${lawsuit.id}.${fileExt}`;
    const filePath = `cases/${lawsuit.case_id}/submissions/${fileName}`;

    const { data, error } = await supabase.storage.from("case-documents").upload(filePath, file);

    if (error) throw error;

    // 파일 URL 생성
    const { data: urlData } = supabase.storage.from("case-documents").getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const handleDelete = async (submissionId) => {
    if (!user || (user.role !== "admin" && user.role !== "staff")) {
      toast.error("권한이 없습니다", {
        description: "관리자 또는 직원만 타임라인을 삭제할 수 있습니다",
      });
      return;
    }

    try {
      // 1. 먼저 관련된 알림 삭제
      const { data: notificationsData, error: notificationsError } = await supabase
        .from("test_case_notifications")
        .delete()
        .match({
          related_entity: "submission",
          related_id: submissionId,
        })
        .select("id");

      if (notificationsError) {
        console.error("알림 삭제 실패:", notificationsError);
        // 알림 삭제 실패 시에도 타임라인 항목은 삭제 진행
      } else {
        console.log(`${notificationsData.length}개의 관련 알림이 함께 삭제되었습니다.`);
      }

      // 2. 타임라인 항목 삭제
      const { error } = await supabase
        .from("test_lawsuit_submissions")
        .delete()
        .eq("id", submissionId);

      if (error) throw error;

      toast.success("타임라인 항목이 삭제되었습니다", {
        description: "내역이 성공적으로 삭제되었습니다.",
      });

      // 업데이트된 목록 가져오기
      fetchSubmissions();
    } catch (error) {
      console.error("타임라인 삭제 실패:", error);
      toast.error("타임라인 삭제 실패", {
        description: error.message,
      });
    }
  };

  const resetForm = () => {
    setFormData({
      submission_type: "송달문서",
      document_type: "",
      submission_date: new Date(),
      description: "",
    });
    setFileToUpload(null);
    setFormErrors({});
    setEditingSubmissionId(null); // 편집 모드 리셋
  };

  const getFilteredSubmissions = () => {
    if (activeTab === "all") return submissions;
    return submissions.filter((item) => item.submission_type === activeTab);
  };

  const getSubmissionTypeIcon = (type) => {
    if (type === "송달문서") return <ArrowDown className="h-4 w-4" />;
    if (type === "제출문서") return <ArrowUp className="h-4 w-4" />;
    if (type === "기일") return <Calendar className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const getSubmissionTypeColor = (type) => {
    if (type === "송달문서") return "bg-blue-100 dark:bg-blue-900/20";
    if (type === "제출문서") return "bg-green-100 dark:bg-green-900/20";
    if (type === "기일") return "bg-amber-100 dark:bg-amber-900/20";
    return "bg-slate-100 dark:bg-slate-800";
  };

  // 필터링된 일정 얻기
  const getFilteredSchedules = () => {
    if (activeTab === "all" || activeTab === "기일") return schedules;
    return [];
  };

  // 타임라인 항목 렌더링
  const renderTimelineItem = (item) => {
    const isSchedule = item.hasOwnProperty("event_type");
    const itemType = isSchedule ? item.event_type : item.submission_type;
    const submissionIcon = getSubmissionTypeIcon(isSchedule ? "기일" : itemType);
    const bgColor = getSubmissionTypeColor(isSchedule ? "기일" : itemType);
    const itemBgClass = getItemBackgroundClass(isSchedule ? "기일" : itemType);

    return (
      <div
        key={isSchedule ? `schedule-${item.id}` : `submission-${item.id}`}
        className={`p-3 my-2 rounded-lg border relative ${itemBgClass}`}
      >
        {/* 타임라인 항목 아이콘 */}
        <div className="absolute -left-[40px] top-4 z-10">
          <div
            className={`h-6 w-6 rounded-full ${bgColor} flex items-center justify-center text-white`}
          >
            {submissionIcon}
          </div>
        </div>

        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1 h-6">
                {submissionIcon}
                <span>{isSchedule ? item.event_type : itemType}</span>
              </Badge>

              {isSchedule && (
                <span className="text-xs text-muted-foreground">
                  {format(new Date(item.event_date), "HH:mm", { locale: ko })}
                </span>
              )}

              {!isSchedule && item.document_number && (
                <Badge variant="outline" className="text-xs">
                  문서번호: {item.document_number}
                </Badge>
              )}

              {isSchedule && item.location && (
                <span className="text-xs text-muted-foreground">장소: {item.location}</span>
              )}
            </div>

            {!isSchedule && (
              <div className="mt-1 text-sm font-medium">
                {item.document_type || item.document_name || "문서"}
              </div>
            )}

            {item.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{item.description}</p>
            )}

            {/* 첨부파일이 있는 경우 버튼 표시 - 기일과 문서 모두 적용 */}
            {item.file_url && (
              <div className="flex gap-1 mt-2">
                <Button variant="outline" size="sm" className="h-7 px-2 text-xs" asChild>
                  <a href={item.file_url} target="_blank" rel="noopener noreferrer">
                    <Eye className="h-3 w-3 mr-1" />
                    보기
                  </a>
                </Button>
                <Button variant="outline" size="sm" className="h-7 px-2 text-xs" asChild>
                  <a href={item.file_url} download>
                    <Download className="h-3 w-3 mr-1" />
                    다운로드
                  </a>
                </Button>
              </div>
            )}
          </div>

          {user && (user.role === "admin" || user.role === "staff") && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => (isSchedule ? handleEditSchedule(item) : handleEditSubmission(item))}
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => (isSchedule ? handleDeleteSchedule(item.id) : handleDelete(item.id))}
              >
                <Trash className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 항목 유형에 따른 배경색 클래스 가져오기
  const getItemBackgroundClass = (type) => {
    switch (type) {
      case "송달문서":
        return "bg-blue-50/40 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/30";
      case "제출문서":
        return "bg-green-50/40 dark:bg-green-900/10 border-green-100 dark:border-green-800/30";
      case "기일":
        return "bg-amber-50/40 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/30";
      default:
        return "bg-gray-50/40 dark:bg-gray-900/10 border-gray-100 dark:border-gray-800/30";
    }
  };

  // 타임라인 렌더링
  const renderTimeline = () => {
    const filteredSchedules = getFilteredSchedules();
    const filteredSubmissions = getFilteredSubmissions();

    if ((filteredSchedules.length === 0 && filteredSubmissions.length === 0) || loading) {
      return (
        <div className="rounded-lg border bg-background/50 p-4 text-center">
          <div className="flex flex-col items-center justify-center space-y-2">
            <Calendar className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">등록된 항목이 없습니다</p>
            {(user?.role === "admin" || user?.role === "staff") && (
              <div className="flex gap-2 mt-1">
                <Button
                  onClick={() => onScheduleAdd(true)}
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  기일 추가
                </Button>
                <Button
                  onClick={() => onSuccess(true)}
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  문서 추가
                </Button>
              </div>
            )}
          </div>
        </div>
      );
    }

    // 일정과 문서 합치고 정렬
    const timelineItems = [...filteredSchedules, ...filteredSubmissions].sort((a, b) => {
      const dateA = a.hasOwnProperty("event_date")
        ? new Date(a.event_date)
        : new Date(a.submission_date);
      const dateB = b.hasOwnProperty("event_date")
        ? new Date(b.event_date)
        : new Date(b.submission_date);
      return dateB - dateA;
    });

    // 날짜별로 그룹화
    const groupedItems = {};
    timelineItems.forEach((item) => {
      const date = item.hasOwnProperty("event_date")
        ? format(new Date(item.event_date), "yyyy-MM-dd")
        : format(new Date(item.submission_date), "yyyy-MM-dd");

      if (!groupedItems[date]) {
        groupedItems[date] = [];
      }
      groupedItems[date].push(item);
    });

    return (
      <div className="space-y-6">
        {Object.keys(groupedItems).map((date) => {
          const formattedDate = formatDateKorean(new Date(date));
          return (
            <div key={date} className="relative pb-2">
              <div className="mb-3 flex items-center">
                <h3 className="text-sm font-semibold bg-background px-2 py-1 rounded-md border shadow-sm">
                  {formattedDate}
                </h3>
              </div>
              <div className="relative pl-12 border-l-2 border-border ml-3 space-y-1">
                {groupedItems[date].map((item) => renderTimelineItem(item))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // 기일 폼 유효성 검사
  const validateScheduleForm = () => {
    const errors = {};

    if (!scheduleFormData.title) errors.title = "제목을 입력해주세요";
    if (!scheduleFormData.event_type) errors.event_type = "기일 유형을 입력해주세요";
    if (!scheduleFormData.event_date) errors.event_date = "날짜를 선택해주세요";
    if (!scheduleFormData.location) errors.location = "장소를 입력해주세요";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 문서 수정 핸들러
  const handleEditSubmission = (submission) => {
    // 상세 데이터 가져오는 API 호출
    getSubmissionDetail(submission.id).then((detailData) => {
      if (!detailData) {
        console.error("문서 상세 정보를 가져오지 못했습니다.", submission.id);
        toast.error("문서 정보를 가져오지 못했습니다", {
          description: "나중에 다시 시도해주세요.",
        });
        return;
      }

      // 인쇄용 상세 데이터 설정
      onEdit(detailData);
      setEditingSubmissionId(detailData.id);
    });
  };

  // 제출/송달 문서 상세 조회
  const getSubmissionDetail = async (submissionId) => {
    try {
      const { data, error } = await supabase
        .from("test_lawsuit_submissions")
        .select(
          `
          *,
          created_by_user:created_by(id, name, email)
        `
        )
        .eq("id", submissionId)
        .single();

      if (error) {
        console.error("문서 상세 정보 조회 실패:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("문서 상세 정보 조회 중 오류 발생:", error);
      return null;
    }
  };

  // 기일 수정 처리 함수 추가
  const handleEditSchedule = (schedule) => {
    if (!user || (user.role !== "admin" && user.role !== "staff")) {
      toast.error("권한이 없습니다", {
        description: "관리자 또는 직원만 기일을 수정할 수 있습니다",
      });
      return;
    }

    if (onScheduleEdit) {
      // 부모 컴포넌트의 수정 함수 호출
      onScheduleEdit(schedule);
    } else {
      console.error("onScheduleEdit 함수가 없습니다");
      // 폴백: 직접 모달 처리
      setScheduleFormData({
        title: schedule.title,
        event_type: schedule.event_type,
        event_date: new Date(schedule.event_date),
        location: schedule.location || "",
        description: schedule.description || "",
      });

      // 편집 모드로 설정하고 모달 열기
      setEditingScheduleId(schedule.id);
      onScheduleAdd(true);
    }
  };

  // 기일 삭제 처리
  const handleDeleteSchedule = async (scheduleId) => {
    if (!user || (user.role !== "admin" && user.role !== "staff")) {
      toast.error("권한이 없습니다", {
        description: "관리자 또는 직원만 기일을 삭제할 수 있습니다",
      });
      return;
    }

    try {
      // 1. 먼저 관련된 알림 삭제 - 메시지에 기일 ID가 포함된 알림 찾기
      const { data: notificationsData, error: notificationsError } = await supabase
        .from("test_case_notifications")
        .delete()
        .like("message", `%기일 ID: ${scheduleId}%`)
        .select("id");

      if (notificationsError) {
        console.error("알림 삭제 실패:", notificationsError);
        // 알림 삭제 실패 시에도 기일 항목은 삭제 진행
      } else {
        console.log(`${notificationsData?.length || 0}개의 관련 알림이 함께 삭제되었습니다.`);
      }

      // 2. 또는 더 정확한 알림 삭제를 위해 해당 기일 정보로 검색
      const { data: scheduleData, error: scheduleError } = await supabase
        .from("test_schedules")
        .select("event_type, case_id")
        .eq("id", scheduleId)
        .single();

      if (!scheduleError && scheduleData) {
        // 기일 정보를 이용해 관련 알림 추가 검색 및 삭제
        const { data: moreNotifications, error: moreNotificationsError } = await supabase
          .from("test_case_notifications")
          .delete()
          .match({
            case_id: scheduleData.case_id,
            notification_type: "schedule",
          })
          .like("message", `%${scheduleData.event_type}%`)
          .select("id");

        if (!moreNotificationsError && moreNotifications) {
          console.log(`${moreNotifications.length}개의 기일 관련 알림이 추가로 삭제되었습니다.`);
        }
      }

      // 3. 기일 항목 삭제
      const { error } = await supabase.from("test_schedules").delete().eq("id", scheduleId);

      if (error) throw error;

      toast.success("기일이 삭제되었습니다", {
        description: "기일이 성공적으로 삭제되었습니다.",
      });

      // 업데이트된 목록 가져오기
      fetchSchedules();
    } catch (error) {
      console.error("기일 삭제 실패:", error);
      toast.error("기일 삭제 실패", {
        description: error.message,
      });
    }
  };

  // 소송의 당사자 정보 가져오기
  const getLawsuitParties = async (lawsuitId) => {
    try {
      console.log("당사자 정보 조회 시작: lawsuitId =", lawsuitId);

      // 소송 당사자 관계 조회
      const { data: lawsuitParties, error: lawsuitPartiesError } = await supabase
        .from("test_lawsuit_parties")
        .select("party_id, party_type")
        .eq("lawsuit_id", lawsuitId);

      if (lawsuitPartiesError) throw lawsuitPartiesError;
      if (!lawsuitParties || lawsuitParties.length === 0) {
        console.log("소송 당사자 관계가 없습니다.");
        return { creditor: null, debtor: null };
      }

      console.log("소송 당사자 관계:", lawsuitParties);

      // 당사자 ID 목록 추출
      const partyIds = lawsuitParties.map((p) => p.party_id);
      console.log("당사자 ID 목록:", partyIds);

      // 당사자 상세 정보 조회
      const { data: partiesData, error: partiesError } = await supabase
        .from("test_case_parties")
        .select("*")
        .in("id", partyIds);

      if (partiesError) throw partiesError;
      console.log("당사자 상세 정보:", partiesData);

      // 당사자 관계와 상세 정보 결합
      const parties = partiesData.map((party) => {
        const lawsuitParty = lawsuitParties.find((lp) => lp.party_id === party.id);
        return {
          ...party,
          party_type: lawsuitParty?.party_type,
        };
      });

      console.log("결합된 당사자 정보:", parties);

      // 원고/채권자/신청인 및 피고/채무자/피신청인 찾기
      let creditor = null;
      let debtor = null;

      parties.forEach((party) => {
        if (["plaintiff", "creditor", "applicant"].includes(party.party_type)) {
          creditor = party;
        } else if (["defendant", "debtor", "respondent"].includes(party.party_type)) {
          debtor = party;
        }
      });

      console.log("찾은 당사자 정보:", { creditor, debtor });

      return { creditor, debtor };
    } catch (error) {
      console.error("당사자 정보 조회 실패:", error);
      return { creditor: null, debtor: null };
    }
  };

  // 당사자 유형에 따른 레이블 반환
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
        return partyType;
    }
  };

  if (!lawsuit) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">먼저 소송을 선택해주세요</p>
      </div>
    );
  }

  return (
    <Card
      className="w-full border-0 bg-white/90 dark:bg-slate-900/90 shadow-md rounded-xl overflow-hidden backdrop-blur-sm"
      id="timeline-component"
    >
      <CardContent className="pt-4">
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <TabsTrigger
              value="all"
              className="flex items-center gap-1 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm rounded-md"
            >
              <List className="h-3.5 w-3.5" />
              <span className="text-xs">전체</span>
            </TabsTrigger>
            <TabsTrigger
              value="송달문서"
              className="flex items-center gap-1 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm rounded-md"
            >
              <ArrowDown className="h-3.5 w-3.5" />
              <span className="text-xs">송달문서</span>
            </TabsTrigger>
            <TabsTrigger
              value="제출문서"
              className="flex items-center gap-1 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm rounded-md"
            >
              <ArrowUp className="h-3.5 w-3.5" />
              <span className="text-xs">제출문서</span>
            </TabsTrigger>
            <TabsTrigger
              value="기일"
              className="flex items-center gap-1 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm rounded-md"
            >
              <Calendar className="h-3.5 w-3.5" />
              <span className="text-xs">기일</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            {renderTimeline()}
          </TabsContent>
          <TabsContent value="송달문서" className="mt-4">
            {renderTimeline()}
          </TabsContent>
          <TabsContent value="제출문서" className="mt-4">
            {renderTimeline()}
          </TabsContent>
          <TabsContent value="기일" className="mt-4">
            {renderTimeline()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
