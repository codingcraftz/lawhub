"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Printer, FileCheck, Search, X, User, Check } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { supabase } from "@/utils/supabase";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function CertificatePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    // 1페이지 필드
    name1: "",
    regNumber1: "",
    address1: "",
    relationship1: "채권자 대리인", // 기본값 설정
    number1: "",
    // 2페이지 필드
    name2: "",
    regNumber2: "",
    address2: "",
    // 추가 필드
    goal1: "소송 사건", // 기본값 설정
    file1: "소송 서류", // 기본값 설정
    date1: formatDateToKorean(new Date()), // 현재 날짜를 한국어 형식으로
    courtName: "서울중앙지방법원", // 기본 법원 이름
  });

  // 한국어 날짜 포맷 함수
  function formatDateToKorean(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}년 ${month}월 ${day}일`;
  }

  // 사용자 검색 관련 상태
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // 사건 검색 관련 상태
  const [caseSearchTerm, setCaseSearchTerm] = useState("");
  const [caseSearchResults, setCaseSearchResults] = useState([]);
  const [isCaseSearching, setIsCaseSearching] = useState(false);
  const [showCaseSearchDialog, setShowCaseSearchDialog] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);

  // 로딩 상태
  const [isLoading, setIsLoading] = useState(false);

  // 채권자/채무자 유형 상태 추가
  const [creditorType, setCreditorType] = useState("individual"); // individual 또는 corporation
  const [debtorType, setDebtorType] = useState("individual"); // individual 또는 corporation

  // 채권자/채무자 정보 상태 추가 (법인일 경우)
  const [creditorInfo, setCreditorInfo] = useState({
    companyName: "",
    registrationNumber: "",
    address: "",
    representativePosition: "",
    representativeName: "",
  });

  const [debtorInfo, setDebtorInfo] = useState({
    companyName: "",
    registrationNumber: "",
    address: "",
    representativePosition: "",
    representativeName: "",
  });

  // 폼 필드 변경 핸들러
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 사용자 검색 함수
  const searchUsers = async () => {
    if (!searchTerm.trim() || searchTerm.length < 2) {
      toast.error("검색어는 2글자 이상 입력해주세요");
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, email, phone_number, role")
        .ilike("name", `%${searchTerm}%`)
        .limit(10);

      if (error) throw error;

      setSearchResults(data || []);
      if (data.length === 0) {
        toast.info("검색 결과가 없습니다");
      }
    } catch (err) {
      console.error("사용자 검색 오류:", err);
      toast.error("사용자 검색 중 오류가 발생했습니다");
    } finally {
      setIsSearching(false);
    }
  };

  // 사건 검색 함수
  const searchCases = async () => {
    if (!caseSearchTerm.trim() || caseSearchTerm.length < 2) {
      toast.error("검색어는 2글자 이상 입력해주세요");
      return;
    }

    setIsCaseSearching(true);
    try {
      // 당사자 이름으로 사건 검색
      const { data: partyData, error: partyError } = await supabase
        .from("test_case_parties")
        .select(
          "id, case_id, party_type, name, entity_type, resident_number, address, address_detail"
        )
        .ilike("name", `%${caseSearchTerm}%`)
        .limit(20);

      if (partyError) throw partyError;

      if (partyData && partyData.length > 0) {
        // 검색된 당사자들의 case_id를 추출
        const caseIds = [...new Set(partyData.map((party) => party.case_id))];

        // 각 사건의 정보를 가져옴
        const { data: casesData, error: casesError } = await supabase
          .from("test_cases")
          .select("id, case_type, status, filing_date")
          .in("id", caseIds);

        if (casesError) throw casesError;

        // 각 사건 ID별로 모든 당사자 정보를 가져옴 (검색된 당사자가 포함된 사건의 모든 당사자)
        const { data: allParties, error: allPartiesError } = await supabase
          .from("test_case_parties")
          .select(
            "id, case_id, party_type, name, entity_type, resident_number, address, address_detail"
          )
          .in("case_id", caseIds);

        if (allPartiesError) throw allPartiesError;

        // 각 사건별로 관련 당사자 정보를 결합
        const results = [];

        for (const caseItem of casesData) {
          // 이 사건의 모든 당사자들
          const caseParties = allParties.filter((party) => party.case_id === caseItem.id);

          // 이 사건의 채권자들(여러 명 가능)
          const creditors = caseParties.filter(
            (p) => p.party_type === "creditor" || p.party_type === "plaintiff"
          );

          // 이 사건의 채무자들(여러 명 가능)
          const debtors = caseParties.filter(
            (p) => p.party_type === "debtor" || p.party_type === "defendant"
          );

          // 결과에 추가
          results.push({
            ...caseItem,
            creditors: creditors,
            debtors: debtors,
            // 화면에 표시할 대표 채권자와 채무자
            creditor: creditors.length > 0 ? creditors[0] : null,
            debtor: debtors.length > 0 ? debtors[0] : null,
            // 검색한 당사자가 채권자인지 채무자인지 표시
            matchedParty: partyData.find((p) => p.case_id === caseItem.id)?.party_type,
          });
        }

        setCaseSearchResults(results);

        if (results.length === 0) {
          toast.info("검색 결과가 없습니다");
        }
      } else {
        setCaseSearchResults([]);
        toast.info("검색 결과가 없습니다");
      }
    } catch (err) {
      console.error("사건 검색 오류:", err);
      toast.error("사건 검색 중 오류가 발생했습니다");
    } finally {
      setIsCaseSearching(false);
    }
  };

  // 전화번호 포맷 변환 함수 (+82 -> 010-xxxx-xxxx)
  const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return "";

    // 모든 공백, 대시, 괄호 제거
    let cleaned = phoneNumber.replace(/[\s\-\(\)]/g, "");

    // +82로 시작하는 경우 처리
    if (cleaned.startsWith("+82")) {
      cleaned = "0" + cleaned.substring(3);
    }

    // 길이에 따라 다르게 포맷팅
    if (cleaned.length === 11) {
      // 모바일 번호 포맷 (01012345678 -> 010-1234-5678)
      return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
    } else if (cleaned.length === 10) {
      // 일반 전화번호 포맷 (0212345678 -> 02-1234-5678)
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "$1-$2-$3");
    }

    // 그 외의 경우 원래 번호 반환
    return phoneNumber;
  };

  // 사용자 선택 핸들러
  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setFormData((prev) => ({
      ...prev,
      name1: user.name || "",
      number1: formatPhoneNumber(user.phone_number) || "",
    }));
    setShowSearchDialog(false);
    toast.success(`${user.name} 님을 선택했습니다`);
  };

  // 사용자 선택 취소 핸들러
  const handleClearUser = () => {
    setSelectedUser(null);
    setFormData((prev) => ({
      ...prev,
      name1: "",
      number1: "",
    }));
    toast.info("선택한 사용자를 취소했습니다");
  };

  // 사건 선택 핸들러
  const handleSelectCase = (caseData) => {
    // 선택한 사건의 모든 정보를 저장
    setSelectedCase(caseData);

    // 법원 이름 설정 (사건 데이터에서 가져옴)
    setFormData((prev) => ({
      ...prev,
      courtName: caseData.court_name || "서울중앙지방법원",
    }));

    // 채권자 유형 설정
    if (caseData.creditor && caseData.creditor.entity_type === "corporation") {
      setCreditorType("corporation");
      setCreditorInfo({
        companyName: caseData.creditor.company_name || "",
        registrationNumber: caseData.creditor.business_number || "",
        address:
          caseData.creditor.address +
            (caseData.creditor.address_detail ? ` ${caseData.creditor.address_detail}` : "") || "",
        representativePosition: caseData.creditor.representative_position || "대표",
        representativeName: caseData.creditor.representative_name || caseData.creditor.name || "",
      });
    } else {
      setCreditorType("individual");
      // 개인 채권자 정보가 있으면 폼에 입력
      if (caseData.creditor) {
        setFormData((prev) => ({
          ...prev,
          name1: caseData.creditor.name || "",
          regNumber1: caseData.creditor.resident_number || "",
          address1:
            caseData.creditor.address +
              (caseData.creditor.address_detail ? ` ${caseData.creditor.address_detail}` : "") ||
            "",
        }));
      }
    }

    // 채무자 유형 설정
    if (caseData.debtor && caseData.debtor.entity_type === "corporation") {
      setDebtorType("corporation");
      setDebtorInfo({
        companyName: caseData.debtor.company_name || "",
        registrationNumber: caseData.debtor.business_number || "",
        address:
          caseData.debtor.address +
            (caseData.debtor.address_detail ? ` ${caseData.debtor.address_detail}` : "") || "",
        representativePosition: caseData.debtor.representative_position || "대표",
        representativeName: caseData.debtor.representative_name || caseData.debtor.name || "",
      });
    } else {
      setDebtorType("individual");
      // 채무자 정보가 있으면 폼에 입력
      if (caseData.debtor) {
        setFormData((prev) => ({
          ...prev,
          name2: caseData.debtor.name || "",
          regNumber2: caseData.debtor.resident_number || "",
          address2:
            caseData.debtor.address +
              (caseData.debtor.address_detail ? ` ${caseData.debtor.address_detail}` : "") || "",
        }));
      }
    }

    setShowCaseSearchDialog(false);
    toast.success("사건이 선택되었습니다");
  };

  // 사건 선택 취소 핸들러
  const handleClearCase = () => {
    setSelectedCase(null);
    setFormData((prev) => ({
      ...prev,
      name2: "",
      regNumber2: "",
      address2: "",
    }));
    setCreditorType("individual");
    setDebtorType("individual");
    setCreditorInfo({
      companyName: "",
      registrationNumber: "",
      address: "",
      representativePosition: "",
      representativeName: "",
    });
    setDebtorInfo({
      companyName: "",
      registrationNumber: "",
      address: "",
      representativePosition: "",
      representativeName: "",
    });
    toast.info("선택한 사건을 취소했습니다");
  };

  // Word 문서 생성 함수
  const handleFillAndPrint = async () => {
    // 필수 필드 검증
    if (!formData.name1 || !formData.regNumber1 || !formData.address1) {
      toast.error("필수 정보(이름, 주민등록번호, 주소)를 모두 입력해주세요");
      return;
    }

    setIsLoading(true);

    try {
      // 템플릿 파일 가져오기
      const response = await fetch("/초본신청서_양식.docx");
      const templateContent = await response.arrayBuffer();

      // 템플릿 엔진 설정
      const zip = new PizZip(templateContent);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      // 데이터 채우기
      doc.render({
        name1: formData.name1,
        regNumber1: formData.regNumber1,
        address1: formData.address1,
        number1: formData.number1,
        relationship1: formData.relationship1,
        name2: formData.name2,
        regNumber2: formData.regNumber2,
        address2: formData.address2,
        goal1: formData.goal1,
        file1: formData.file1,
        date1:
          formData.date1 ||
          new Date().toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
      });

      // 결과 문서 생성
      const uint8Array = doc.getZip().generate({
        type: "uint8array",
        compression: "DEFLATE",
      });

      // Blob 생성
      const blob = new Blob([uint8Array], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      // 다운로드 기능 구현
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "초본신청서.docx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("문서가 생성되었습니다. 다운로드된 Word 파일을 열어 직접 인쇄해주세요.");
    } catch (err) {
      console.error("문서 생성 오류:", err);
      toast.error(err.message || "문서 생성 중 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  // 원본 양식 보기
  const handleViewOriginal = () => {
    if (typeof window !== "undefined") {
      window.open("/초본신청서_양식.pdf", "_blank");
    }
  };

  // 재산명시신청서 인쇄 함수
  const printPropertyDisclosureRequest = () => {
    // 인쇄용 창 생성
    const printWindow = window.open("", "_blank");

    // 인쇄할 HTML 내용 생성
    const creditorName = selectedCase?.creditor
      ? selectedCase.creditor.entity_type === "corporation"
        ? `${selectedCase.creditor.company_name} ${
            selectedCase.creditor.representative_position || "대표"
          } ${selectedCase.creditor.representative_name || selectedCase.creditor.name}`
        : selectedCase.creditor.name
      : "";

    const debtorName = selectedCase?.debtor ? selectedCase.debtor.name : formData.name2;

    // 오늘 날짜 포맷
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    const formattedDate = `${year}년 ${month}월 ${day}일`;

    // 법인 여부에 따른 표시
    const isCreditorCorporation = selectedCase?.creditor?.entity_type === "corporation";
    const creditorCompanyName = isCreditorCorporation ? selectedCase?.creditor?.company_name : "";
    const creditorRepresentativeInfo = isCreditorCorporation
      ? `${selectedCase?.creditor?.representative_position || "대표"} ${
          selectedCase?.creditor?.representative_name || selectedCase?.creditor?.name
        }`
      : "";

    // 법원 이름
    const courtName = formData.courtName || "서울중앙지방법원";

    // 인쇄용 HTML 생성
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <title>재산명시신청서</title>
        <style>
          @media print {
            @page {
              size: A4;
              margin: 1.5cm;
            }
            body {
              font-family: 'Batang', serif;
              line-height: 1.5;
              font-size: 12pt;
              margin: 0;
              padding: 0;
            }
            .page-break {
              page-break-before: always;
            }
            .title {
              font-size: 24pt;
              font-weight: bold;
              text-align: center;
              margin: 1.5cm 0 1.5cm 0;
            }
            .party {
              margin: 0.8cm 0;
            }
            .party-label {
              float: left;
              width: 20%;
              font-weight: bold;
              letter-spacing: 1px;
            }
            .party-value {
              float: right;
              width: 80%;
            }
            .section-title {
              font-size: 16pt;
              font-weight: bold;
              text-align: center;
              margin: 1.2cm 0 0.8cm 0;
              clear: both;
            }
            .content {
              clear: both;
              margin: 0.8cm 0;
              text-align: justify;
              line-height: 1.8;
            }
            .date {
              text-align: right;
              margin-top: 2cm;
            }
            .signature {
              text-align: right;
            }
            .court {
              text-align: right;
              font-size: 16pt;
              font-weight: bold;
              margin-top: 1.5cm;
              padding-bottom: 1cm;
            }
            .clearfix::after {
              content: "";
              clear: both;
              display: table;
            }
          }
        </style>
      </head>
      <body>
        <div class="title">재 산 명 시 신 청 서</div>
        
        <div class="party clearfix">
          <div class="party-label">채 권 자</div>
          <div class="party-value">${creditorName || "이름"}</div>
        </div>
        
        <div class="party clearfix">
          <div class="party-label">채 무 자</div>
          <div class="party-value">${debtorName || "이름"}</div>
        </div>
        
        <div class="section-title">신 청 취 지</div>
        
        <div class="content">
          채무자는 재산상태를 명시한 재산목록을 제출하라
        </div>
        
        <div class="section-title">신 청 이 유</div>
        
        <div class="content">
          채권자는 채무자에 대하여 위 표시 집행권원을 가지고 있고 채무자는 이를 변제하지 아니하고 있으므로 민사집행법 제61조에 의하여 채무자에 대한 재산명시명령을 신청합니다.
        </div>
        
        <div class="date">${formattedDate}</div>
        
        <div class="signature">위 채권자</div>
        <div class="signature">${
          isCreditorCorporation ? creditorCompanyName : formData.name1 || "이름"
        }</div>
        ${isCreditorCorporation ? `<div class="signature">${creditorRepresentativeInfo}</div>` : ""}
        
        <div class="court">${courtName} 귀중</div>
        
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    // HTML 내용을 창에 작성
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // 위임장 인쇄 함수
  const printPowerOfAttorney = () => {
    // 인쇄용 창 생성
    const printWindow = window.open("", "_blank");

    // 오늘 날짜 포맷
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    const formattedDate = `${year}년 ${month}월 ${day}일`;

    // 위임인(채권자) 정보
    let mandatorInfo = "";
    let signatureInfo = "";

    if (creditorType === "corporation") {
      // 법인인 경우
      mandatorInfo = `
        <div class="party clearfix">
          <div class="party-label">위 임 인</div>
          <div class="party-value">${creditorInfo.companyName || "회사명"} (${
        creditorInfo.registrationNumber || "법인등록번호"
      })</div>
        </div>
        <div class="party-address">${creditorInfo.address || "주소"}</div>
      `;
      signatureInfo = `
        <div class="signature">위 위임인</div>
        <div class="signature">${creditorInfo.companyName || "회사명"}</div>
        <div class="signature">${creditorInfo.representativePosition || "대표"} ${
        creditorInfo.representativeName || "이름"
      }</div>
      `;
    } else {
      // 개인인 경우
      mandatorInfo = `
        <div class="party clearfix">
          <div class="party-label">위 임 인</div>
          <div class="party-value">${formData.name1 || "이름"} (${
        formData.regNumber1 || "주민등록번호"
      })</div>
        </div>
        <div class="party-address">${formData.address1 || "주소"}</div>
      `;
      signatureInfo = `
        <div class="signature">위 위임인</div>
        <div class="signature">${formData.name1 || "이름"}</div>
      `;
    }

    // 수임인 정보
    const attorneyInfo = `
      <div class="party clearfix">
        <div class="party-label">수 임 인</div>
        <div class="party-value">${formData.name1 || "이름"} (${
      formData.regNumber1 || "주민등록번호"
    })</div>
      </div>
      <div class="party-address">${formData.address1 || "주소"}</div>
      <div class="party-phone">${formData.number1 || "연락처"}</div>
    `;

    // 인쇄용 HTML 생성
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <title>위임장</title>
        <style>
          @media print {
            @page {
              size: A4;
              margin: 1.5cm;
            }
            body {
              font-family: 'Batang', serif;
              line-height: 1.5;
              font-size: 12pt;
              margin: 0;
              padding: 0;
            }
            .title {
              font-size: 25pt;
              font-weight: bold;
              text-align: center;
              margin: 2cm 0 2cm 0;
              letter-spacing: 5px;
            }
            .party {
              margin: 0.8cm 0 0.3cm 0;
            }
            .party-label {
              float: left;
              width: 20%;
              font-weight: bold;
              letter-spacing: 1px;
            }
            .party-value {
              float: right;
              width: 80%;
            }
            .party-address, .party-phone {
              margin-left: 20%;
              margin-bottom: 0.3cm;
            }
            .content {
              clear: both;
              margin: 2cm 0;
              text-align: justify;
              line-height: 1.8;
              padding: 0 1cm;
            }
            .attachment-title {
              font-size: 18pt;
              font-weight: bold;
              text-align: center;
              margin: 1.5cm 0 1cm 0;
              letter-spacing: 2px;
            }
            .attachment-list {
              padding-left: 2cm;
              margin-bottom: 2cm;
            }
            .date {
              text-align: right;
              margin-top: 2cm;
              margin-bottom: 1cm;
            }
            .signature {
              text-align: right;
              line-height: 1.5;
            }
            .clearfix::after {
              content: "";
              clear: both;
              display: table;
            }
          }
        </style>
      </head>
      <body>
        <div class="title">위 임 장</div>
        
        ${mandatorInfo}
        
        ${attorneyInfo}
        
        <div class="content">
          위 위임인은 수임인에게 소송사건에 기한 상대방(채무자 내지 피고)의 주민등록 초본, 가족관계증명서, 제적등본 등의 발급 및 이를 수행하기 위한 일체의 행위를 할 권한을 위임합니다.
        </div>
        
        <div class="attachment-title">첨 부 서 류</div>
        
        <div class="attachment-list">
          1. 위임인의 신분증 사본
        </div>
        
        <div class="date">${formattedDate}</div>
        
        ${signatureInfo}
        
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    // HTML 내용을 창에 작성
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex items-center mb-6 print:hidden">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="mr-4">
          <ChevronLeft className="h-4 w-4 mr-1" />
          뒤로가기
        </Button>
        <h1 className="text-2xl font-bold">초본 발급 신청서</h1>
      </div>

      <Card className="w-full max-w-4xl mx-auto print:hidden">
        <CardHeader>
          <CardTitle>신청서 양식 작성</CardTitle>
          <CardDescription>
            아래 필드에 정보를 입력하고 인쇄 버튼을 클릭하면 PDF에 자동으로 입력됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="page1" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="page1">1페이지 정보</TabsTrigger>
              <TabsTrigger value="page2">2페이지 정보</TabsTrigger>
              <TabsTrigger value="extra">추가 정보</TabsTrigger>
            </TabsList>

            <TabsContent value="page1" className="space-y-4 pt-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="name1">신청인 선택</Label>
                    <div className="flex space-x-2">
                      <div className="relative flex-1">
                        <Input
                          id="name1"
                          name="name1"
                          value={formData.name1}
                          onChange={handleInputChange}
                          placeholder="신청인 이름을 입력하세요"
                          disabled={!!selectedUser}
                          className={selectedUser ? "pr-10" : ""}
                        />
                        {selectedUser && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6"
                            onClick={handleClearUser}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <Button
                        type="button"
                        onClick={() => setShowSearchDialog(true)}
                        variant="outline"
                      >
                        <Search className="h-4 w-4 mr-2" />
                        검색
                      </Button>
                    </div>
                    {selectedUser && (
                      <div className="text-sm text-muted-foreground flex items-center mt-1">
                        <Check className="h-3 w-3 mr-1 text-green-500" />
                        {selectedUser.email} (
                        {selectedUser.role === "staff"
                          ? "직원"
                          : selectedUser.role === "admin"
                          ? "관리자"
                          : "의뢰인"}
                        )
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="regNumber1">
                      주민등록번호 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="regNumber1"
                      name="regNumber1"
                      value={formData.regNumber1}
                      onChange={handleInputChange}
                      placeholder="주민등록번호를 입력하세요 (000000-0000000)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="number1">전화번호</Label>
                    <Input
                      id="number1"
                      name="number1"
                      value={formData.number1}
                      onChange={handleInputChange}
                      placeholder="전화번호를 입력하세요"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address1">
                      주소 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="address1"
                      name="address1"
                      value={formData.address1}
                      onChange={handleInputChange}
                      placeholder="주소를 입력하세요"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="relationship1">관계</Label>
                    <Input
                      id="relationship1"
                      name="relationship1"
                      value={formData.relationship1}
                      onChange={handleInputChange}
                      placeholder="관계를 입력하세요"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="page2" className="space-y-4 pt-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="case-search">사건 선택</Label>
                    <div className="flex space-x-2">
                      <div className="relative flex-1">
                        <Input
                          id="case-display"
                          placeholder="사건을 선택하려면 검색하세요"
                          value={
                            selectedCase
                              ? `채권자: ${selectedCase.creditor?.name || "정보 없음"}${
                                  selectedCase.creditors?.length > 1
                                    ? ` 외 ${selectedCase.creditors.length - 1}명`
                                    : ""
                                }, 채무자: ${selectedCase.debtor?.name || "정보 없음"}${
                                  selectedCase.debtors?.length > 1
                                    ? ` 외 ${selectedCase.debtors.length - 1}명`
                                    : ""
                                }`
                              : ""
                          }
                          disabled
                          className={selectedCase ? "pr-10" : ""}
                        />
                        {selectedCase && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6"
                            onClick={handleClearCase}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <Button
                        type="button"
                        onClick={() => setShowCaseSearchDialog(true)}
                        variant="outline"
                      >
                        <Search className="h-4 w-4 mr-2" />
                        사건 검색
                      </Button>
                    </div>
                    {selectedCase && (
                      <div className="text-sm text-muted-foreground mt-1 space-y-1">
                        <div className="flex items-center">
                          <Check className="h-3 w-3 mr-1 text-green-500" />
                          사건 유형: {selectedCase.case_type}, 접수일:{" "}
                          {selectedCase.filing_date
                            ? new Date(selectedCase.filing_date).toLocaleDateString()
                            : "정보 없음"}
                        </div>
                        <div className="flex items-start">
                          <div className="mr-2 text-green-500">•</div>
                          <div>
                            <span className="font-medium">채권자:</span>
                            {selectedCase.creditors && selectedCase.creditors.length > 0 ? (
                              <ul className="list-disc list-inside pl-2 mt-1">
                                {selectedCase.creditors.map((creditor, idx) => (
                                  <li key={`creditor-${idx}`} className="ml-2">
                                    {creditor.name}
                                    {creditor.entity_type === "corporation" && ` (법인)`}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              " 정보 없음"
                            )}
                          </div>
                        </div>
                        <div className="flex items-start">
                          <div className="mr-2 text-green-500">•</div>
                          <div>
                            <span className="font-medium">채무자:</span>
                            {selectedCase.debtors && selectedCase.debtors.length > 0 ? (
                              <ul className="list-disc list-inside pl-2 mt-1">
                                {selectedCase.debtors.map((debtor, idx) => (
                                  <li key={`debtor-${idx}`} className="ml-2">
                                    {debtor.name}
                                    {debtor.entity_type === "corporation" && ` (법인)`}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              " 정보 없음"
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 채권자 정보 섹션 */}
                  <div className="space-y-4 md:col-span-2 border p-4 rounded-md">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">채권자 정보</h3>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="creditorType" className="text-sm">
                          유형:
                        </Label>
                        <select
                          id="creditorType"
                          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                          value={creditorType}
                          onChange={(e) => setCreditorType(e.target.value)}
                        >
                          <option value="individual">개인</option>
                          <option value="corporation">법인</option>
                        </select>
                      </div>
                    </div>

                    {creditorType === "individual" ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name1">이름</Label>
                          <Input
                            id="name1"
                            name="name1"
                            value={formData.name1}
                            onChange={handleInputChange}
                            placeholder="이름을 입력하세요"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="regNumber1">주민등록번호</Label>
                          <Input
                            id="regNumber1"
                            name="regNumber1"
                            value={formData.regNumber1}
                            onChange={handleInputChange}
                            placeholder="주민등록번호를 입력하세요"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="address1">주소</Label>
                          <Input
                            id="address1"
                            name="address1"
                            value={formData.address1}
                            onChange={handleInputChange}
                            placeholder="주소를 입력하세요"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="creditorCompanyName">회사명</Label>
                          <Input
                            id="creditorCompanyName"
                            value={creditorInfo.companyName}
                            onChange={(e) =>
                              setCreditorInfo({ ...creditorInfo, companyName: e.target.value })
                            }
                            placeholder="회사명을 입력하세요"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="creditorRegistrationNumber">법인등록번호</Label>
                          <Input
                            id="creditorRegistrationNumber"
                            value={creditorInfo.registrationNumber}
                            onChange={(e) =>
                              setCreditorInfo({
                                ...creditorInfo,
                                registrationNumber: e.target.value,
                              })
                            }
                            placeholder="법인등록번호를 입력하세요"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="creditorAddress">주소</Label>
                          <Input
                            id="creditorAddress"
                            value={creditorInfo.address}
                            onChange={(e) =>
                              setCreditorInfo({ ...creditorInfo, address: e.target.value })
                            }
                            placeholder="주소를 입력하세요"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="creditorRepresentativePosition">대표자 직위</Label>
                          <Input
                            id="creditorRepresentativePosition"
                            value={creditorInfo.representativePosition}
                            onChange={(e) =>
                              setCreditorInfo({
                                ...creditorInfo,
                                representativePosition: e.target.value,
                              })
                            }
                            placeholder="대표자 직위를 입력하세요"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="creditorRepresentativeName">대표자명</Label>
                          <Input
                            id="creditorRepresentativeName"
                            value={creditorInfo.representativeName}
                            onChange={(e) =>
                              setCreditorInfo({
                                ...creditorInfo,
                                representativeName: e.target.value,
                              })
                            }
                            placeholder="대표자명을 입력하세요"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 채무자 정보 섹션 */}
                  <div className="space-y-4 md:col-span-2 border p-4 rounded-md">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">채무자 정보</h3>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="debtorType" className="text-sm">
                          유형:
                        </Label>
                        <select
                          id="debtorType"
                          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                          value={debtorType}
                          onChange={(e) => setDebtorType(e.target.value)}
                        >
                          <option value="individual">개인</option>
                          <option value="corporation">법인</option>
                        </select>
                      </div>
                    </div>

                    {debtorType === "individual" ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name2">이름</Label>
                          <Input
                            id="name2"
                            name="name2"
                            value={formData.name2}
                            onChange={handleInputChange}
                            placeholder="이름을 입력하세요"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="regNumber2">주민등록번호</Label>
                          <Input
                            id="regNumber2"
                            name="regNumber2"
                            value={formData.regNumber2}
                            onChange={handleInputChange}
                            placeholder="주민등록번호를 입력하세요"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="address2">주소</Label>
                          <Input
                            id="address2"
                            name="address2"
                            value={formData.address2}
                            onChange={handleInputChange}
                            placeholder="주소를 입력하세요"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="debtorCompanyName">회사명</Label>
                          <Input
                            id="debtorCompanyName"
                            value={debtorInfo.companyName}
                            onChange={(e) =>
                              setDebtorInfo({ ...debtorInfo, companyName: e.target.value })
                            }
                            placeholder="회사명을 입력하세요"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="debtorRegistrationNumber">법인등록번호</Label>
                          <Input
                            id="debtorRegistrationNumber"
                            value={debtorInfo.registrationNumber}
                            onChange={(e) =>
                              setDebtorInfo({ ...debtorInfo, registrationNumber: e.target.value })
                            }
                            placeholder="법인등록번호를 입력하세요"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="debtorAddress">주소</Label>
                          <Input
                            id="debtorAddress"
                            value={debtorInfo.address}
                            onChange={(e) =>
                              setDebtorInfo({ ...debtorInfo, address: e.target.value })
                            }
                            placeholder="주소를 입력하세요"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="debtorRepresentativePosition">대표자 직위</Label>
                          <Input
                            id="debtorRepresentativePosition"
                            value={debtorInfo.representativePosition}
                            onChange={(e) =>
                              setDebtorInfo({
                                ...debtorInfo,
                                representativePosition: e.target.value,
                              })
                            }
                            placeholder="대표자 직위를 입력하세요"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="debtorRepresentativeName">대표자명</Label>
                          <Input
                            id="debtorRepresentativeName"
                            value={debtorInfo.representativeName}
                            onChange={(e) =>
                              setDebtorInfo({ ...debtorInfo, representativeName: e.target.value })
                            }
                            placeholder="대표자명을 입력하세요"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 법원 정보 필드 - 2페이지 하단으로 이동 */}
                  <div className="space-y-2 md:col-span-2 mt-6">
                    <Label htmlFor="courtName">법원 이름</Label>
                    <Input
                      id="courtName"
                      name="courtName"
                      value={formData.courtName}
                      onChange={handleInputChange}
                      placeholder="법원 이름을 입력하세요"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="extra" className="space-y-4 pt-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="goal1">목적</Label>
                    <Input
                      id="goal1"
                      name="goal1"
                      value={formData.goal1}
                      onChange={handleInputChange}
                      placeholder="발급 목적을 입력하세요"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="file1">첨부파일</Label>
                    <Input
                      id="file1"
                      name="file1"
                      value={formData.file1}
                      onChange={handleInputChange}
                      placeholder="첨부파일 정보를 입력하세요"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date1">날짜</Label>
                    <Input
                      id="date1"
                      name="date1"
                      value={formData.date1}
                      onChange={handleInputChange}
                      placeholder="날짜를 입력하세요 (YYYY년 MM월 DD일)"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/")}>
            취소
          </Button>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleViewOriginal}>
              <FileCheck className="h-4 w-4 mr-2" />
              원본 양식 보기
            </Button>
            <Button variant="outline" onClick={printPropertyDisclosureRequest}>
              <FileCheck className="h-4 w-4 mr-2" />
              재산명시신청서
            </Button>
            <Button variant="outline" onClick={printPowerOfAttorney}>
              <FileCheck className="h-4 w-4 mr-2" />
              위임장
            </Button>
            <Button onClick={handleFillAndPrint} disabled={isLoading}>
              <Printer className="h-4 w-4 mr-2" />
              {isLoading ? "처리 중..." : "초본신청서 다운로드"}
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* 사용자 검색 모달 */}
      <Dialog open={showSearchDialog} onOpenChange={setShowSearchDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>사용자 검색</DialogTitle>
            <DialogDescription>
              이름으로 사용자를 검색하여 신청인 정보를 자동으로 채웁니다.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center space-x-2 py-4">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="searchTerm" className="sr-only">
                검색어
              </Label>
              <Input
                id="searchTerm"
                placeholder="이름으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="col-span-3"
              />
            </div>
            <Button onClick={searchUsers} disabled={isSearching}>
              <Search className="h-4 w-4 mr-2" />
              {isSearching ? "검색 중..." : "검색"}
            </Button>
          </div>

          <div className="max-h-[300px] overflow-auto border rounded-md">
            {searchResults.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>이름</TableHead>
                    <TableHead>이메일</TableHead>
                    <TableHead>역할</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchResults.map((user) => (
                    <TableRow
                      key={user.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSelectUser(user)}
                    >
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.role === "staff"
                          ? "직원"
                          : user.role === "admin"
                          ? "관리자"
                          : "의뢰인"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                {searchTerm ? "검색 결과가 없습니다" : "이름으로 사용자를 검색하세요"}
              </div>
            )}
          </div>

          <DialogFooter className="sm:justify-end">
            <Button variant="outline" onClick={() => setShowSearchDialog(false)}>
              취소
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 사건 검색 모달 */}
      <Dialog open={showCaseSearchDialog} onOpenChange={setShowCaseSearchDialog}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>사건 검색</DialogTitle>
            <DialogDescription>
              당사자 이름으로 사건을 검색하여 채무자 정보를 자동으로 채웁니다.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center space-x-2 py-4">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="caseSearchTerm" className="sr-only">
                검색어
              </Label>
              <Input
                id="caseSearchTerm"
                placeholder="당사자 이름으로 검색..."
                value={caseSearchTerm}
                onChange={(e) => setCaseSearchTerm(e.target.value)}
                className="col-span-3"
              />
            </div>
            <Button onClick={searchCases} disabled={isCaseSearching}>
              <Search className="h-4 w-4 mr-2" />
              {isCaseSearching ? "검색 중..." : "검색"}
            </Button>
          </div>

          <div className="max-h-[300px] overflow-auto border rounded-md">
            {caseSearchResults.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>채권자</TableHead>
                    <TableHead>채무자</TableHead>
                    <TableHead>사건 유형</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {caseSearchResults.map((caseItem) => (
                    <TableRow
                      key={caseItem.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSelectCase(caseItem)}
                    >
                      <TableCell className="font-medium">
                        {caseItem.creditor?.name || "정보 없음"}
                        {caseItem.creditors?.length > 1 && ` 외 ${caseItem.creditors.length - 1}명`}
                      </TableCell>
                      <TableCell>
                        {caseItem.debtor?.name || "정보 없음"}
                        {caseItem.debtors?.length > 1 && ` 외 ${caseItem.debtors.length - 1}명`}
                      </TableCell>
                      <TableCell>{caseItem.case_type || "정보 없음"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                {caseSearchTerm ? "검색 결과가 없습니다" : "당사자 이름으로 사건을 검색하세요"}
              </div>
            )}
          </div>

          <DialogFooter className="sm:justify-end">
            <Button variant="outline" onClick={() => setShowCaseSearchDialog(false)}>
              취소
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
