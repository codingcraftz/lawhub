"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/utils/supabase"; // 이미 설정된 supabase client 가져오기
import { useUser } from "@/hooks/useUser";

// 질문 시나리오 정의
const scenarios = {
  // --- 대여금 ---
  loan: [
    { 
      id: "frequency", 
      question: "채무자에게 돈을 빌려준 횟수는 어떻게 되시나요?\n(예: 한번에 모두 빌려줬다면 '한번', 여러 차례에 걸쳐 빌려줬다면 '여러번')" 
    },
    { 
      id: "amount", 
      question: "빌려주신 총 금액이 얼마인가요?\n(숫자만 입력해 주세요. 예: 1000000)" 
    },
    { 
      id: "dueDate", 
      question: "언제까지 돈을 갚기로 했나요?\n(예: 2024-01-01 형식으로 입력해 주세요)" 
    },
  ],
  // --- 물품대금 ---
  goods: [
    { 
      id: "frequency", 
      question: "물품 거래는 몇 번에 걸쳐 이루어졌나요?\n(한번에 모든 물품을 거래했다면 '한번', 여러 차례에 걸쳐 거래했다면 '여러번')" 
    },
    { 
      id: "itemName", 
      question: "어떤 물품을 거래하셨나요?\n(예: 건축자재, 가구, 전자제품 등 구체적으로 적어주세요)" 
    },
    { 
      id: "amount", 
      question: "물품 대금은 총 얼마인가요?\n(부가가치세 제외한 금액을 숫자만 입력해 주세요. 예: 1000000)" 
    },
    { 
      id: "dueDate", 
      question: "대금 지급 약속일이 언제인가요?\n(예: 2024-01-01 형식으로 입력해 주세요)" 
    },
  ],
  // --- 공사대금 ---
  construction: [
    { 
      id: "period", 
      question: "공사 기간은 언제부터 언제까지였나요?\n(예: 2024-01-01~2024-02-01 형식으로 입력해 주세요)" 
    },
    { 
      id: "location", 
      question: "공사 현장은 어디인가요?\n(시군구까지만 입력해 주세요. 예: 서울시 강남구)" 
    },
    { 
      id: "amount", 
      question: "공사 대금은 총 얼마인가요?\n(부가가치세 제외한 금액을 숫자만 입력해 주세요. 예: 1000000)" 
    },
    { 
      id: "dueDate", 
      question: "대금 지급 약속일이 언제인가요?\n(예: 2024-01-01 형식으로 입력해 주세요)" 
    },
  ],
};

