'use client';

import React from 'react';
import { Box, Text } from '@radix-ui/themes';

import Task from './Task';
import Inquiry from './Inquiry';
import CorrectionOrders from './CorrectionOrders';

import { useUser } from '@/hooks/useUser';

export default function TasksAndInquiryPage() {
  const { user } = useUser();
  return (
    <Box className='p-4 w-full text-gray-12 space-y-8 sm:px-2 md:px-4 lg:px-24 max-w-screen-2xl'>
      {/* 업무 관리 섹션 */}
      <Box
        className='
          p-4 rounded-md shadow-md shadow-gray-7 
          bg-gray-2
        '
      >
        <Text size='6' weight='bold' className='mb-4'>
          의뢰 업무 관리
        </Text>
        {/* 이미 작성해두신 TaskPage 컴포넌트 (받은 요청/보낸 요청/종료된 요청 탭) */}
        <Task user={user} />
      </Box>

      {/* 보정명령 관리 섹션 */}
      <Box
        className='
          p-4 rounded-md shadow-md shadow-gray-7 
          bg-gray-2
        '
      >
        <Text size='6' weight='bold' className='mb-4'>
          보정명령 관리
        </Text>
        <CorrectionOrders user={user} />
      </Box>

      {/* 문의 관리 섹션 */}
      <Box
        className='
          p-4 rounded-md shadow-md shadow-gray-7 
          bg-gray-2
        '
      >
        <Text size='6' weight='bold' className='mb-4'>
          의뢰 문의 관리
        </Text>
        <Inquiry user={user} />
      </Box>
    </Box>
  );
}
