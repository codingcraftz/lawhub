"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Users, UserRound, Building2 } from "lucide-react";

export default function ClientsLayout({ children }) {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/clients",
      label: "전체 의뢰인",
      icon: <Users className="h-4 w-4" />,
      active:
        pathname === "/clients" || (pathname.startsWith("/clients") && !pathname.includes("[id]")),
    },
    {
      href: "/clients?tab=individuals",
      label: "개인 의뢰인",
      icon: <UserRound className="h-4 w-4" />,
      active: pathname.includes("?tab=individuals"),
    },
    {
      href: "/clients?tab=organizations",
      label: "기업 의뢰인",
      icon: <Building2 className="h-4 w-4" />,
      active: pathname.includes("?tab=organizations"),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <div className="border-b">
        <div className="container flex h-14 max-w-screen-2xl items-center">
          <div className="flex items-center space-x-4 lg:space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                  item.active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <main className="flex-1">{children}</main>
    </div>
  );
}