export default function Chatbot() {
  const { user } = useUser();
  // 챗봇에 표시할 메시지들을 저장
  const [messages, setMessages] = useState([
    { 
      sender: "bot", 
      text: "안녕하세요. LawHub 법률상담 챗봇입니다.\n먼저 의뢰하실 사건의 종류를 선택해 주세요." 
    },
  ]);
  // 현재 시나리오(loan, goods, construction 등)
  const [caseType, setCaseType] = useState(null);
  // 현재 질문 인덱스
  const [questionIndex, setQuestionIndex] = useState(0);
  // 사용자가 입력한 답변들을 임시 저장하는 객체
  const [answers, setAnswers] = useState({});

  // 채팅 스크롤 자동 이동용 ref
  const chatContainerRef = useRef(null);

  // 새 메시지가 추가될 때마다 스크롤 맨 아래로 이동
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // caseType 선택 후 시나리오에 따라 첫 질문을 표시
  useEffect(() => {
    if (caseType) {
      // 첫 질문 추가
      const firstQuestion = scenarios[caseType][0].question;
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: firstQuestion },
      ]);
    }
    // questionIndex를 0으로 초기화
    setQuestionIndex(0);
    setAnswers({});
  }, [caseType]);

  // 사용자 입력 처리
  const handleUserInput = async (inputText) => {
    // 1) 사용자의 답변 메시지 추가
    setMessages((prev) => [
      ...prev,
      { sender: "user", text: inputText },
    ]);

    // 2) 현재 질문에 해당하는 key에 값 저장
    const currentScenario = scenarios[caseType];
    const currentQuestionId = currentScenario[questionIndex].id;

    // answers state 업데이트
    setAnswers((prev) => ({
      ...prev,
      [currentQuestionId]: inputText,
    }));

    // 3) 다음 질문이 있는지 확인
    const nextIndex = questionIndex + 1;
    if (nextIndex < currentScenario.length) {
      // 다음 질문 텍스트
      const nextQuestion = currentScenario[nextIndex].question;
      setTimeout(() => {
        // 봇의 다음 질문 추가
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: nextQuestion },
        ]);
      }, 600); // 약간의 딜레이 (0.6초) 후 메시지 표시
      setQuestionIndex(nextIndex);
    } else {
      // 더 이상 질문이 없으면 Supabase에 저장
      setTimeout(() => {
        handleSubmitAnswers();
      }, 600);
    }
  };

  // 최종적으로 Supabase에 저장
  const handleSubmitAnswers = async () => {
    if (!user) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "로그인이 필요한 서비스입니다. 로그인 후 다시 시도해주세요.",
        },
      ]);
      return;
    }

    let payload = {
      case_type: "",
      frequency: "",
      extra_info: "",
      amount: null,
      start_date: null,
      end_date: null,
      user_id: user.id
    };

    if (caseType === "loan") {
      // 대여금
      payload = {
        ...payload,
        case_type: "대여금",
        frequency: answers.frequency,
        amount: parseFloat(answers.amount),
        end_date: answers.dueDate ? new Date(answers.dueDate) : null
      };
    } else if (caseType === "goods") {
      // 물품대금
      payload = {
        ...payload,
        case_type: "물품대금",
        frequency: answers.frequency,
        extra_info: answers.itemName,
        amount: parseFloat(answers.amount),
        end_date: answers.dueDate ? new Date(answers.dueDate) : null
      };
    } else if (caseType === "construction") {
      // 공사대금
      const [startDate, endDate] = answers.period?.split("~").map(d => d.trim()) || [null, null];
      payload = {
        ...payload,
        case_type: "공사대금",
        frequency: "기간",
        extra_info: answers.location,
        amount: parseFloat(answers.amount),
        start_date: startDate ? new Date(startDate) : null,
        end_date: answers.dueDate ? new Date(answers.dueDate) : null
      };
    }

    // Supabase Insert
    try {
      const { data, error } = await supabase
        .from("chatbot_cases")
        .insert([payload]);

      if (error) {
        console.error("Supabase Insert Error:", error);
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: "데이터 저장 중 오류가 발생했습니다. 다시 시도해주세요.",
          },
        ]);
      } else {
        // 성공 메시지
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: "답변 감사합니다. 접수가 완료되었습니다.",
          },
        ]);
      }
    } catch (err) {
      console.error("Unexpected Error:", err);
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "서버 오류가 발생했습니다. 다시 시도해주세요.",
        },
      ]);
    }
  };

  // 사용자가 입력폼(또는 버튼)으로 답변 보내기
  const [userInput, setUserInput] = useState("");

  const handleSendMessage = () => {
    if (!userInput.trim()) return;
    handleUserInput(userInput.trim());
    setUserInput("");
  };

  return (
    <div className="w-full max-w-2xl mx-auto h-[calc(100vh-6rem)] flex flex-col bg-gray-2 border border-gray-6 rounded-lg overflow-hidden">
      {/* 헤더 */}
      <div className="p-4 bg-gray-3 border-b border-gray-6">
        <h1 className="text-lg font-semibold text-gray-12">법률상담 챗봇</h1>
        <p className="text-sm text-gray-11">상황에 맞는 답변을 입력해 주시면 법률 상담을 도와드립니다.</p>
      </div>

      {/* 채팅 메세지 목록 */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        <AnimatePresence>
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${msg.sender === "bot" ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  msg.sender === "bot" 
                    ? "bg-gray-3 text-gray-12 rounded-tl-none" 
                    : "bg-blue-9 text-gray-1 rounded-tr-none"
                }`}
              >
                <pre className="whitespace-pre-wrap font-sans">{msg.text}</pre>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 사건 유형 선택 버튼 */}
      {!caseType && (
        <div className="p-4 bg-gray-2 border-t border-gray-6">
          <div className="grid grid-cols-3 gap-3">
            <button
              className="p-4 bg-gray-3 hover:bg-gray-4 active:bg-gray-5 text-gray-12 rounded-lg border border-gray-6 transition-colors"
              onClick={() => setCaseType("loan")}
            >
              <span className="block text-lg mb-1">💰</span>
              대여금
            </button>
            <button
              className="p-4 bg-gray-3 hover:bg-gray-4 active:bg-gray-5 text-gray-12 rounded-lg border border-gray-6 transition-colors"
              onClick={() => setCaseType("goods")}
            >
              <span className="block text-lg mb-1">📦</span>
              물품대금
            </button>
            <button
              className="p-4 bg-gray-3 hover:bg-gray-4 active:bg-gray-5 text-gray-12 rounded-lg border border-gray-6 transition-colors"
              onClick={() => setCaseType("construction")}
            >
              <span className="block text-lg mb-1">🏗️</span>
              공사대금
            </button>
          </div>
        </div>
      )}

      {/* 메시지 입력 영역 */}
      {caseType && (
        <div className="p-4 bg-gray-2 border-t border-gray-6">
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 px-4 py-2 bg-gray-3 text-gray-12 placeholder-gray-11 rounded-lg border border-gray-6 focus:outline-none focus:ring-2 focus:ring-blue-8"
              placeholder="답변을 입력해 주세요..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendMessage();
              }}
            />
            <button
              className="px-4 py-2 bg-blue-9 hover:bg-blue-10 text-gray-1 rounded-lg transition-colors"
              onClick={handleSendMessage}
            >
              전송
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
