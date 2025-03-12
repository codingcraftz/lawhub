import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/utils/supabase';
import { useUser } from '@/hooks/useUser';
import { Search, X, Send, Plus, FileText } from 'lucide-react';
import { Button, Box, Text, TextField } from '@radix-ui/themes';
import TaskRequestModal from './TaskRequestModal';

export default function ChatModal({ isOpen, onClose, unreadCounts }) {
  const { user } = useUser();
  const [staffList, setStaffList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [chatRooms, setChatRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' 또는 'users'

  // Staff 목록 가져오기
  useEffect(() => {
    const fetchStaffList = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .or('role.eq.staff,role.eq.admin')
        .neq('id', user.id);

      if (error) {
        console.error('Error fetching staff list:', error);
        return;
      }
      setStaffList(data);
    };

    if (user) {
      fetchStaffList();
    }
  }, [user]);

  // 채팅방 목록 가져오기
  useEffect(() => {
    const fetchChatRooms = async () => {
      // 먼저 채팅방 목록을 가져옵니다
      const { data: rooms, error: roomsError } = await supabase
        .from('chat_rooms')
        .select('*, last_message, last_message_at')
        .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (roomsError) {
        console.error('Error fetching chat rooms:', roomsError);
        return;
      }

      // 각 채팅방의 참여자 정보를 가져옵니다
      const roomsWithParticipants = await Promise.all(
        rooms.map(async (room) => {
          const otherUserId = room.participant1_id === user.id ? room.participant2_id : room.participant1_id;

          const { data: otherUser } = await supabase
            .from('users')
            .select('id, name, email')
            .eq('id', otherUserId)
            .single();

          return {
            ...room,
            participant1: room.participant1_id === user.id ? user : otherUser,
            participant2: room.participant1_id === user.id ? otherUser : user,
          };
        })
      );

      setChatRooms(roomsWithParticipants);
    };

    if (user) {
      fetchChatRooms();
    }
  }, [user]);

  // 실시간 메시지 구독
  useEffect(() => {
    if (!currentRoom) return;

    // 이전 메시지 가져오기
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', currentRoom.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }
      setMessages(data);
    };

    fetchMessages();

    // 실시간 구독
    const subscription = supabase
      .channel(`room:${currentRoom.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${currentRoom.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentRoom]);

  // 메시지 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 새 채팅방 생성 또는 기존 채팅방 찾기
  const createOrFindChatRoom = async (otherUserId) => {
    // 기존 채팅방 찾기
    const { data: existingRoom } = await supabase
      .from('chat_rooms')
      .select('*')
      .or(
        `and(participant1_id.eq.${user.id},participant2_id.eq.${otherUserId}),and(participant1_id.eq.${otherUserId},participant2_id.eq.${user.id})`
      )
      .single();

    if (existingRoom) {
      // 기존 채팅방에 참여자 정보 추가
      const { data: otherUser } = await supabase.from('users').select('id, name, email').eq('id', otherUserId).single();

      const roomWithParticipants = {
        ...existingRoom,
        participant1: existingRoom.participant1_id === user.id ? user : otherUser,
        participant2: existingRoom.participant1_id === user.id ? otherUser : user,
      };

      setCurrentRoom(roomWithParticipants);
      return;
    }

    // 새 채팅방 생성
    const { data: newRoom, error } = await supabase
      .from('chat_rooms')
      .insert({
        participant1_id: user.id,
        participant2_id: otherUserId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating chat room:', error);
      return;
    }

    // 새 채팅방에 참여자 정보 추가
    const { data: otherUser } = await supabase.from('users').select('id, name, email').eq('id', otherUserId).single();

    const roomWithParticipants = {
      ...newRoom,
      participant1: user,
      participant2: otherUser,
    };

    setCurrentRoom(roomWithParticipants);
  };

  // 메시지 전송
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentRoom) return;

    const { error } = await supabase.from('chat_messages').insert({
      room_id: currentRoom.id,
      sender_id: user.id,
      message: newMessage.trim(),
    });

    if (error) {
      console.error('Error sending message:', error);
      return;
    }

    // 채팅방 마지막 메시지 업데이트
    await supabase
      .from('chat_rooms')
      .update({
        last_message: newMessage.trim(),
        last_message_at: new Date().toISOString(),
      })
      .eq('id', currentRoom.id);

    setNewMessage('');
  };

  // 시간 포맷 함수 추가
  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    // 1분 미만
    if (minutes < 1) {
      return '방금 전';
    }
    // 1시간 미만
    if (hours < 1) {
      return `${minutes}분 전`;
    }
    // 오늘
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    }
    // 어제
    if (days === 1) {
      return `어제 ${date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    // 일주일 이내
    if (days < 7) {
      return `${days}일 전`;
    }
    // 그 외
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 메뉴 아이템 컴포넌트
  const MenuItem = ({ icon: Icon, label, onClick }) => (
    <button
      onClick={() => {
        onClick();
        setMenuOpen(false);
      }}
      className='w-full flex items-center gap-2 p-2 hover:bg-gray-4 rounded-lg transition-colors text-left'
    >
      <Icon size={16} className='text-gray-11' />
      <span className='text-sm text-gray-12'>{label}</span>
    </button>
  );

  // 메시지 읽음 상태 업데이트
  const markMessagesAsRead = async (roomId, otherUserId) => {
    const { error } = await supabase
      .from('chat_messages')
      .update({ is_read: true })
      .eq('room_id', roomId)
      .eq('sender_id', otherUserId)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // 채팅방 선택 시 메시지 읽음 처리
  const handleRoomSelect = async (room) => {
    setCurrentRoom(room);

    // 이전 메시지 가져오기
    const { data: messages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', room.id)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return;
    }

    setMessages(messages);

    // 읽지 않은 메시지 처리
    const otherUserId = room.participant1_id === user.id ? room.participant2_id : room.participant1_id;
    await markMessagesAsRead(room.id, otherUserId);
  };

  // 채팅방 목록 렌더링
  const renderChatRooms = () => (
    <div className='flex-1 overflow-y-auto'>
      {chatRooms.map((room) => {
        const otherUser = room.participant1_id === user.id ? room.participant2 : room.participant1;
        const unreadCount = unreadCounts[otherUser.id] || 0;

        return (
          <div
            key={room.id}
            onClick={() => handleRoomSelect(room)}
            className={`p-4 border-b border-gray-6 cursor-pointer hover:bg-gray-3 flex justify-between items-center ${
              currentRoom?.id === room.id ? 'bg-gray-4' : ''
            }`}
          >
            <div>
              <div className='flex items-center gap-2'>
                <span className='font-medium text-gray-12'>{otherUser.name}</span>
                {unreadCount > 0 && (
                  <span className='bg-blue-500 text-white text-xs px-2 py-1 rounded-full'>{unreadCount}</span>
                )}
              </div>
              {room.last_message && <p className='text-sm text-gray-11 mt-1'>{room.last_message}</p>}
            </div>
            {room.last_message_at && (
              <span className='text-xs text-gray-11'>{formatMessageTime(room.last_message_at)}</span>
            )}
          </div>
        );
      })}
    </div>
  );

  // 사용자 목록 렌더링
  const renderUserList = () => (
    <div className='flex-1 overflow-y-auto'>
      <div className='p-4'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-11' size={16} />
          <input
            type='text'
            placeholder='이름으로 검색...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='w-full pl-9 pr-4 py-2 bg-gray-3 border border-gray-6 rounded-lg text-gray-12 placeholder-gray-11'
          />
        </div>
      </div>
      <div className='px-2'>
        {staffList
          .filter((staff) => staff.name.toLowerCase().includes(searchTerm.toLowerCase()))
          .map((staff) => (
            <button
              key={staff.id}
              onClick={() => {
                setSelectedUser(staff);
                createOrFindChatRoom(staff.id);
              }}
              className='w-full p-3 hover:bg-gray-4 rounded-lg transition-colors duration-200 flex items-center gap-3'
            >
              <div className='w-10 h-10 bg-blue-9 rounded-full flex items-center justify-center text-white font-semibold'>
                {staff.name[0]}
              </div>
              <div className='text-left'>
                <div className='font-medium text-gray-12'>{staff.name}</div>
                <div className='text-sm text-gray-11'>{staff.email}</div>
              </div>
            </button>
          ))}
      </div>
    </div>
  );

  // 뒤로가기 처리
  const handleBack = () => {
    setCurrentRoom(null);
    setMessages([]);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className='fixed bottom-24 right-6 w-96 bg-gray-2 rounded-lg shadow-xl border border-gray-6 overflow-hidden'
    >
      {/* 헤더 */}
      <div className='p-4 bg-gray-3 border-b border-gray-6'>
        {currentRoom ? (
          <div className='flex items-center gap-3'>
            <button onClick={handleBack} className='text-gray-11 hover:text-gray-12'>
              <X size={20} />
            </button>
            <h2 className='text-lg font-semibold text-gray-12'>
              {currentRoom.participant1_id === user.id ? currentRoom.participant2.name : currentRoom.participant1.name}
            </h2>
          </div>
        ) : (
          <div className='flex flex-col gap-3'>
            <div className='flex justify-between items-center'>
              <h2 className='text-lg font-semibold text-gray-12'>메시지</h2>
              <button onClick={onClose} className='text-gray-11 hover:text-gray-12'>
                <X size={20} />
              </button>
            </div>
            <div className='flex border-b border-gray-6'>
              <button
                onClick={() => setActiveTab('chats')}
                className={`flex-1 py-2 text-sm font-medium ${
                  activeTab === 'chats' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-11 hover:text-gray-12'
                }`}
              >
                채팅방 목록
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`flex-1 py-2 text-sm font-medium ${
                  activeTab === 'users' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-11 hover:text-gray-12'
                }`}
              >
                직원 목록
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 메인 컨텐츠 */}
      <div className='h-[500px] flex flex-col'>
        {currentRoom ? (
          // 채팅방
          <>
            <div className='flex-1 overflow-y-auto p-4 space-y-4'>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'} w-full`}
                >
                  <div
                    className={`flex flex-col ${
                      message.sender_id === user.id ? 'items-end' : 'items-start'
                    } max-w-[80%]`}
                  >
                    <div
                      className={`break-words whitespace-pre-wrap p-3 rounded-lg ${
                        message.sender_id === user.id
                          ? 'bg-blue-9 text-white rounded-br-none'
                          : 'bg-gray-4 text-gray-12 rounded-bl-none'
                      }`}
                    >
                      {message.message}
                    </div>
                    <span className='text-xs mt-1 text-gray-11'>{formatMessageTime(message.created_at)}</span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} className='p-4 border-t border-gray-6'>
              <div className='flex gap-2 items-end'>
                <div className='relative'>
                  <Button
                    variant='ghost'
                    onClick={() => setMenuOpen(!menuOpen)}
                    className='h-9 w-9 p-0 flex items-center justify-center'
                  >
                    <Plus size={20} className='text-gray-11' />
                  </Button>
                  {menuOpen && (
                    <div className='absolute bottom-full mb-2 left-0 w-48 bg-gray-2 rounded-lg shadow-lg border border-gray-6 p-1'>
                      <MenuItem icon={FileText} label='업무 요청' onClick={() => setShowTaskModal(true)} />
                    </div>
                  )}
                </div>
                <input
                  type='text'
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder='메시지를 입력하세요...'
                  className='flex-1 px-4 py-2 bg-gray-3 border border-gray-6 rounded-lg text-gray-12 placeholder-gray-11'
                />
                <Button type='submit' disabled={!newMessage.trim()}>
                  <Send size={16} />
                </Button>
              </div>
            </form>
          </>
        ) : // 탭 컨텐츠
        activeTab === 'chats' ? (
          renderChatRooms()
        ) : (
          renderUserList()
        )}
      </div>

      {/* 업무요청 모달 */}
      {showTaskModal && currentRoom && (
        <TaskRequestModal
          isOpen={showTaskModal}
          onClose={() => setShowTaskModal(false)}
          receiverId={
            currentRoom.participant1_id === user.id ? currentRoom.participant2_id : currentRoom.participant1_id
          }
        />
      )}
    </motion.div>
  );
}
