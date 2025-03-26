import React from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Search, X, RefreshCw, User, Clock } from "lucide-react";

export function ConversationList({
  opinions,
  loading,
  refreshing,
  fetchOpinions,
  selectedOpinion,
  handleSelectOpinion,
  searchQuery,
  setSearchQuery,
  user,
}) {
  // 대화 스레드로 그룹화하는 함수
  const getConversationThreads = () => {
    // 부모 메시지가 없는 최상위 메시지만 필터링
    return Array.from(
      new Set(
        opinions
          .filter((op) => !op.parent_id)
          // 시간순으로 정렬
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          // 검색어 필터링
          .filter(
            (op) =>
              !searchQuery ||
              op.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              op.creditor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              op.debtor_name?.toLowerCase().includes(searchQuery.toLowerCase())
          )
          // 자신이 보냈거나 받은 메시지만 표시
          .filter((op) => op.created_by === user.id || op.receiver_id === user.id)
          .map((op) => op.id)
      )
    );
  };

  // 대화 스레드를 렌더링하는 함수
  const renderConversationThreads = () => {
    const threadIds = getConversationThreads();

    if (threadIds.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {searchQuery ? "검색 결과가 없습니다." : "대화 내역이 없습니다."}
        </div>
      );
    }

    return threadIds.map((threadId) => {
      // 대화 스레드의 최상위 메시지
      const rootMessage = opinions.find((op) => op.id === threadId);
      if (!rootMessage) return null;

      // 이 스레드의 모든 메시지 (최상위 메시지의 ID가 root_id인 메시지들)
      const threadMessages = opinions.filter(
        (op) =>
          op.id === threadId ||
          op.parent_id === threadId ||
          (op.parent_id &&
            opinions.find((parent) => parent.id === op.parent_id)?.parent_id === threadId)
      );

      // 가장 최근 메시지
      const latestMessage = threadMessages.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      )[0];

      // 읽지 않은 메시지 수
      const unreadCount = threadMessages.filter(
        (op) => op.receiver_id === user.id && !op.is_read
      ).length;

      // 상대방 정보
      const otherParty =
        rootMessage.created_by === user.id ? rootMessage.receiver : rootMessage.created_by_user;

      // 현재 선택된 대화인지 확인
      const isSelected =
        selectedOpinion &&
        (selectedOpinion.id === threadId ||
          selectedOpinion.parent_id === threadId ||
          (selectedOpinion.parent_id &&
            opinions.find((parent) => parent.id === selectedOpinion.parent_id)?.parent_id ===
              threadId));

      return (
        <div
          key={threadId}
          className={`p-4 rounded-lg border transition-colors cursor-pointer ${
            isSelected
              ? "bg-blue-50 border-blue-300 dark:bg-blue-900/20 dark:border-blue-500/70"
              : "hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700"
          }`}
          onClick={() => handleSelectOpinion(latestMessage)}
        >
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              {/* 대화방 제목 (원래 메시지의 제목) */}
              <div
                className={`font-medium truncate mb-1 ${
                  isSelected
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-900 dark:text-gray-100"
                }`}
              >
                {rootMessage.title.replace(/^(Re: )+/, "")}
              </div>

              {/* 상대방 정보 */}
              <div className="text-sm text-gray-600 mb-1 flex items-center dark:text-gray-300">
                <User className="h-3 w-3 mr-1 inline" />
                {otherParty?.name || "알 수 없음"}
              </div>

              {/* 채권자/채무자 정보 */}
              <div className="text-xs mb-1 flex flex-wrap gap-1">
                <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 px-1.5 py-0.5 rounded flex items-center">
                  <span className="font-semibold mr-1">채권자:</span>
                  {rootMessage.creditor_name || "정보 없음"}
                </span>
                <span className="bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100 px-1.5 py-0.5 rounded flex items-center">
                  <span className="font-semibold mr-1">채무자:</span>
                  {rootMessage.debtor_name || "정보 없음"}
                </span>
              </div>

              {/* 최근 메시지 미리보기 */}
              <div className="text-xs text-gray-500 truncate dark:text-gray-400">
                {latestMessage.message?.split("\n")[0]}
              </div>

              {/* 날짜 정보 */}
              <div className="text-xs text-gray-500 mt-1 flex items-center dark:text-gray-400">
                <Clock className="h-3 w-3 mr-1 inline" />
                {format(new Date(latestMessage.created_at), "yy. M. d HH:mm", {
                  locale: ko,
                })}
              </div>
            </div>

            {/* 읽지 않은 메시지 표시 */}
            {unreadCount > 0 && (
              <div className="flex-shrink-0 bg-blue-500 text-white dark:bg-blue-600 dark:text-white text-xs font-medium py-0.5 px-2 rounded-full">
                {unreadCount}
              </div>
            )}
          </div>
        </div>
      );
    });
  };

  // 로딩 스켈레톤 렌더링
  const renderSkeletons = () => {
    return Array.from({ length: 5 }).map((_, index) => (
      <div key={index} className="p-3 border rounded-lg dark:border-gray-700 animate-pulse">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1">
            <div className="h-5 w-4/5 mb-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 w-3/5 mb-1 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-3 w-2/5 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="h-4 w-4 rounded-full bg-gray-200 dark:bg-gray-700"></div>
        </div>
      </div>
    ));
  };

  return (
    <div className="md:col-span-1 h-[calc(100vh-180px)] flex flex-col bg-white border rounded-lg shadow overflow-hidden dark:bg-gray-800 dark:border-gray-700">
      {/* 헤더 */}
      <div className="p-4 border-b space-y-4 dark:border-gray-700">
        <div className="flex items-center gap-2 justify-between">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">대화 목록</h3>
          <button
            onClick={fetchOpinions}
            disabled={refreshing}
            className="p-2 rounded-md border bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <input
            type="text"
            placeholder="검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-8 py-2 border rounded-md dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
            >
              <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* 메시지 목록 */}
      <div
        className="flex-1 px-4 pb-4 overflow-y-auto"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#4b5563 transparent" }}
      >
        <div className="space-y-3 mt-3">
          {loading ? renderSkeletons() : renderConversationThreads()}
        </div>
      </div>
    </div>
  );
}
