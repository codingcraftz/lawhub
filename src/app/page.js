"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import {
  FileText,
  Briefcase,
  ArrowRight,
  Shield,
  Scale,
  Clock,
  Users,
  ArrowUpRight,
  CalendarRange,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function Home() {
  const [isCompanyInfoOpen, setIsCompanyInfoOpen] = useState(false);

  return (
    <>
      <main className="container mx-auto px-4 py-12">
        {/* 히어로 섹션 */}
        <section className="mb-20 text-center md:text-left md:flex md:items-center md:justify-between md:space-x-10">
          <div className="md:w-1/2 space-y-6">
            <div className="inline-block mb-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
              민사소송 및 채권관리 시스템
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 dark:from-gray-100 dark:via-gray-200 dark:to-gray-300 bg-clip-text text-transparent">
              효율적인 채권관리와
              <br />
              소송진행의 시작
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              LawHub은 법무법인과 기업에게 민사소송 및 채권관리를 위한 종합적인 솔루션을 제공합니다.
            </p>
            <div className="flex flex-col sm:flex-row justify-center md:justify-start space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
              <Link href="/login">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 border-0 shadow-md"
                >
                  시작하기
                </Button>
              </Link>
            </div>
          </div>
          <div className="hidden md:block md:w-1/2">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 rounded-2xl p-10 h-80 flex items-center justify-center shadow-lg overflow-hidden relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
              <Scale className="h-32 w-32 text-blue-500 dark:text-blue-400" />
            </div>
          </div>
        </section>

        {/* 주요 기능 섹션 */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-blue-400 inline-block">
              주요 기능
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-2xl mx-auto">
              LawHub은 민사소송과 채권관리의 모든 단계를 관리하고 추적할 수 있는 종합 기능을
              제공합니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 shadow-md">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">사건 관리</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  민사소송 전 과정을 체계적으로 관리하고 진행 상황을 실시간으로 파악하세요.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center text-gray-700 dark:text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mr-3">
                      <ArrowRight className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    </div>
                    소송 일정 알림 및 관리
                  </li>
                  <li className="flex items-center text-gray-700 dark:text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mr-3">
                      <ArrowRight className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    </div>
                    관련 서류 디지털 보관
                  </li>
                  <li className="flex items-center text-gray-700 dark:text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mr-3">
                      <ArrowRight className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    </div>
                    소송 진행 상황 실시간 업데이트
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Link href="/cases" className="w-full">
                  <Button
                    variant="outline"
                    className="w-full bg-white/90 dark:bg-slate-800/90 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    자세히 보기
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card className="border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mb-4 shadow-md">
                  <Briefcase className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">채권 관리</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  채권 회수와 관련된 모든 과정을 한 곳에서 효율적으로 관리하세요.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center text-gray-700 dark:text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mr-3">
                      <ArrowRight className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    채권 현황 대시보드
                  </li>
                  <li className="flex items-center text-gray-700 dark:text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mr-3">
                      <ArrowRight className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    자동 이자 계산 및 추적
                  </li>
                  <li className="flex items-center text-gray-700 dark:text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mr-3">
                      <ArrowRight className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    회수 활동 기록 및 보고서
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Link href="/debts" className="w-full">
                  <Button
                    variant="outline"
                    className="w-full bg-white/90 dark:bg-slate-800/90 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    자세히 보기
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card className="border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center mb-4 shadow-md">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">클라이언트 포털</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  클라이언트에게 실시간 진행 상황과 문서 접근 권한을 제공하세요.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center text-gray-700 dark:text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mr-3">
                      <ArrowRight className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                    </div>
                    클라이언트 전용 대시보드
                  </li>
                  <li className="flex items-center text-gray-700 dark:text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mr-3">
                      <ArrowRight className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                    </div>
                    문서 공유 및 승인 워크플로우
                  </li>
                  <li className="flex items-center text-gray-700 dark:text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mr-3">
                      <ArrowRight className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                    </div>
                    실시간 알림 및 메시징
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Link href="/clients" className="w-full">
                  <Button
                    variant="outline"
                    className="w-full bg-white/90 dark:bg-slate-800/90 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    자세히 보기
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* 주요 혜택 섹션 */}
        <section className="mb-20">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-8 md:p-12 shadow-md relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(109,103,220,0.1),rgba(255,255,255,0))]"></div>
            <div className="relative z-10">
              <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                LawHub을 사용하면 얻을 수 있는 혜택
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm flex items-start">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-4 flex-shrink-0">
                    <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">시간 절약</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      반복적인 관리 업무를 자동화하여 업무 효율성을 30% 이상 높일 수 있습니다.
                    </p>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm flex items-start">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mr-4 flex-shrink-0">
                    <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">안전한 데이터 관리</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      은행 수준의 암호화로 민감한 법률 문서와 클라이언트 정보를 안전하게 보호합니다.
                    </p>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm flex items-start">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mr-4 flex-shrink-0">
                    <CalendarRange className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">일정 관리</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      중요한 소송 일정과 기한을 놓치지 않도록 자동 알림 시스템을 제공합니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA 섹션 */}
        <section className="text-center">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-8 md:p-12 shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.15),rgba(255,255,255,0))]"></div>
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-white mb-4">효율적인 사건관리의 시작</h2>
              <p className="text-blue-100 mb-8">
                지금 LawHub에 가입하고 체계적인 민사소송 및 채권관리 시스템을 경험해보세요.
              </p>
              <div className="flex justify-center">
                <Link href="/login">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-white text-blue-600 hover:bg-gray-100 dark:bg-white dark:text-blue-600 dark:hover:bg-gray-100"
                  >
                    무료로 시작하기
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 푸터 */}
      <footer className="bg-gray-100 dark:bg-gray-900 py-12 mt-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center mb-8">
            <h3 className="text-xl font-bold">LawHub</h3>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-center">
              효율적인 민사소송 및 채권 관리 시스템
            </p>
          </div>

          <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-8 mb-8">
            <Link href="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-primary">
              개인정보처리방침
            </Link>
            <Link href="/terms" className="text-gray-600 dark:text-gray-400 hover:text-primary">
              이용약관
            </Link>
            <button
              onClick={() => setIsCompanyInfoOpen(!isCompanyInfoOpen)}
              className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            >
              사업자 정보{" "}
              {isCompanyInfoOpen ? (
                <ChevronUp className="ml-1 h-4 w-4" />
              ) : (
                <ChevronDown className="ml-1 h-4 w-4" />
              )}
            </button>
          </div>

          {isCompanyInfoOpen && (
            <div className="border-t border-b border-gray-200 dark:border-gray-700 py-4 mb-8">
              <div className="max-w-lg mx-auto space-y-1 text-sm text-gray-600 dark:text-gray-400 text-center">
                <p>대표이사: 황현기</p>
                <p>전화: 010-8315-9644 (대표전화)</p>
                <p>사업자등록번호: 855-96-01265</p>
                <p>주소: 서울 특별시 강서구 양천로65길 41-22, 220호(염창동, JK블라썸)</p>
                <p>이메일: Lawyeroffice29@naver.com</p>
              </div>
            </div>
          )}

          <div className="text-center text-gray-600 dark:text-gray-400 text-sm">
            <p>© {new Date().getFullYear()} LawHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
