"use client";

import React, { useState } from "react";
import { Button, Dialog, Switch } from "@radix-ui/themes";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import CaseCompactView from "@/app/case-management/_components/CaseCompactView";
import CaseCardView from "@/app/case-management/_components/CaseCardView";
import { ArrowLeftIcon } from "@radix-ui/react-icons";

const ClientCasePage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { id: clientId } = useParams();
  const viewParam = searchParams.get("view");
  const isCompactView = viewParam === "compact";

  const updateSearchParams = (params) => {
    const currentParams = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") {
        currentParams.delete(key);
      } else {
        currentParams.set(key, value);
      }
    });
    router.push(`?${currentParams.toString()}`);
  };

  const handleCompactViewToggle = (checked) => {
    updateSearchParams({ view: checked ? "compact" : "card" });
  };

  return (
    <div className="p-4 max-w-7xl w-full mx-auto">
      <header className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <ArrowLeftIcon
            className="w-8 h-8 cursor-pointer mr-3"
            onClick={() => router.push("/case-management")}
          />
          <h1 className="text-2xl font-bold">사건 관리</h1>
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
      </header>
      <main>
        {isCompactView ? (
          <CaseCompactView clientId={clientId} />
        ) : (
          <CaseCardView clientId={clientId} />
        )}
      </main>
    </div>
  );
};

export default ClientCasePage;
