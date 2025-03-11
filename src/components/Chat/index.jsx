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

  // 읽지 않은 메시지 확인
  useEffect(() => {
    if (!user) return;

    const checkUnreadMessages = async () => {
      const { data: rooms } = await supabase
        .from('chat_rooms')
        .select('id')
        .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`);

      if (!rooms?.length) return;

      const roomIds = rooms.map((room) => room.id);
      const { data: messages } = await supabase
        .from('chat_messages')
        .select('id')
        .in('room_id', roomIds)
        .eq('is_read', false)
        .neq('sender_id', user.id)
        .limit(1);

      setHasUnread(messages?.length > 0);
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
        () => {
          setHasUnread(true);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const handleToggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHasUnread(false);
    }
  };

  // staff나 admin 역할이 아닌 경우 채팅 기능을 숨김
  if (!user || (user.role !== 'staff' && user.role !== 'admin')) return null;

  return (
    <>
      <ChatButton onClick={handleToggleChat} hasUnread={hasUnread} isOpen={isOpen} />
      <AnimatePresence>{isOpen && <ChatModal isOpen={isOpen} onClose={handleToggleChat} />}</AnimatePresence>
    </>
  );
}
