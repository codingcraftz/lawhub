"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Plus, Trash2, User, Building } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const LAWSUIT_TYPES = [
  { value: "civil", label: "민사소송" },
  { value: "payment_order", label: "지급명령" },
  { value: "property_disclosure", label: "재산명시" },
  { value: "execution", label: "강제집행" },
];

const LAWSUIT_STATUS = [
  { value: "pending", label: "접수 대기" },
  { value: "filed", label: "접수 완료" },
  { value: "in_progress", label: "진행 중" },
  { value: "decision", label: "결정/판결" },
  { value: "completed", label: "종결" },
  { value: "appeal", label: "항소/상고" },
];

// 당사자 유형에 따른 한국어 텍스트
const getPartyTypeText = (type) => {
  switch (type) {
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
      return type;
  }
};

// 소송 유형에 따른 한국어 텍스트
const getLawsuitTypeText = (type) => {
  const found = LAWSUIT_TYPES.find((item) => item.value === type);
  return found ? found.label : type;
};

export default function AddLawsuitModal({
  open,
  onOpenChange,
  onSuccess,
  caseId,
  parties = [],
  editingLawsuit = null,
}) {
  const { user } = useUser();
  const isEditMode = !!editingLawsuit;

  const [formData, setFormData] = useState({
    lawsuit_type: editingLawsuit?.lawsuit_type || "civil",
    court_name: editingLawsuit?.court_name || "",
    case_number: editingLawsuit?.case_number || "",
    filing_date: editingLawsuit?.filing_date ? new Date(editingLawsuit.filing_date) : new Date(),
    description: editingLawsuit?.description || "",
    status: editingLawsuit?.status || "pending",
  });

  const [selectedParties, setSelectedParties] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [showPartySelector, setShowPartySelector] = useState(false);
  const [filteredParties, setFilteredParties] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [caseDetails, setCaseDetails] = useState(null);

  // 모달이 열릴 때 선택된 당사자 초기화
  useEffect(() => {
    if (open) {
      if (isEditMode && editingLawsuit.test_lawsuit_parties) {
        // 기존 소송 당사자 정보 불러오기
        const loadPartyDetails = async () => {
          try {
            const partyIds = editingLawsuit.test_lawsuit_parties.map((lp) => lp.party_id);

            const { data, error } = await supabase
              .from("test_case_parties")
              .select("*")
              .in("id", partyIds);

            if (error) throw error;

            // 당사자 정보와 party_type 결합
            const partiesWithType = data.map((party) => {
              const lawsuitParty = editingLawsuit.test_lawsuit_parties.find(
                (lp) => lp.party_id === party.id
              );
              return {
                ...party,
                lawsuit_party_type: lawsuitParty.party_type,
              };
            });

            setSelectedParties(partiesWithType);
          } catch (error) {
            console.error("소송 당사자 정보 불러오기 실패:", error);
            toast.error("당사자 정보를 불러오는데 실패했습니다");
          }
        };

        loadPartyDetails();
      } else {
        setSelectedParties([]);
      }

      // 당사자 목록 초기화
      setFilteredParties(parties);
      setSearchTerm("");

      // 에러 초기화
      setFormErrors({});

      // 사건 정보 불러오기
      fetchCaseDetails();
    }
  }, [open, isEditMode, editingLawsuit, parties]);

  // 사건 정보 불러오기
  const fetchCaseDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("test_cases")
        .select(
          `
          *,
          clients:test_case_clients(
            individual_id(id, name, email),
            organization_id(id, name)
          )
        `
        )
        .eq("id", caseId)
        .single();

      if (error) throw error;
      setCaseDetails(data);
    } catch (error) {
      console.error("사건 정보 불러오기 실패:", error);
    }
  };

  // 검색어에 따라 당사자 필터링
  useEffect(() => {
    if (searchTerm) {
      const filtered = parties.filter((party) => {
        const name = party.party_entity_type === "individual" ? party.name : party.company_name;
        return name.toLowerCase().includes(searchTerm.toLowerCase());
      });
      setFilteredParties(filtered);
    } else {
      setFilteredParties(parties);
    }
  }, [searchTerm, parties]);

  const handleInputChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    });

    if (formErrors[field]) {
      setFormErrors({
        ...formErrors,
        [field]: null,
      });
    }
  };

  const addParty = (party) => {
    // 이미 선택된 당사자인지 확인
    const isAlreadySelected = selectedParties.some((p) => p.id === party.id);

    if (isAlreadySelected) {
      toast.error("이미 선택된 당사자입니다");
      return;
    }

    // 소송 유형에 따라 기본 당사자 유형 지정
    let defaultPartyType;
    if (formData.lawsuit_type === "civil" || formData.lawsuit_type === "payment_order") {
      defaultPartyType = party.party_type === "creditor" ? "plaintiff" : "defendant";
    } else if (formData.lawsuit_type === "property_disclosure") {
      defaultPartyType = party.party_type === "creditor" ? "applicant" : "respondent";
    } else {
      defaultPartyType = party.party_type;
    }

    // 당사자 추가
    setSelectedParties([
      ...selectedParties,
      {
        ...party,
        lawsuit_party_type: defaultPartyType,
      },
    ]);

    // 당사자 선택기 닫기
    setShowPartySelector(false);

    if (formErrors.selected_parties) {
      setFormErrors({
        ...formErrors,
        selected_parties: null,
      });
    }
  };

  const removeParty = (partyId) => {
    setSelectedParties(selectedParties.filter((p) => p.id !== partyId));
  };

  const updatePartyType = (partyId, newType) => {
    setSelectedParties(
      selectedParties.map((p) => (p.id === partyId ? { ...p, lawsuit_party_type: newType } : p))
    );
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.lawsuit_type) errors.lawsuit_type = "소송 유형을 선택해주세요";
    if (!formData.court_name.trim()) errors.court_name = "법원명을 입력해주세요";
    if (!formData.case_number.trim()) errors.case_number = "사건번호를 입력해주세요";
    if (!formData.filing_date) errors.filing_date = "접수일을 선택해주세요";
    if (selectedParties.length === 0)
      errors.selected_parties = "당사자를 최소 한 명 이상 선택해주세요";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 알림 생성 함수
  const createNotification = async (actionType, lawsuitData, oldStatus = null) => {
    console.log("createNotification 함수 호출됨", { actionType, lawsuitData, oldStatus });

    if (!caseDetails) {
      console.error("알림 생성 실패: caseDetails가 없습니다.");
      return;
    }

    try {
      // 채권자와 채무자 찾기
      let creditor = null;
      let debtor = null;

      // 선택된 당사자 중 채권자와 채무자 구분
      console.log("선택된 당사자:", selectedParties);
      selectedParties.forEach((party) => {
        if (["plaintiff", "creditor", "applicant"].includes(party.lawsuit_party_type)) {
          creditor = party;
        } else if (["defendant", "debtor", "respondent"].includes(party.lawsuit_party_type)) {
          debtor = party;
        }
      });

      if (!creditor || !debtor) {
        console.error("알림 생성 실패: 채권자 또는 채무자 정보가 없습니다.", { creditor, debtor });
        return;
      }

      // 알림 제목 및 내용 구성
      const creditorName =
        creditor.party_entity_type === "individual" ? creditor.name : creditor.company_name;

      const debtorName =
        debtor.party_entity_type === "individual" ? debtor.name : debtor.company_name;

      let title = `채권자 ${creditorName} | 채무자 ${debtorName}`;

      let message = "";
      const lawsuitTypeText = getLawsuitTypeText(formData.lawsuit_type);

      if (actionType === "create") {
        message = `${lawsuitTypeText} ${formData.case_number}가 등록되었습니다.`;
      } else if (actionType === "update" && oldStatus && oldStatus !== formData.status) {
        const oldStatusText = LAWSUIT_STATUS.find((s) => s.value === oldStatus)?.label || oldStatus;
        const newStatusText =
          LAWSUIT_STATUS.find((s) => s.value === formData.status)?.label || formData.status;
        message = `${lawsuitTypeText} ${formData.case_number}의 상태가 '${oldStatusText}'에서 '${newStatusText}'(으)로 변경되었습니다.`;
      }

      // 상태 변경이 없는 업데이트인 경우 알림 생성 안함
      if (actionType === "update" && (!oldStatus || oldStatus === formData.status)) {
        console.log("상태 변경이 없어 알림을 생성하지 않습니다.");
        return;
      }

      // 클라이언트 ID 수집
      console.log("사건 의뢰인 정보:", caseDetails.clients);

      // 모든 의뢰인 정보를 수집하기 위한 작업 배열
      const clientFetchPromises = [];
      const clientIds = new Set(); // 중복 방지를 위해 Set 사용

      // 개인 의뢰인과 조직 의뢰인 처리
      caseDetails.clients.forEach((client) => {
        if (client.individual_id) {
          // 개인 의뢰인
          clientIds.add(client.individual_id.id);
        } else if (client.organization_id) {
          // 조직 의뢰인인 경우 조직 멤버 조회 작업 추가
          const promise = supabase
            .from("test_organization_members")
            .select("user_id")
            .eq("organization_id", client.organization_id.id)
            .then(({ data, error }) => {
              if (error) {
                console.error(`조직 ${client.organization_id.id} 멤버 조회 실패:`, error);
                return [];
              }
              return data || [];
            });

          clientFetchPromises.push(promise);
        }
      });

      // 모든 조직 멤버 조회 작업 실행
      const orgMembersResults = await Promise.all(clientFetchPromises);

      // 조직 멤버 ID 추가
      orgMembersResults.forEach((members) => {
        members.forEach((member) => {
          if (member.user_id) {
            clientIds.add(member.user_id);
          }
        });
      });

      // Set을 배열로 변환
      const uniqueClientIds = Array.from(clientIds);

      if (uniqueClientIds.length === 0) {
        console.error("알림 생성 실패: 클라이언트 ID가 없습니다.");
        return;
      }

      console.log("알림 생성 대상 clientIds:", uniqueClientIds);
      console.log("알림 생성 데이터:", {
        title,
        message,
        clientCount: uniqueClientIds.length,
        caseId,
        lawsuitId: lawsuitData.id,
      });

      // 각 클라이언트에 대한 알림 생성
      const notificationPromises = uniqueClientIds.map(async (clientId) => {
        const notification = {
          user_id: clientId,
          case_id: caseId,
          title: title,
          message: message,
          notification_type: "lawsuit",
          is_read: false,
          related_entity: "lawsuit",
          related_id: lawsuitData.id,
        };

        try {
          const { data, error } = await supabase.from("test_notifications").insert(notification);

          if (error) {
            console.error(`클라이언트 ${clientId}에 대한 알림 생성 실패:`, error);
            return { success: false, clientId, error };
          } else {
            console.log(`클라이언트 ${clientId}에 대한 알림 생성 성공`);
            return { success: true, clientId };
          }
        } catch (err) {
          console.error(`클라이언트 ${clientId}에 대한 알림 생성 중 예외 발생:`, err);
          return { success: false, clientId, error: err };
        }
      });

      const notificationResults = await Promise.all(notificationPromises);
      const successCount = notificationResults.filter((r) => r.success).length;

      console.log(`알림 생성 결과: ${successCount}/${uniqueClientIds.length} 성공`);
    } catch (error) {
      console.error("알림 생성 중 오류 발생:", error);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // 소송 정보 데이터베이스에 저장
      const newLawsuit = {
        case_id: caseId,
        lawsuit_type: formData.lawsuit_type,
        court_name: formData.court_name.trim(),
        case_number: formData.case_number.trim(),
        filing_date: formData.filing_date.toISOString().split("T")[0],
        description: formData.description.trim() || null,
        status: formData.status,
        created_by: user.id,
      };

      let lawsuit;
      let oldStatus = null;

      if (isEditMode) {
        console.log("소송 정보 수정 시작");
        // 수정 전 기존 상태 가져오기
        const { data: oldData, error: oldError } = await supabase
          .from("test_case_lawsuits")
          .select("status")
          .eq("id", editingLawsuit.id)
          .single();

        if (!oldError) {
          oldStatus = oldData.status;
        }

        // 소송 정보 업데이트
        const { data, error } = await supabase
          .from("test_case_lawsuits")
          .update(newLawsuit)
          .eq("id", editingLawsuit.id)
          .select();

        if (error) throw error;
        lawsuit = data[0];

        // 기존 당사자 연결 삭제
        const { error: deleteError } = await supabase
          .from("test_lawsuit_parties")
          .delete()
          .eq("lawsuit_id", editingLawsuit.id);

        if (deleteError) throw deleteError;
      } else {
        console.log("새 소송 정보 추가 시작");
        // 새 소송 정보 추가
        const { data, error } = await supabase
          .from("test_case_lawsuits")
          .insert(newLawsuit)
          .select();

        if (error) throw error;
        lawsuit = data[0];
      }

      // 선택된 당사자 연결
      if (selectedParties.length > 0) {
        const lawsuitParties = selectedParties.map((party) => ({
          lawsuit_id: lawsuit.id,
          party_id: party.id,
          party_type: party.lawsuit_party_type, // 소송에서의 당사자 유형
        }));

        const { error: partyError } = await supabase
          .from("test_lawsuit_parties")
          .insert(lawsuitParties);

        if (partyError) throw partyError;
      }

      // 알림 생성
      if (isEditMode) {
        console.log("소송 수정에 대한 알림 생성 시작");
        await createNotification("update", lawsuit, oldStatus);
      } else {
        console.log("소송 생성에 대한 알림 생성 시작");
        await createNotification("create", lawsuit);
      }

      toast.success(isEditMode ? "소송이 수정되었습니다" : "소송이 추가되었습니다");

      if (onSuccess) onSuccess();
      // 모달 닫기 전에 모든 팝업도 닫기
      setShowPartySelector(false);
      onOpenChange(false);
    } catch (error) {
      console.error("소송 저장 실패:", error);
      toast.error(isEditMode ? "소송 수정 실패" : "소송 추가 실패", {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 소송 유형에 따른 당사자 유형 옵션
  const getPartyTypeOptions = () => {
    if (formData.lawsuit_type === "civil" || formData.lawsuit_type === "payment_order") {
      return [
        { value: "plaintiff", label: "원고" },
        { value: "defendant", label: "피고" },
      ];
    } else if (formData.lawsuit_type === "property_disclosure") {
      return [
        { value: "applicant", label: "신청인" },
        { value: "respondent", label: "피신청인" },
      ];
    } else {
      return [
        { value: "creditor", label: "채권자" },
        { value: "debtor", label: "채무자" },
      ];
    }
  };

  // 모달이 닫힐 때 상태 초기화 처리
  const handleDialogOpenChange = (isOpen) => {
    // 모달이 닫힐 때
    if (!isOpen) {
      // 모든 팝업도 닫기
      setShowPartySelector(false);
    }
    onOpenChange(isOpen);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "소송 정보 수정" : "소송 등록"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="lawsuit_type">소송 유형</Label>
              <Select
                value={formData.lawsuit_type}
                onValueChange={(value) => handleInputChange("lawsuit_type", value)}
              >
                <SelectTrigger className={formErrors.lawsuit_type ? "border-red-500" : ""}>
                  <SelectValue placeholder="소송 유형 선택" />
                </SelectTrigger>
                <SelectContent>
                  {LAWSUIT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.lawsuit_type && (
                <p className="text-xs text-red-500">{formErrors.lawsuit_type}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="court_name">법원명</Label>
              <Input
                id="court_name"
                value={formData.court_name}
                onChange={(e) => handleInputChange("court_name", e.target.value)}
                placeholder="법원명을 입력하세요"
                className={formErrors.court_name ? "border-red-500" : ""}
              />
              {formErrors.court_name && (
                <p className="text-xs text-red-500">{formErrors.court_name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="case_number">사건번호</Label>
              <Input
                id="case_number"
                value={formData.case_number}
                onChange={(e) => handleInputChange("case_number", e.target.value)}
                placeholder="사건번호를 입력하세요 (예: 2023가단12345)"
                className={formErrors.case_number ? "border-red-500" : ""}
              />
              {formErrors.case_number && (
                <p className="text-xs text-red-500">{formErrors.case_number}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="filing_date">접수일</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.filing_date && "text-muted-foreground",
                      formErrors.filing_date && "border-red-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.filing_date ? (
                      format(formData.filing_date, "yyyy년 MM월 dd일", { locale: ko })
                    ) : (
                      <span>날짜 선택</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.filing_date}
                    onSelect={(date) => handleInputChange("filing_date", date)}
                    initialFocus
                    locale={ko}
                  />
                </PopoverContent>
              </Popover>
              {formErrors.filing_date && (
                <p className="text-xs text-red-500">{formErrors.filing_date}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">상태</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="상태 선택" />
                </SelectTrigger>
                <SelectContent>
                  {LAWSUIT_STATUS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="소송에 대한 설명을 입력하세요"
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>당사자 선택</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPartySelector(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  당사자 추가
                </Button>
              </div>

              {formErrors.selected_parties && (
                <p className="text-xs text-red-500">{formErrors.selected_parties}</p>
              )}

              {selectedParties.length === 0 ? (
                <div className="text-center py-4 border rounded-md bg-muted/20">
                  <p className="text-sm text-muted-foreground">
                    선택된 당사자가 없습니다. 당사자를 추가해주세요.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedParties.map((party) => (
                    <Card key={party.id} className="overflow-hidden">
                      <CardContent className="p-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-3">
                            {party.party_entity_type === "individual" ? (
                              <User className="h-8 w-8 p-1.5 bg-primary/10 text-primary rounded-full" />
                            ) : (
                              <Building className="h-8 w-8 p-1.5 bg-primary/10 text-primary rounded-full" />
                            )}
                            <div>
                              <div className="flex items-center space-x-2">
                                <Select
                                  value={party.lawsuit_party_type}
                                  onValueChange={(value) => updatePartyType(party.id, value)}
                                >
                                  <SelectTrigger className="h-7 w-[90px] text-xs">
                                    <SelectValue placeholder="유형" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {getPartyTypeOptions().map((type) => (
                                      <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <span className="font-medium">
                                  {party.party_entity_type === "individual"
                                    ? party.name
                                    : party.company_name}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {party.phone ? party.phone : "연락처 없음"}
                                {party.email ? ` · ${party.email}` : ""}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            onClick={() => removeParty(party.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleDialogOpenChange(false)}>
              취소
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="ml-2">
              {isSubmitting ? "저장 중..." : isEditMode ? "수정" : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 당사자 선택 다이얼로그 */}
      <Dialog open={showPartySelector} onOpenChange={setShowPartySelector}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>당사자 선택</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="당사자 이름 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />

            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {filteredParties.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground">검색 결과가 없습니다</p>
                </div>
              ) : (
                filteredParties.map((party) => {
                  const isSelected = selectedParties.some((p) => p.id === party.id);
                  return (
                    <Card
                      key={party.id}
                      className={cn(
                        "cursor-pointer hover:bg-accent/50 transition-colors",
                        isSelected && "opacity-50"
                      )}
                      onClick={() => {
                        if (!isSelected) addParty(party);
                      }}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {party.party_entity_type === "individual" ? (
                              <User className="h-8 w-8 p-1.5 bg-primary/10 text-primary rounded-full" />
                            ) : (
                              <Building className="h-8 w-8 p-1.5 bg-primary/10 text-primary rounded-full" />
                            )}
                            <div>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="text-xs font-normal">
                                  {getPartyTypeText(party.party_type)}
                                </Badge>
                                <span className="font-medium">
                                  {party.party_entity_type === "individual"
                                    ? party.name
                                    : party.company_name}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {party.phone ? party.phone : "연락처 없음"}
                                {party.email ? ` · ${party.email}` : ""}
                              </p>
                            </div>
                          </div>
                          {isSelected && <Badge variant="secondary">선택됨</Badge>}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPartySelector(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
