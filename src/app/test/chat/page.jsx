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
  const [conversationTitle, setConversationTitle] = useState('');
  const [conversations, setConversations] = useState([]);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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

  // 사용자 ID가 설정되면 대화 목록 불러오기
  useEffect(() => {
    if (userId) {
      fetchConversations();
    }
  }, [userId]);

  // 대화 목록 불러오기
  const fetchConversations = async () => {
    try {
      const response = await fetch(`/api/conversations?userId=${userId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '대화 목록을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setConversations(data.conversations || []);

      // 현재 대화의 제목 설정
      if (conversationId) {
        const currentConv = data.conversations?.find((conv) => conv.id === conversationId);
        if (currentConv) {
          setConversationTitle(currentConv.title || '제목 없는 대화');
        }
      }
    } catch (err) {
      console.error('대화 목록 로딩 오류:', err);
    }
  };

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
      // 대화 메시지 불러오기
      const { data, error } = await supabase
        .from('rag_messages')
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
      } else {
        setMessages([]);
      }

      // 대화 정보 불러오기
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('title')
        .eq('id', convId)
        .single();

      if (!convError && convData) {
        setConversationTitle(convData.title || '제목 없는 대화');
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

        // 첫 메시지를 대화 제목으로 설정
        const trimmedMessage = input.length > 30 ? input.substring(0, 27) + '...' : input;

        updateConversationTitle(data.conversationId, trimmedMessage);
        setConversationTitle(trimmedMessage);

        // 대화 목록 새로고침
        fetchConversations();
      }

      // 응답 메시지 추가
      const assistantMessage = {
        id: generateId(),
        role: 'assistant',
        content: data.response,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // 메시지가 추가될 때마다 updated_at 갱신
      if (conversationId || data.conversationId) {
        await supabase
          .from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', conversationId || data.conversationId);

        // 대화 목록 새로고침
        fetchConversations();
      }
    } catch (err) {
      console.error('메시지 전송 오류:', err);
      alert('메시지 전송 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 새 대화 시작
  const startNewConversation = async (initialTitle = '') => {
    setMessages([]);
    setInput('');

    try {
      if (!userId) return;

      // 새 대화 생성
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          title: initialTitle || '새 대화',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '새 대화를 생성하는데 실패했습니다.');
      }

      const data = await response.json();

      // 새 대화 ID 설정
      setConversationId(data.conversation.id);
      setConversationTitle(data.conversation.title);
      localStorage.setItem('current_conversation_id', data.conversation.id);

      // 대화 목록 새로고침
      fetchConversations();
    } catch (err) {
      console.error('새 대화 생성 오류:', err);

      // 오류 시 기존 대화 ID 초기화
      setConversationId('');
      setConversationTitle('');
      localStorage.removeItem('current_conversation_id');
    }
  };

  // 대화 선택
  const selectConversation = (id) => {
    setConversationId(id);
    localStorage.setItem('current_conversation_id', id);
    loadConversation(id);
  };

  // 대화 삭제
  const deleteConversation = async (id, e) => {
    e.stopPropagation(); // 클릭 이벤트 전파 방지

    if (!confirm('정말 이 대화를 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/conversations?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '대화를 삭제하는데 실패했습니다.');
      }

      // 현재 선택된 대화가 삭제된 경우 초기화
      if (id === conversationId) {
        setMessages([]);
        setConversationId('');
        setConversationTitle('');
        localStorage.removeItem('current_conversation_id');
      }

      // 대화 목록 새로고침
      fetchConversations();
    } catch (err) {
      console.error('대화 삭제 오류:', err);
      alert('대화 삭제 중 오류가 발생했습니다.');
    }
  };

  // 대화 제목 업데이트
  const updateConversationTitle = async (id, title) => {
    if (!id) return;

    try {
      const response = await fetch('/api/conversations', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: id,
          title,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '대화 제목을 업데이트하는데 실패했습니다.');
      }

      // 대화 목록 새로고침
      fetchConversations();
    } catch (err) {
      console.error('대화 제목 업데이트 오류:', err);
    }
  };

  // 대화 제목 편집 시작
  const startEditingTitle = () => {
    setNewTitle(conversationTitle);
    setIsEditingTitle(true);
  };

  // 대화 제목 편집 저장
  const saveTitle = () => {
    if (newTitle.trim() && conversationId) {
      updateConversationTitle(conversationId, newTitle.trim());
      setConversationTitle(newTitle.trim());
    }
    setIsEditingTitle(false);
  };

  // 대화 제목 편집 취소
  const cancelEditingTitle = () => {
    setIsEditingTitle(false);
  };

  // 대화 제목 입력 시 엔터키 처리
  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveTitle();
    } else if (e.key === 'Escape') {
      cancelEditingTitle();
    }
  };

  return (
    <div className='flex min-h-screen bg-gray-6'>
      {/* 사이드바 토글 버튼 (모바일용) */}
      <button
        className='md:hidden fixed top-4 left-4 z-50 bg-blue-500 text-white p-2 rounded-md'
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? '←' : '→'}
      </button>

      {/* 대화 목록 사이드바 */}
      <div
        className={`${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform md:translate-x-0 fixed md:static top-0 left-0 h-full w-64 bg-gray-3 overflow-y-auto z-40 p-4 flex flex-col`}
      >
        <h2 className='text-lg font-bold mb-4'>대화 목록</h2>

        <button
          onClick={() => startNewConversation()}
          className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg mb-4 w-full'
        >
          새 대화 시작
        </button>

        <div className='flex-1 overflow-y-auto'>
          {conversations.length === 0 ? (
            <p className='text-gray-500 text-center py-4'>대화 내역이 없습니다</p>
          ) : (
            <ul className='space-y-2'>
              {conversations.map((conv) => (
                <li
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  className={`p-2 rounded-lg cursor-pointer flex justify-between items-center hover:bg-gray-300 ${
                    conv.id === conversationId ? 'bg-blue-2 border border-blue-5' : ''
                  }`}
                >
                  <span className='line-clamp-1 flex-1'>{conv.title || '제목 없는 대화'}</span>
                  <button
                    onClick={(e) => deleteConversation(conv.id, e)}
                    className='text-red-500 hover:text-red-700 p-1'
                    title='대화 삭제'
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 메인 채팅 영역 */}
      <div className='flex-1 flex flex-col p-4 md:ml-0 ml-0'>
        <div className='container mx-auto max-w-4xl flex-1 flex flex-col'>
          {/* 대화 제목 영역 */}
          <div className='flex items-center mb-4 bg-gray-3 p-3 rounded-lg shadow'>
            <h1 className='text-xl font-bold flex-1'>
              {conversationId ? (
                isEditingTitle ? (
                  <input
                    type='text'
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onBlur={saveTitle}
                    onKeyDown={handleTitleKeyDown}
                    className='w-full p-1 border rounded'
                    autoFocus
                  />
                ) : (
                  <span
                    onClick={startEditingTitle}
                    className='cursor-pointer hover:bg-gray-100 p-1 rounded'
                    title='클릭하여 제목 변경'
                  >
                    {conversationTitle || '제목 없는 대화'}
                  </span>
                )
              ) : (
                '새 대화'
              )}
            </h1>
          </div>

          {/* 메시지 영역 */}
          <div className='bg-gray-4 rounded-lg shadow-md border p-4 flex-1 overflow-y-auto mb-4'>
            {messages.length === 0 ? (
              <div className='text-center text-gray-500 py-20'>
                <p className='text-lg mb-2'>안녕하세요! 법률 조언이 필요하신가요?</p>
                <p className='text-sm'>질문을 입력해주세요. 관련된 과거 대화 내용도 함께 참고합니다.</p>
              </div>
            ) : (
              <div className='space-y-4'>
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`inline-block p-3 rounded-lg max-w-[80%] ${
                        msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-slate-12 text-gray-800'
                      }`}
                    >
                      <p className='whitespace-pre-wrap'>{msg.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* 입력 폼 */}
          <form onSubmit={handleSendMessage} className='mb-4'>
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
                className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r-lg disabled:bg-blue-300'
                disabled={loading}
              >
                {loading ? '처리 중...' : '전송'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
