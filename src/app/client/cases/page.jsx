// src/app/clientCases/page.jsx

"use client";

import { Switch } from "@radix-ui/themes";
import ClientCompactView from "./ClientCompactView";
import ClientCardView from "./ClientCardView";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import useAuthRedirect from "@/hooks/useAuthRedirect";

const ClientCasesPage = () => {
  useAuthRedirect(["client", "admin", "staff"], "/login");
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // URL에서 뷰 모드를 가져옵니다.
  const viewParam = searchParams.get("view") || "card";
  const isCompactView = viewParam === "compact";

  const handleCompactViewToggle = (checked) => {
    const newView = checked ? "compact" : "card";
    updateSearchParams({ view: newView });
  };

  const updateSearchParams = (params) => {
    const currentParams = new URLSearchParams(window.location.search);

    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") {
        currentParams.delete(key);
      } else {
        currentParams.set(key, value);
      }
    });

    const newSearch = currentParams.toString();
    const newPath = pathname + (newSearch ? `?${newSearch}` : "");

    router.push(newPath);
  };

  return (
    <div className="p-4 max-w-7xl w-full mx-auto">
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">내 사건</h1>
        <div className="flex items-center gap-2">
          <Switch
            checked={isCompactView}
            onCheckedChange={handleCompactViewToggle}
          />
          <label>간략히 보기</label>
        </div>
      </header>
      {isCompactView ? <ClientCompactView /> : <ClientCardView />}
    </div>
  );
};

export default ClientCasesPage;
