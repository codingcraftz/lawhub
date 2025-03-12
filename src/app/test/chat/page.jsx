'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/utils/supabase';

// UUID 대체 함수 - 간단한 임의 ID 생성
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('');
  const [conversationId, setConversationId] = useState('');
  const messagesEndRef = useRef(null);

  // 사용자 ID 생성 또는 가져오기
  useEffect(() => {
    const storedUserId = localStorage.getItem('chat_user_id');
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      const newUserId = generateId();
      localStorage.setItem('chat_user_id', newUserId);
      setUserId(newUserId);
    }

    // 최근 대화 ID 가져오기
    const storedConvId = localStorage.getItem('current_conversation_id');
    if (storedConvId) {
      setConversationId(storedConvId);
      loadConversation(storedConvId);
    }
  }, []);

  // 메시지 스크롤 처리
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 대화 기록 로드
  const loadConversation = async (convId) => {
    try {
      const { data, error } = await supabase
        .from('rag_messages') // chat_messages 대신 rag_messages 사용
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const formattedMessages = data.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
        }));

        setMessages(formattedMessages);
      }
    } catch (err) {
      console.error('대화 기록 로딩 오류:', err);
    }
  };

  // 메시지 전송 처리
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!input.trim() || loading) return;

    const userMessage = {
      id: generateId(),
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          userId,
          conversationId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '응답 오류');
      }

      // 새 대화 ID 저장
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
        localStorage.setItem('current_conversation_id', data.conversationId);
      }

      // 응답 메시지 추가
      const assistantMessage = {
        id: generateId(),
        role: 'assistant',
        content: data.response,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('메시지 전송 오류:', err);
      alert('메시지 전송 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 새 대화 시작
  const startNewConversation = () => {
    setMessages([]);
    setConversationId('');
    localStorage.removeItem('current_conversation_id');
  };

  return (
    <div className='container mx-auto max-w-4xl p-4'>
      <h1 className='text-2xl font-bold mb-6 text-center'>법률 조언 AI 챗봇 (RAG 기능 지원)</h1>

      <div className='flex justify-end mb-4'>
        <button onClick={startNewConversation} className='bg-gray-400 hover:bg-gray-500 px-4 py-2 rounded-lg'>
          새 대화 시작
        </button>
      </div>

      <div className='bg-gray-3 rounded-lg shadow-md border p-4 h-[60vh] overflow-y-auto'>
        {messages.length === 0 ? (
          <div className='text-center text-gray-500 mt-20'>
            <p>안녕하세요! 법률 조언이 필요하신가요?</p>
            <p className='text-sm mt-2'>질문을 입력해주세요. 관련된 과거 대화 내용도 함께 참고합니다.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
              <div
                className={`inline-block p-3 rounded-lg max-w-[80%] ${
                  msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-500'
                }`}
              >
                <p className='whitespace-pre-wrap'>{msg.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className='mt-4'>
        <div className='flex'>
          <input
            type='text'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='질문을 입력하세요...'
            className='flex-1 p-3 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
            disabled={loading}
          />
          <button
            type='submit'
            className='bg-blue-500 hover:bg-blue-600 text-white px-4 rounded-r-lg disabled:bg-blue-300'
            disabled={loading}
          >
            {loading ? '처리 중...' : '전송'}
          </button>
        </div>
      </form>
    </div>
  );
}
