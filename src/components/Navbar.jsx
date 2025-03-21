"use client";

import { useState } from "react";
import Link from "next/link";
import { useUser } from "@/contexts/UserContext";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Menu,
  Home,
  FileText,
  Briefcase,
  Users,
  Settings,
  LogOut,
  PersonStandingIcon,
  User,
  Bell,
  Scale,
  CalendarRange,
  Building2,
  UserCog,
  ClipboardList,
  Folders,
  UsersRound,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";
import NotificationCenter from "@/components/NotificationCenter";

export default function Navbar() {
  const { user, loading, signOut, isAdmin, isStaff, isClient } = useUser();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // 현재 경로에 따라 네비게이션 아이템의 활성화 상태 결정
  const isActive = (path) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  // 모바일 메뉴 닫기
  const closeMenu = () => {
    setIsOpen(false);
  };

  // 사용자 디스플레이 이름 가져오기
  const getUserDisplayName = () => {
    if (!user) return "";
    return user.nickname || user.name || "";
  };

  // 프로필 이미지 가져오기
  const getProfileImage = () => {
    if (!user) return "";
    return user.profile_image || "";
  };

  return (
    <nav className="bg-white/80 dark:bg-gray-950/80 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40 backdrop-blur-sm shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* 로고 */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
            <Scale className="h-5 w-5" />
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
            LawHub
          </span>
        </Link>

        {/* 데스크탑 네비게이션 */}
        <div className="hidden md:flex items-center space-x-2">
          <Link href="/">
            <Button
              variant={isActive("/") ? "default" : "ghost"}
              size="sm"
              className={cn(
                "flex items-center rounded-lg transition-all",
                isActive("/")
                  ? "bg-blue-500 hover:bg-blue-600 text-white"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              <Home className="mr-2 h-4 w-4" />홈
            </Button>
          </Link>

          {/* 클라이언트 관리 - 관리자와 직원만 접근 가능 */}
          {(isAdmin() || isStaff()) && (
            <Link href="/clients">
              <Button
                variant={isActive("/clients") ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "flex items-center rounded-lg transition-all",
                  isActive("/clients")
                    ? "bg-purple-500 hover:bg-purple-600 text-white"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                <Users className="mr-2 h-4 w-4" />
                의뢰 관리
              </Button>
            </Link>
          )}

          {/* 사건 관리 - 관리자와 직원만 접근 가능 */}
          {(isAdmin() || isStaff()) && (
            <Link href="/cases">
              <Button
                variant={isActive("/cases") ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "flex items-center rounded-lg transition-all",
                  isActive("/cases")
                    ? "bg-indigo-500 hover:bg-indigo-600 text-white"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                <FileText className="mr-2 h-4 w-4" />
                사건 관리
              </Button>
            </Link>
          )}

          {/* 채권 관리 - 모든 사용자 접근 가능
          <Link href="/debts">
            <Button
              variant={isActive("/debts") ? "default" : "ghost"}
              size="sm"
              className={cn(
                "flex items-center rounded-lg transition-all",
                isActive("/debts")
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              <Briefcase className="mr-2 h-4 w-4" />
              채권 관리
            </Button>
          </Link> */}

          {/* 나의 의뢰 - 클라이언트만 접근 가능 */}
          {(isClient() || isAdmin()) && (
            <Link href="/my-cases">
              <Button
                variant={isActive("/my-cases") ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "flex items-center rounded-lg transition-all",
                  isActive("/my-cases")
                    ? "bg-blue-500 hover:bg-blue-600 text-white"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                <ClipboardList className="mr-2 h-4 w-4" />
                나의 의뢰
              </Button>
            </Link>
          )}

          {/* 담당자 관리 - 관리자만 접근 가능 */}
          {isAdmin() && (
            <Link href="/admin/case-handlers">
              <Button
                variant={isActive("/admin/case-handlers") ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "flex items-center rounded-lg transition-all",
                  isActive("/admin/case-handlers")
                    ? "bg-teal-500 hover:bg-teal-600 text-white"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                <UserCog className="mr-2 h-4 w-4" />
                담당자 관리
              </Button>
            </Link>
          )}

          {/* 조직 관리 - 관리자만 접근 가능 */}
          {isAdmin() && (
            <Link href="/organizations">
              <Button
                variant={isActive("/organizations") ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "flex items-center rounded-lg transition-all",
                  isActive("/organizations")
                    ? "bg-teal-500 hover:bg-teal-600 text-white"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                <Building2 className="mr-2 h-4 w-4" />
                조직 관리
              </Button>
            </Link>
          )}

          {/* 일정 관리 - 모든 사용자 접근 가능
          <Link href="/calendar">
            <Button
              variant={isActive("/calendar") ? "default" : "ghost"}
              size="sm"
              className={cn(
                "flex items-center rounded-lg transition-all",
                isActive("/calendar")
                  ? "bg-amber-500 hover:bg-amber-600 text-white"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              <CalendarRange className="mr-2 h-4 w-4" />
              일정 관리
            </Button>
          </Link> */}
        </div>

        {/* 우측 기능 버튼들 */}
        <div className="flex items-center space-x-2">
          <ThemeToggle />

          {/* 알림 버튼 */}
          {user && <NotificationCenter />}

          {/* 사용자 메뉴 */}
          {!loading && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="rounded-full overflow-hidden p-0 w-9 h-9 bg-blue-50 dark:bg-blue-900/30 ring-1 ring-gray-200 dark:ring-gray-700"
                >
                  <Avatar className="rounded-full w-9 h-9">
                    <AvatarImage src={getProfileImage()} alt={getUserDisplayName()} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                      {getUserDisplayName()
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-1 p-2">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{getUserDisplayName()}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  프로필
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  설정
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer flex items-center text-red-500 dark:text-red-400"
                  onClick={signOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            !loading && (
              <Link href="/login">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 border-0 text-white shadow-md"
                >
                  로그인
                </Button>
              </Link>
            )
          )}

          {/* 모바일 메뉴 버튼 */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden rounded-lg"
                aria-label="메뉴"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[80%] sm:w-[350px]">
              {user && (
                <div className="flex items-center mb-6 mt-4">
                  <Avatar className="rounded-full w-9 h-9 mr-3">
                    <AvatarImage src={getProfileImage()} alt={getUserDisplayName()} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                      {getUserDisplayName()
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{getUserDisplayName()}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                </div>
              )}

              <div className="space-y-2 py-4">
                <Link href="/" onClick={closeMenu}>
                  <Button
                    variant={isActive("/") ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start",
                      isActive("/") ? "bg-blue-500 hover:bg-blue-600 text-white" : ""
                    )}
                  >
                    <Home className="mr-2 h-5 w-5" />홈
                  </Button>
                </Link>

                {/* 사건 관리 - 관리자와 직원만 접근 가능 */}
                {(isAdmin() || isStaff()) && (
                  <Link href="/cases" onClick={closeMenu}>
                    <Button
                      variant={isActive("/cases") ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start",
                        isActive("/cases") ? "bg-indigo-500 hover:bg-indigo-600 text-white" : ""
                      )}
                    >
                      <FileText className="mr-2 h-5 w-5" />
                      사건 관리
                    </Button>
                  </Link>
                )}

                {/* 의뢰 관리 - 관리자와 직원만 접근 가능 */}
                {(isAdmin() || isStaff()) && (
                  <Link href="/clients" onClick={closeMenu}>
                    <Button
                      variant={isActive("/clients") ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start",
                        isActive("/clients") ? "bg-purple-500 hover:bg-purple-600 text-white" : ""
                      )}
                    >
                      <Users className="mr-2 h-5 w-5" />
                      의뢰 관리
                    </Button>
                  </Link>
                )}

                {/* 채권 관리는 주석 처리되어 있음 - 주석 유지 */}
                {/* <Link href="/debts" onClick={closeMenu}>
                  <Button
                    variant={isActive("/debts") ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start",
                      isActive("/debts") ? "bg-emerald-500 hover:bg-emerald-600 text-white" : ""
                    )}
                  >
                    <Briefcase className="mr-2 h-5 w-5" />
                    채권 관리
                  </Button>
                </Link> */}

                {/* 모바일 - 나의 의뢰 - 클라이언트 또는 관리자만 접근 가능 */}
                {(isClient() || isAdmin()) && (
                  <Link href="/my-cases" onClick={closeMenu}>
                    <Button
                      variant={isActive("/my-cases") ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start",
                        isActive("/my-cases") ? "bg-blue-500 hover:bg-blue-600 text-white" : ""
                      )}
                    >
                      <ClipboardList className="mr-2 h-5 w-5" />
                      나의 의뢰
                    </Button>
                  </Link>
                )}

                {/* 모바일 - 담당자 관리 - 관리자만 접근 가능 */}
                {isAdmin() && (
                  <Link href="/admin/case-handlers" onClick={closeMenu}>
                    <Button
                      variant={isActive("/admin/case-handlers") ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start",
                        isActive("/admin/case-handlers")
                          ? "bg-teal-500 hover:bg-teal-600 text-white"
                          : ""
                      )}
                    >
                      <UserCog className="mr-2 h-5 w-5" />
                      담당자 관리
                    </Button>
                  </Link>
                )}

                {/* 모바일 - 조직 관리 - 관리자만 접근 가능 */}
                {isAdmin() && (
                  <Link href="/organizations" onClick={closeMenu}>
                    <Button
                      variant={isActive("/organizations") ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start",
                        isActive("/organizations") ? "bg-teal-500 hover:bg-teal-600 text-white" : ""
                      )}
                    >
                      <Building2 className="mr-2 h-5 w-5" />
                      조직 관리
                    </Button>
                  </Link>
                )}

                {/* 일정 관리 - 주석 처리되어 있음 - 주석 유지 */}
                {/* <Link href="/calendar" onClick={closeMenu}>
                  <Button
                    variant={isActive("/calendar") ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start",
                      isActive("/calendar")
                        ? "bg-amber-500 hover:bg-amber-600 text-white"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                  >
                    <CalendarRange className="mr-2 h-5 w-5" />
                    일정 관리
                  </Button>
                </Link> */}
              </div>

              {/* 관리자 메뉴 - 모바일 */}
              {isAdmin() && (
                <div className="mt-4 border-t border-gray-200 dark:border-gray-800 pt-4">
                  <h3 className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                    관리자 메뉴
                  </h3>
                  <div className="space-y-1">
                    <Link href="/admin/users" onClick={closeMenu}>
                      <Button
                        variant={isActive("/admin/users") ? "default" : "ghost"}
                        className={cn(
                          "w-full justify-start",
                          isActive("/admin/users")
                            ? "bg-indigo-500 hover:bg-indigo-600 text-white"
                            : ""
                        )}
                      >
                        <UsersRound className="mr-2 h-5 w-5" />
                        사용자 관리
                      </Button>
                    </Link>
                    <Link href="/admin/settings" onClick={closeMenu}>
                      <Button
                        variant={isActive("/admin/settings") ? "default" : "ghost"}
                        className={cn(
                          "w-full justify-start",
                          isActive("/admin/settings")
                            ? "bg-teal-500 hover:bg-teal-600 text-white"
                            : ""
                        )}
                      >
                        <Settings className="mr-2 h-5 w-5" />
                        시스템 설정
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              <div className="absolute bottom-4 w-full pr-6">
                <div className="flex justify-between items-center">
                  <ThemeToggle />
                  {user && (
                    <Button
                      variant="ghost"
                      className="text-red-500 dark:text-red-400"
                      onClick={() => {
                        closeMenu();
                        signOut();
                      }}
                    >
                      <LogOut className="mr-2 h-5 w-5" />
                      로그아웃
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}

// 관리자 메뉴 컴포넌트
function AdminMenu({ user }) {
  const pathname = usePathname();

  if (user?.role !== "admin") {
    return null;
  }

  return (
    <div className="py-2">
      <h3 className="mb-2 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400">
        관리자 메뉴
      </h3>
      <nav className="grid gap-1 px-2">
        <Link
          href="/admin/users"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground",
            pathname.startsWith("/admin/users")
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground"
          )}
        >
          <Users className="h-4 w-4" />
          사용자 관리
        </Link>
        <Link
          href="/admin/settings"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground",
            pathname.startsWith("/admin/settings")
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground"
          )}
        >
          <Settings className="h-4 w-4" />
          시스템 설정
        </Link>
        <Link
          href="/admin/case-handlers"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground",
            pathname.startsWith("/admin/case-handlers")
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground"
          )}
        >
          <UserCog className="h-4 w-4" />
          사건 담당자 관리
        </Link>
      </nav>
    </div>
  );
}
