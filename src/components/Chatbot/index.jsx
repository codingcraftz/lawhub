'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/utils/supabase';
import { useUser } from '@/hooks/useUser';
import DatePicker from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { Button, Box } from '@radix-ui/themes';
import { PlusIcon } from '@radix-ui/react-icons';
import TransactionsModal from './TransactionsModal';

// DatePicker 스타일 오버라이드를 위한 스타일 추가
const datePickerStyles = `
  .react-datepicker-popper {
    z-index: 9999 !important;
  }
  .react-datepicker-wrapper {
    width: 100%;
  }
  .react-datepicker__input-container {
    width: 100%;
  }
`;

// 질문 유형 정의
const QUESTION_TYPES = {
  TEXT: 'text',
  DATE: 'date',
  DATE_RANGE: 'date_range',
  NUMBER: 'number',
  TRANSACTIONS_TABLE: 'TRANSACTIONS_TABLE',
};

// 질문 시나리오 정의 (예시)
const scenarios = {
  loan: [
    {
      id: 'transactions',
      type: QUESTION_TYPES.TRANSACTIONS_TABLE,
      question:
        '대여금 거래 내역을 입력해 주세요.\n각 거래별로 거래일, 금액(부가가치세 제외), 변제약정일을 입력해 주세요.',
    },
    {
      id: 'confirm',
      type: QUESTION_TYPES.TEXT,
      question: '입력하신 내용이 맞나요? (예/아니오)',
    },
  ],
  goods: [
    {
      id: 'itemName',
      type: QUESTION_TYPES.TEXT,
      question: '어떤 물품을 거래하셨나요? (예: 건축자재, 가구 등)',
    },
    {
      id: 'transactions',
      type: QUESTION_TYPES.TRANSACTIONS_TABLE,
      question:
        '물품 거래 내역을 입력해 주세요.\n각 거래별로 거래일, 금액(부가가치세 제외), 지급약정일을 입력해 주세요.',
    },
    {
      id: 'confirm',
      type: QUESTION_TYPES.TEXT,
      question: '입력하신 내용이 맞나요? (예/아니오)',
    },
  ],
  construction: [
    {
      id: 'location',
      type: QUESTION_TYPES.TEXT,
      question: '공사 현장은 어디인가요? (예: 서울시 강남구)',
    },
    {
      id: 'transactions',
      type: QUESTION_TYPES.TRANSACTIONS_TABLE,
      question:
        '공사 기간과 대금을 입력해 주세요.\n각 공사별로 시작일, 종료일, 금액(부가가치세 제외), 지급약정일을 입력해 주세요.',
    },
    {
      id: 'confirm',
      type: QUESTION_TYPES.TEXT,
      question: '입력하신 내용이 맞나요? (예/아니오)',
    },
  ],
};

