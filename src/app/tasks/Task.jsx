'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Clock, Send, CheckCircle, Loader2, FileText, X, Plus, Calendar, ArrowRightLeft } from 'lucide-react';
import Pagination from '@/components/Pagination';
import SentTasks from './SentTasks';
import ReceivedTasks from './ReceivedTasks';

export default function Task({ user, viewFilter = null, preview = false }) {
  const [viewType, setViewType] = useState('all'); // 'all', 'sent', 'received'

  // viewFilter prop이 변경되면 viewType 상태 업데이트
  useEffect(() => {
    if (viewFilter) {
      setViewType(viewFilter);
    }
  }, [viewFilter]);

  // 탭 전환 핸들러
  const handleTabChange = (type) => {
    setViewType(type);
  };

  return (
    <div className='space-y-4'>
      {/* 미리보기 모드가 아니고, viewFilter가 없을 때만 탭 인터페이스 표시 */}
      {!preview && !viewFilter && (
        <div className='flex border-b border-gray-6'>
          <button
            onClick={() => handleTabChange('all')}
            className={`px-4 py-2 font-medium flex items-center gap-1 ${
              viewType === 'all' ? 'text-blue-9 border-b-2 border-blue-9' : 'text-gray-11 hover:text-gray-12'
            }`}
          >
            <ArrowRightLeft size={16} />
            전체
          </button>
          <button
            onClick={() => handleTabChange('sent')}
            className={`px-4 py-2 font-medium flex items-center gap-1 ${
              viewType === 'sent' ? 'text-blue-9 border-b-2 border-blue-9' : 'text-gray-11 hover:text-gray-12'
            }`}
          >
            <Send size={16} />
            보낸 업무
          </button>
          <button
            onClick={() => handleTabChange('received')}
            className={`px-4 py-2 font-medium flex items-center gap-1 ${
              viewType === 'received' ? 'text-blue-9 border-b-2 border-blue-9' : 'text-gray-11 hover:text-gray-12'
            }`}
          >
            <Send size={16} className='transform rotate-180' />
            받은 업무
          </button>
        </div>
      )}

      {/* 선택된 탭에 따라 적절한 컴포넌트 렌더링 */}
      {(viewType === 'all' || viewType === 'sent') && viewType !== 'received' && (
        <SentTasks user={user} preview={preview} />
      )}

      {(viewType === 'all' || viewType === 'received') && viewType !== 'sent' && (
        <ReceivedTasks user={user} preview={preview} />
      )}
    </div>
  );
}
