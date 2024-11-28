"use client";

import React, { useState } from "react";
import { Button, Switch } from "@radix-ui/themes";
import ClientCompactView from "./ClientCompactView";
import ClientCardView from "./ClientCardView";

const ClientCasesPage = () => {
  const [isCompactView, setIsCompactView] = useState(false);

  return (
    <div className="p-4 max-w-7xl w-full mx-auto">
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">내 사건</h1>
        <div className="flex items-center gap-2">
          <Switch checked={isCompactView} onCheckedChange={setIsCompactView} />
          <label>간략히 보기</label>
        </div>
      </header>
      {isCompactView ? <ClientCompactView /> : <ClientCardView />}
    </div>
  );
};

export default ClientCasesPage;