export default function Chatbot() {
  const { user } = useUser();
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: '안녕하세요. LawHub 법률상담 챗봇입니다.\n먼저 의뢰하실 사건의 종류를 선택해 주세요.',
    },
  ]);
  const [caseType, setCaseType] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [userInput, setUserInput] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false); // 제출 완료 상태

  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (caseType) {
      const firstQuestion = scenarios[caseType][0].question;
      setMessages((prev) => [...prev, { sender: 'bot', text: firstQuestion }]);
      setQuestionIndex(0);
      setAnswers({});
      setTransactions([]);
      setIsSubmitted(false); // 새로운 의뢰 시작 시 제출 상태 초기화
    }
  }, [caseType]);

  // TRANSACTIONS_TABLE 단계일 때 자동으로 모달 열기
  useEffect(() => {
    if (getCurrentQuestionType() === QUESTION_TYPES.TRANSACTIONS_TABLE && !isModalOpen) {
      setIsModalOpen(true);
    }
  }, [questionIndex, caseType, isModalOpen]);

  const getCurrentQuestionType = () => {
    if (!caseType || !scenarios[caseType][questionIndex]) return null;
    return scenarios[caseType][questionIndex].type;
  };

  const handleGoBack = () => {
    if (questionIndex <= 0) {
      setCaseType(null);
      setMessages([
        {
          sender: 'bot',
          text: '안녕하세요. LawHub 법률상담 챗봇입니다.\n먼저 의뢰하실 사건의 종류를 선택해 주세요.',
        },
      ]);
      return;
    }
    setQuestionIndex(questionIndex - 1);
    setMessages((prev) => {
      if (prev.length <= 1) return prev;
      return prev.slice(0, -2);
    });
  };

  const handleUserInput = async (inputText) => {
    if (getCurrentQuestionType() === QUESTION_TYPES.TRANSACTIONS_TABLE) {
      if (transactions.length === 0) {
        alert('최소 하나의 거래 내역을 입력해주세요.');
        return;
      }
      setAnswers((prev) => ({ ...prev, transactions }));
      const nextQuestion = scenarios[caseType][questionIndex + 1].question;
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: '거래 내역이 입력되었습니다.',
          component: (
            <Box className='text-gray-12'>
              거래 내역 총 {transactions.length}건, 총 금액:{' '}
              {transactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}원
            </Box>
          ),
        },
        {
          sender: 'bot',
          text: nextQuestion,
          showConfirmButtons: true,
        },
      ]);
      setQuestionIndex(questionIndex + 1);
      return;
    }

    if (inputText === '예') {
      handleSubmitAnswers();
      return;
    }
    if (inputText === '아니오') {
      handleGoBack();
      return;
    }

    setMessages((prev) => [...prev, { sender: 'user', text: inputText }]);
    const currentScenario = scenarios[caseType];
    const currentQuestionId = currentScenario[questionIndex].id;
    setAnswers((prev) => ({ ...prev, [currentQuestionId]: inputText }));
    const nextIndex = questionIndex + 1;
    if (nextIndex < currentScenario.length) {
      setTimeout(() => {
        setMessages((prev) => [...prev, { sender: 'bot', text: currentScenario[nextIndex].question }]);
      }, 500);
      setQuestionIndex(nextIndex);
    } else {
      setTimeout(() => {
        handleSubmitAnswers();
      }, 500);
    }
  };

  const handleSubmitAnswers = async (mode = 'submit') => {
    if (!user) {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: '로그인이 필요한 서비스입니다. 로그인 후 다시 시도해주세요.' },
      ]);
      return;
    }

    // 사건 기본 정보 구성
    const casePayload = {
      case_type: caseType === 'loan' ? '대여금' : caseType === 'goods' ? '물품대금' : '공사대금',
      extra_info: caseType === 'goods' ? answers.itemName : caseType === 'construction' ? answers.location : null,
      user_id: user.id,
      status: mode === 'temp' ? '임시저장' : '접수신청',
    };

    try {
      // 1️⃣ 사건 저장 (cases 테이블)
      const { data: caseData, error: caseError } = await supabase
        .from('chatbot_cases')
        .insert([casePayload])
        .select()
        .single();

      if (caseError) throw caseError;

      // 2️⃣ 거래 내역 개별 저장 (transactions 테이블)
      if (transactions.length > 0) {
        for (const transaction of transactions) {
          const { data: existingTransaction } = await supabase
            .from('transactions')
            .select('id')
            .eq('case_id', caseData.id)
            .eq('transaction_date', transaction.transactionDate || null)
            .maybeSingle();

          if (!existingTransaction) {
            const { error: transactionError } = await supabase.from('transactions').insert([
              {
                case_id: caseData.id,
                transaction_date: transaction.transactionDate || null,
                start_date: transaction.startDate || null,
                end_date: transaction.endDate || null,
                amount: transaction.amount,
                due_date: transaction.dueDate || null,
              },
            ]);

            if (transactionError) throw transactionError;
          }
        }
      }

      // 3️⃣ 청구취지 생성
      const claimText = generateClaimText(transactions);

      // 4️⃣ 청구취지 확인 메시지 표시
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: '다음과 같은 내용으로 청구하면 되겠습니까?\n\n' + claimText,
          component: (
            <div className='flex gap-2 mt-3'>
              <Button
                onClick={() => handleConfirmClaim(caseData.id, claimText)}
                className='flex-1'
                variant='soft'
                color='green'
              >
                예
              </Button>
              <Button onClick={() => handleEditClaim(caseData.id)} className='flex-1' variant='soft' color='blue'>
                수정하기
              </Button>
            </div>
          ),
        },
      ]);
      setIsSubmitted(true);
    } catch (err) {
      console.error('Error:', err);
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: '데이터 저장 중 오류가 발생했습니다. 다시 시도해주세요.' },
      ]);
    }
  };

  // 청구취지 생성 함수
  const generateClaimText = (transactions) => {
    if (!transactions || transactions.length === 0) return '';

    // 지급예정일 기준으로 정렬
    const sortedTransactions = [...transactions].sort((a, b) => {
      const dateA = new Date(a.dueDate || '');
      const dateB = new Date(b.dueDate || '');
      return dateA - dateB;
    });

    const totalAmount = sortedTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    if (sortedTransactions.length === 1) {
      const transaction = sortedTransactions[0];
      return `1. 피고는 원고에게 ${Number(totalAmount).toLocaleString()}원 및 이에 대하여 ${formatDate(
        transaction.dueDate
      )}부터 이 사건 소장 부본 송달일까지는 연 6%의, 그 다음날부터 다 갚는 날까지는 연 12%의 비율에 의한 돈을 지급하라.`;
    }

    const koreanPrefix = ['가', '나', '다', '라', '마', '바', '사', '아', '자', '차', '카', '타', '파', '하'];
    let text = `1. 피고는 원고에게 ${Number(totalAmount).toLocaleString()}원 및 이 중\n`;

    sortedTransactions.forEach((transaction, index) => {
      const prefix = koreanPrefix[index] + '.';
      text += ` ${prefix} ${Number(transaction.amount).toLocaleString()}원에 대하여는 ${formatDate(
        transaction.dueDate
      )}부터,\n`;
    });

    text +=
      '이 사건 소장 부본 송달일까지는 연 6%의, 그 다음날부터 다 갚는 날까지는 연 12%의 각 비율에 의한 각 돈을 지급하라.';

    return text;
  };

  // 청구취지 확인 처리 함수
  const handleConfirmClaim = async (caseId, claimText) => {
    const { error } = await supabase
      .from('chatbot_cases')
      .update({
        claim_text: claimText,
        claim_confirmed: true,
      })
      .eq('id', caseId);

    if (error) {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: '청구취지 저장 중 오류가 발생했습니다. 다시 시도해주세요.' },
      ]);
      return;
    }

    setMessages((prev) => [
      ...prev,
      { sender: 'bot', text: '청구취지가 저장되었습니다. 추가로 의뢰하실 사건이 있으신가요?' },
    ]);
  };

  // 청구취지 수정 처리 함수
  const handleEditClaim = (caseId) => {
    setMessages((prev) => [
      ...prev,
      {
        sender: 'bot',
        text: '청구취지를 수정하시려면 거래 내역을 다시 입력해주세요.',
        component: (
          <Button
            onClick={() => {
              setIsModalOpen(true);
              setQuestionIndex(questionIndex - 1);
            }}
            variant='soft'
            color='blue'
            className='mt-3'
          >
            거래 내역 수정하기
          </Button>
        ),
      },
    ]);
  };

  // 날짜 포맷 함수
  const formatDate = (dateString) => {
    if (!dateString) return '미등록';
    const date = new Date(dateString);

    if (date.getFullYear() === 1970 && date.getMonth() === 0 && date.getDate() === 1) {
      return '미등록';
    }

    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const resetConversation = () => {
    setCaseType(null);
    setMessages([
      {
        sender: 'bot',
        text: '안녕하세요. LawHub 법률상담 챗봇입니다.\n먼저 의뢰하실 사건의 종류를 선택해 주세요.',
      },
    ]);
    setQuestionIndex(0);
    setAnswers({});
    setTransactions([]);
    setIsSubmitted(false);
  };

  const handleSendMessage = () => {
    if (!userInput.trim()) return;
    handleUserInput(userInput.trim());
    setUserInput('');
  };

  // 입력 UI: 제출 완료 시 추가 의뢰하기 버튼 렌더링
  const renderInput = () => {
    if (isSubmitted) {
      return (
        <div className='p-4'>
          <Button onClick={resetConversation} className='w-full'>
            추가 의뢰하기
          </Button>
        </div>
      );
    }

    const questionType = getCurrentQuestionType();
    if (!questionType) return null;
    if (questionType === QUESTION_TYPES.TRANSACTIONS_TABLE) {
      return null;
    }
    if (questionType === QUESTION_TYPES.DATE) {
      return (
        <div className='p-4'>
          <DatePicker
            selected={null}
            onChange={(date) => {
              const formattedDate = date.toISOString().split('T')[0];
              handleUserInput(formattedDate);
            }}
            dateFormat='yyyy-MM-dd'
            locale={ko}
            placeholderText='날짜를 선택하세요'
          />
        </div>
      );
    }
    if (questionType === QUESTION_TYPES.DATE_RANGE) {
      return (
        <div className='p-4 flex gap-2'>
          <input type='date' className='w-full px-4 py-2 border' placeholder='시작일' />
          <input type='date' className='w-full px-4 py-2 border' placeholder='종료일' />
          <Button>전송</Button>
        </div>
      );
    }
    if (questionType === QUESTION_TYPES.NUMBER) {
      return (
        <div className='p-4 flex gap-2'>
          <input
            type='number'
            className='flex-1 px-4 py-2 border'
            placeholder='숫자를 입력해 주세요...'
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
          />
          <Button onClick={handleSendMessage}>전송</Button>
          <Button onClick={() => handleSubmitAnswers('temp')}>임시저장</Button>
        </div>
      );
    }
    return (
      <div className='p-4 flex gap-2 items-center'>
        <input
          type='text'
          className='flex-1 px-4 py-2 border'
          placeholder='답변을 입력해 주세요...'
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSendMessage();
          }}
        />
        <Button onClick={handleSendMessage}>전송</Button>
        <Button onClick={() => handleSubmitAnswers('temp')}>임시저장</Button>
      </div>
    );
  };

  return (
    <>
      <style>{datePickerStyles}</style>
      <div className='w-full max-w-2xl mx-auto h-[calc(100vh-6rem)] flex flex-col bg-gray-2 border border-gray-6 rounded-lg overflow-hidden'>
        {/* 헤더 */}
        <div className='p-4 bg-gray-3 border-b border-gray-6'>
          <h1 className='text-lg font-semibold text-gray-12'>법률상담 챗봇</h1>
          <p className='text-sm text-gray-11'>상황에 맞는 답변을 입력해 주시면 법률 상담을 도와드립니다.</p>
        </div>
        {/* 채팅 메시지 영역 */}
        <div ref={chatContainerRef} className='flex-1 overflow-y-auto p-4 space-y-4'>
          <AnimatePresence>
            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${msg.sender === 'bot' ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.sender === 'bot'
                      ? 'bg-gray-3 text-gray-12 rounded-tl-none'
                      : 'bg-blue-9 text-gray-1 rounded-tr-none'
                  }`}
                >
                  <pre className='whitespace-pre-wrap font-sans'>{msg.text}</pre>
                  {msg.component}
                  {!isSubmitted && msg.showConfirmButtons && (
                    <div className='flex gap-2 mt-3'>
                      <Button onClick={() => handleUserInput('예')} className='flex-1' variant='soft' color='green'>
                        예
                      </Button>
                      <Button onClick={() => handleUserInput('아니오')} className='flex-1' variant='soft' color='red'>
                        아니오
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        {/* 사건 유형 선택 */}
        {!caseType && (
          <div className='p-4 bg-gray-2 border-t border-gray-6'>
            <div className='grid grid-cols-3 gap-3'>
              <button
                className='p-4 bg-gray-3 hover:bg-gray-4 active:bg-gray-5 text-gray-12 rounded-lg border border-gray-6 transition-colors'
                onClick={() => setCaseType('loan')}
              >
                <span className='block text-lg mb-1'>💰</span>
                대여금
              </button>
              <button
                className='p-4 bg-gray-3 hover:bg-gray-4 active:bg-gray-5 text-gray-12 rounded-lg border border-gray-6 transition-colors'
                onClick={() => setCaseType('goods')}
              >
                <span className='block text-lg mb-1'>📦</span>
                물품대금
              </button>
              <button
                className='p-4 bg-gray-3 hover:bg-gray-4 active:bg-gray-5 text-gray-12 rounded-lg border border-gray-6 transition-colors'
                onClick={() => setCaseType('construction')}
              >
                <span className='block text-lg mb-1'>🏗️</span>
                공사대금
              </button>
            </div>
          </div>
        )}
        {renderInput()}
        <div className='px-4 pb-4'>
          <Button variant='soft' color='gray' onClick={handleGoBack} className='w-full'>
            이전으로 돌아가기
          </Button>
        </div>
      </div>
      {/* 거래 내역 입력 모달 (자동 노출) */}
      {isModalOpen && (
        <TransactionsModal
          type={caseType}
          transactions={transactions}
          setTransactions={setTransactions}
          onClose={() => {
            setIsModalOpen(false);
            handleUserInput('transactions_completed');
          }}
        />
      )}
    </>
  );
}
