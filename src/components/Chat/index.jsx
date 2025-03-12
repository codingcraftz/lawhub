'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { supabase } from '@/utils/supabase';
import { useUser } from '@/hooks/useUser';
import ChatButton from './ChatButton';
import ChatModal from './ChatModal';

export default function Chat() {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});

  // 읽지 않은 메시지 확인
  useEffect(() => {
    if (!user) return;

    const checkUnreadMessages = async () => {
      // 채팅방 목록 조회
      const { data: rooms } = await supabase
        .from('chat_rooms')
        .select('id, participant1_id, participant2_id')
        .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`);

      if (!rooms?.length) return;

      // 읽지 않은 메시지 조회
      const { data: unreadMessages } = await supabase
        .from('chat_messages')
        .select('sender_id, room_id')
        .in(
          'room_id',
          rooms.map((room) => room.id)
        )
        .eq('is_read', false)
        .neq('sender_id', user.id);

      if (!unreadMessages?.length) {
        setUnreadCounts({});
        setHasUnread(false);
        return;
      }

      // 발신자별 읽지 않은 메시지 수 계산
      const counts = unreadMessages.reduce((acc, msg) => {
        acc[msg.sender_id] = (acc[msg.sender_id] || 0) + 1;
        return acc;
      }, {});

      setUnreadCounts(counts);
      setHasUnread(true);
    };

    checkUnreadMessages();

    // 실시간 구독
    const subscription = supabase
      .channel('unread_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `sender_id=neq.${user.id}`,
        },
        (payload) => {
          setHasUnread(true);
          setUnreadCounts((prev) => {
            const senderId = payload.new.sender_id;
            return {
              ...prev,
              [senderId]: (prev[senderId] || 0) + 1,
            };
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `is_read=eq.true`,
        },
        async () => {
          // 메시지가 읽음 처리되면 카운트 다시 확인
          await checkUnreadMessages();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const handleToggleChat = () => {
    setIsOpen(!isOpen);
  };

  // staff나 admin 역할이 아닌 경우 채팅 기능을 숨김
  if (!user || (user.role !== 'staff' && user.role !== 'admin')) return null;

  return (
    <>
      <ChatButton onClick={handleToggleChat} hasUnread={hasUnread} isOpen={isOpen} />
      <AnimatePresence>
        {isOpen && <ChatModal isOpen={isOpen} onClose={handleToggleChat} unreadCounts={unreadCounts} />}
      </AnimatePresence>
    </>
  );
}
