// src/app/case-management/page.jsx

"use client";

import React, { useState } from "react";
import { Dialog, Button, Switch } from "@radix-ui/themes";
import CaseCompactView from "./_components/CaseCompactView";
import CaseForm from "./_components/CaseForm";
import CaseCardView from "./_components/CaseCardView";
import { useRouter, useSearchParams } from "next/navigation";

const CaseManagementPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const viewParam = searchParams.get("view");
  const isCompactView = viewParam === "compact";

  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [newCaseTrigger, setNewCaseTrigger] = useState(0);

  const handleCaseSuccess = () => {
    setNewCaseTrigger((prev) => prev + 1);
    setIsNewCaseModalOpen(false);
    setSelectedCase(null);
  };

  const updateSearchParams = (params) => {
    const currentParams = new URLSearchParams(searchParams.toString());

    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") {
        currentParams.delete(key);
      } else {
        currentParams.set(key, value);
      }
    });

    const newSearch = currentParams.toString();
    const newPath = newSearch ? `?${newSearch}` : "";

    router.push(newPath);
  };

  const handleCompactViewToggle = (checked) => {
    const newView = checked ? "compact" : "card";
    updateSearchParams({ view: newView });
  };

  return (
    <div className="p-4 max-w-7xl w-full mx-auto">
      <header className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">사건 관리</h1>
          <div className="flex items-center">
            <Switch
              checked={isCompactView}
              onCheckedChange={handleCompactViewToggle}
              id="compactViewSwitch"
              className="ml-2"
            />
            <label
              htmlFor="compactViewSwitch"
              className="ml-2 text-gray-600 text-sm"
            >
              간략히 보기
            </label>
          </div>
        </div>
        <Button
          onClick={() => setIsNewCaseModalOpen(true)}
          className="px-4 py-2 bg-green-500 text-white rounded-md"
        >
          새 사건 등록
        </Button>
      </header>
      <main>
        {isCompactView ? (
          <CaseCompactView newCaseTrigger={newCaseTrigger} />
        ) : (
          <CaseCardView newCaseTrigger={newCaseTrigger} />
        )}
      </main>

      <Dialog.Root
        open={isNewCaseModalOpen}
        onOpenChange={setIsNewCaseModalOpen}
      >
        <Dialog.Content style={{ maxWidth: 600 }}>
          <Dialog.Title>새 사건 등록</Dialog.Title>
          <Dialog.Close asChild>
            <Button
              variant="ghost"
              color="gray"
              size="2"
              style={{ position: "absolute", top: 9, right: 8 }}
              onClick={() => setIsNewCaseModalOpen(false)}
            >
              닫기
            </Button>
          </Dialog.Close>
          <CaseForm
            caseData={selectedCase}
            onSuccess={handleCaseSuccess}
            onClose={() => setIsNewCaseModalOpen(false)}
          />
        </Dialog.Content>
      </Dialog.Root>
    </div>
  );
};

export default CaseManagementPage;
