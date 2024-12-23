import React, { useState } from "react";
import { Flex, Button } from "@radix-ui/themes";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";

const CourtCaseSelectionModal = ({
  onConfirm,
  onClose,
  open,
  onOpenChange,
}) => {
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
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Overlay className="fixed inset-0 bg-black opacity-75 data-[state=open]:animate-overlayShow" />
      <Dialog.Content className="fixed bg-gray-3 left-1/2 top-1/2 max-h-[85vh] min-w-[500px] max-w-[650px] -translate-x-1/2 -translate-y-1/2 rounded-md p-[25px] shadow focus:outline-none data-[state=open]:animate-contentShow">
        <Dialog.Close asChild>
          <Button
            variant="ghost"
            color="gray"
            style={{ position: "absolute", top: 8, right: 8 }}
          >
            <Cross2Icon width={25} height={25} />
          </Button>
        </Dialog.Close>
        <Dialog.Title className="font-bold text-xl">
          법원 및 사건 정보 입력
        </Dialog.Title>
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
    </Dialog.Root>
  );
};

export default CourtCaseSelectionModal;
