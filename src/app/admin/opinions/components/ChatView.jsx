import React, { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  MessageSquare,
  Send,
  Check,
  CheckCheck,
  Trash2,
  MoreHorizontal,
  RefreshCw,
} from "lucide-react";

export function ChatView({
  selectedOpinion,
  opinions,
  user,
  replyMessage,
  setReplyMessage,
  sendingReply,
  handleSendReply,
  setSelectedOpinions,
  setShowDeleteConfirm,
  replyInputRef,
}) {
  const scrollEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [prevSelectedId, setPrevSelectedId] = useState(null);
  const [prevOpinionsLength, setPrevOpinionsLength] = useState(0);
  const [lastSentTime, setLastSentTime] = useState(0);
  const [cooldownActive, setCooldownActive] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // 쿨다운 타이머
  useEffect(() => {
    let timer = null;
    if (cooldownActive && cooldownSeconds > 0) {
      timer = setTimeout(() => {
        setCooldownSeconds((prev) => prev - 1);
      }, 1000);
    } else if (cooldownSeconds === 0) {
      setCooldownActive(false);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [cooldownActive, cooldownSeconds]);

  // 사용자 스크롤 감지
  const handleScroll = () => {
    if (!chatContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    // 스크롤이 맨 아래에서 100px 이상 올라갔을 때 사용자가 스크롤 중이라고 판단
    setIsUserScrolling(scrollHeight - scrollTop - clientHeight > 100);
  };

  // 처음 메시지 선택 시 또는 대화가 변경되었을 때만 스크롤 아래로 이동
  useEffect(() => {
    // 대화방이 변경된 경우에만 스크롤 초기화
    if (selectedOpinion && selectedOpinion.id !== prevSelectedId) {
      setPrevSelectedId(selectedOpinion.id);
      // 약간의 지연 후 스크롤 이동 (렌더링 완료 후)
      setTimeout(() => {
        if (scrollEndRef.current) {
          scrollEndRef.current.scrollIntoView({ behavior: "auto" });
        }
        setIsUserScrolling(false);
      }, 100);
    }
  }, [selectedOpinion, prevSelectedId]);

  // 새 메시지가 추가된 경우만 스크롤 아래로 이동
  useEffect(() => {
    if (!opinions || !selectedOpinion) return;

    const currentMessages = getConversationMessages();

    // 새 메시지가 추가되었고, 사용자가 스크롤을 올리지 않은 상태일 때만 스크롤 이동
    if (currentMessages.length > prevOpinionsLength && !isUserScrolling) {
      setTimeout(() => {
        if (scrollEndRef.current) {
          scrollEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }

    setPrevOpinionsLength(currentMessages.length);
  }, [opinions, isUserScrolling]);

  // 메시지 전송 후 스크롤 아래로 이동
  useEffect(() => {
    if (replyMessage === "") {
      // 메시지가 전송된 후 (입력창이 비워진 후)
      setTimeout(() => {
        if (scrollEndRef.current) {
          scrollEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
        setIsUserScrolling(false);
      }, 100);
    }
  }, [replyMessage]);

  // 쓰로틀링된 메시지 전송 함수
  const throttledSendReply = () => {
    if (!replyMessage.trim() || sendingReply || cooldownActive) return;

    const now = Date.now();
    const timeSinceLastSent = now - lastSentTime;

    // 메시지 전송 사이에 최소 1초 간격을 강제
    if (timeSinceLastSent < 1000) {
      // 쿨다운 시간 설정 (1초)
      setCooldownActive(true);
      setCooldownSeconds(1);
      return;
    }

    // 메시지 전송
    setLastSentTime(now);
    handleSendReply();

    // 전송 후 쿨다운 설정 (1초)
    setCooldownActive(true);
    setCooldownSeconds(1);
  };

  // 키보드 이벤트 처리 - Enter 키로 메시지 전송 (Shift+Enter는 줄바꿈)
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      throttledSendReply();
    }
  };

  // 현재 대화에 속한 모든 메시지 찾기
  const getConversationMessages = () => {
    if (!selectedOpinion) return [];

    // 최상위 메시지 ID 찾기
    let rootId = selectedOpinion.id;
    if (selectedOpinion.parent_id) {
      const parent = opinions.find((op) => op.id === selectedOpinion.parent_id);
      rootId = parent?.parent_id || parent?.id || selectedOpinion.id;
    }

    // 현재 대화에 속한 모든 메시지
    return opinions
      .filter(
        (op) =>
          op.id === rootId ||
          op.parent_id === rootId ||
          (op.parent_id && opinions.find((p) => p.id === op.parent_id)?.parent_id === rootId)
      )
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  };

  // 날짜별로 메시지 그룹화
  const groupMessagesByDate = (messages) => {
    return messages.reduce((acc, message) => {
      const date = new Date(message.created_at).toDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(message);
      return acc;
    }, {});
  };

  // 대화방 제목 구하기
  const getConversationTitle = () => {
    if (!selectedOpinion) return "";

    // 최상위 메시지 제목 찾기
    let title = selectedOpinion.title.replace(/^(Re: )+/, "");
    if (selectedOpinion.parent_id) {
      const parent = opinions.find((op) => op.id === selectedOpinion.parent_id);
      if (parent) {
        title = parent.title.replace(/^(Re: )+/, "");
      }
    }
    return title;
  };

  if (!selectedOpinion) {
    return (
      <div className="md:col-span-2 flex items-center justify-center h-[calc(100vh-180px)] bg-white border rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p>메시지를 선택해주세요</p>
        </div>
      </div>
    );
  }

  const conversationMessages = getConversationMessages();
  const messagesByDate = groupMessagesByDate(conversationMessages);
  const isDisabled = !replyMessage.trim() || sendingReply || cooldownActive;

  return (
    <div className="md:col-span-2 flex flex-col h-[calc(100vh-180px)] bg-white border rounded-lg shadow overflow-hidden dark:bg-gray-800 dark:border-gray-700">
      {/* 대화 헤더 */}
      <div className="p-4 border-b flex items-center justify-between dark:border-gray-700">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-lg truncate text-gray-900 dark:text-gray-100">
            {getConversationTitle()}
          </h3>

          {/* 채권자/채무자 정보 */}
          <div className="text-xs flex gap-1 mt-1">
            <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 px-1.5 py-0.5 rounded">
              <span className="font-semibold">채권자:</span>{" "}
              {selectedOpinion.creditor_name || "정보 없음"}
            </span>
            <span className="bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100 px-1.5 py-0.5 rounded">
              <span className="font-semibold">채무자:</span>{" "}
              {selectedOpinion.debtor_name || "정보 없음"}
            </span>
          </div>
        </div>

        <div className="relative">
          <button
            className="p-2 rounded-md border bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:hover:bg-gray-600"
            onClick={() => {
              setSelectedOpinions([selectedOpinion]);
              setShowDeleteConfirm(true);
            }}
          >
            <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
          </button>
        </div>
      </div>

      {/* 메시지 목록 */}
      <div
        className="flex-1 p-4 overflow-y-auto"
        ref={chatContainerRef}
        onScroll={handleScroll}
        style={{ scrollbarWidth: "thin", scrollbarColor: "#4b5563 transparent" }}
      >
        <div className="space-y-6">
          {Object.entries(messagesByDate).map(([date, messages], dateIndex) => (
            <div key={date} className="space-y-4">
              <div className="relative my-4 flex items-center">
                <div className="flex-grow border-t border-gray-200 dark:border-gray-600"></div>
                <span className="flex-shrink mx-4 text-xs text-gray-500 dark:text-gray-400">
                  {format(new Date(date), "yyyy년 M월 d일", { locale: ko })}
                </span>
                <div className="flex-grow border-t border-gray-200 dark:border-gray-600"></div>
              </div>

              {messages.map((message) => {
                const isMine = message.created_by === user.id;
                const senderName = isMine ? "나" : message.created_by_user?.name || "알 수 없음";

                return (
                  <div
                    key={message.id}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[80%] ${isMine ? "text-right" : "text-left"}`}>
                      {/* 발신자 정보 */}
                      <div
                        className={`flex items-center mb-1 text-xs text-gray-500 dark:text-gray-400 ${
                          isMine ? "justify-end" : "justify-start"
                        }`}
                      >
                        {!isMine && <span className="font-medium mr-2">{senderName}</span>}
                        <span>
                          {format(new Date(message.created_at), "HH:mm", {
                            locale: ko,
                          })}
                        </span>
                        {isMine && <span className="font-medium ml-2">{senderName}</span>}
                      </div>

                      {/* 메시지 내용 */}
                      <div
                        className={`px-4 py-2 rounded-2xl whitespace-pre-wrap text-sm ${
                          isMine
                            ? "bg-blue-500 text-white rounded-tr-none"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100 rounded-tl-none"
                        }`}
                      >
                        {message.message}
                      </div>

                      {/* 읽음 상태 표시 */}
                      {isMine && (
                        <div className="text-xs mt-1">
                          {message.is_read ? (
                            <span className="flex items-center justify-end">
                              <CheckCheck className="h-3 w-3 text-blue-500 mr-1 dark:text-blue-400" />
                              <span className="text-blue-600 dark:text-blue-400">읽음</span>
                            </span>
                          ) : (
                            <span className="flex items-center justify-end">
                              <Check className="h-3 w-3 text-gray-500 mr-1" />
                              <span className="text-gray-600 dark:text-gray-400">전송됨</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          {/* 스크롤 위치 조정을 위한 참조 */}
          <div ref={scrollEndRef} />
        </div>
      </div>

      {/* 메시지 입력 영역 */}
      <div className="p-4 border-t dark:border-gray-700">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="메시지를 입력하세요..."
              className="w-full min-h-[60px] p-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              ref={replyInputRef}
              disabled={sendingReply}
            />
          </div>
          <button
            onClick={throttledSendReply}
            disabled={isDisabled}
            className={`p-2 rounded-md flex items-center justify-center ${
              isDisabled
                ? "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400"
                : "bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
            }`}
          >
            {sendingReply ? (
              <RefreshCw className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* 쿨다운 상태 표시 */}
        {cooldownActive && (
          <div className="mt-1 text-xs text-blue-600 dark:text-blue-400 text-right">
            메시지를 너무 빠르게 보내고 있습니다. {cooldownSeconds}초 후에 다시 시도해주세요.
          </div>
        )}
      </div>
    </div>
  );
}
