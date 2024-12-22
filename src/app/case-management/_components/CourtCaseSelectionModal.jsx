import React, { useState } from "react";
import { Flex, Button, Dialog } from "@radix-ui/themes";

const CourtCaseSelectionModal = ({ onConfirm, onClose }) => {
  const [courtName, setCourtName] = useState("");
  const [caseYear, setCaseYear] = useState("");
  const [caseNumber, setCaseNumber] = useState("");
  const [caseSubject, setCaseSubject] = useState(""); // 사건 세부 추가

  const handleConfirm = () => {
    const caseInfo = `${courtName} ${caseYear} ${caseNumber} ${caseSubject}`;
    onConfirm({
      courtName,
      caseYear,
      caseNumber,
      caseSubject,
      caseInfo, // 전체 데이터 전달
    });
    onClose();
  };

  return (
    <Dialog.Content style={{ maxWidth: "500px" }}>
      <Dialog.Title>법원 및 사건 정보 입력</Dialog.Title>
      <Flex direction="column" gap="4">
        <div>
          <label
            htmlFor="courtName"
            style={{ display: "block", marginBottom: "8px" }}
          >
            법원 이름
          </label>
          <input
            id="courtName"
            type="text"
            placeholder="(예: 부산고등법원)"
            value={courtName}
            onChange={(e) => setCourtName(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
        </div>
        <div>
          <label
            htmlFor="caseYear"
            style={{ display: "block", marginBottom: "8px" }}
          >
            사건 연도
          </label>
          <input
            id="caseYear"
            type="number"
            placeholder="(예: 2024)"
            value={caseYear}
            onChange={(e) => setCaseYear(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
        </div>
        <div>
          <label
            htmlFor="caseNumber"
            style={{ display: "block", marginBottom: "8px" }}
          >
            사건 번호
          </label>
          <input
            id="caseNumber"
            type="number"
            placeholder="(예: 5019)"
            value={caseNumber}
            onChange={(e) => setCaseNumber(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
        </div>
        <div>
          <label
            htmlFor="caseSubject"
            style={{ display: "block", marginBottom: "8px" }}
          >
            사건 세부
          </label>
          <input
            id="caseSubject"
            type="text"
            placeholder="(예: 해산명령)"
            value={caseSubject}
            onChange={(e) => setCaseSubject(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
        </div>
        <Flex gap="2" justify="end">
          <Button variant="soft" color="gray" onClick={onClose}>
            취소
          </Button>
          <Button variant="solid" onClick={handleConfirm}>
            확인
          </Button>
        </Flex>
      </Flex>
    </Dialog.Content>
  );
};

export default CourtCaseSelectionModal;
