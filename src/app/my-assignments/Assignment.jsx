'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeftIcon } from '@radix-ui/react-icons';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';
import AssignmentSummary from './AssignmentSummary'; // ✅ 간략히 보기만 사용

const Assignment = ({ clientId }) => {
  const [clientName, setClientName] = useState('');
  const router = useRouter();

  // ✅ 의뢰인 정보 가져오기 (이전과 동일)
  const fetchUser = useCallback(async () => {
    if (!clientId) return;

    const { data: clientData, error } = await supabase.from('users').select('name').eq('id', clientId).single();

    if (error || !clientData) {
      console.log('의뢰인 정보를 불러오는데 실패했습니다.', error);
    } else {
      setClientName(clientData.name);
    }
  }, [clientId]);

  useEffect(() => {
    fetchUser();
  }, [clientId, fetchUser]);

  return (
    <div className='py-4 w-full px-4 max-w-screen-2xl sm:px-2 md:px-4 lg:px-24'>
      <header className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4'>
        <div className='flex items-center gap-2'>
          <ArrowLeftIcon className='w-8 h-8 cursor-pointer' onClick={() => router.back()} />
          <h1 className='text-2xl font-bold'>{clientName}님의 사건 관리</h1>
        </div>
      </header>

      <main>
        {/* ✅ "간략히 보기"를 기본으로 표시 */}
        <AssignmentSummary clientId={clientId} />
      </main>
    </div>
  );
};

export default Assignment;
