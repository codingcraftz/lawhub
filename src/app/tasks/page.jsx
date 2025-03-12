'use client';

import React, { useState, useEffect } from 'react';
import { User, SendHorizontal, MailQuestion, ClipboardEdit, Briefcase, Star } from 'lucide-react';
import Task from './Task';
import Inquiry from './Inquiry';
import CorrectionOrders from './CorrectionOrders';
import MyAssignments from './MyAssignments';
import FavoriteAssignments from './FavoriteAssignments';
import { useUser } from '@/hooks/useUser';
import LoadingSpinner from '@/components/LoadingSpinner';
import { supabase } from '@/utils/supabase';

export default function TasksPage() {
  const { user, loading } = useUser();
  const [tabCounts, setTabCounts] = useState({
    correctionOrders: 0,
    sentTasks: 0,
    receivedTasks: 0,
    inquiries: 0,
  });

  // 업무 관리와 사건 관리 탭을 독립적으로 관리하기 위한 별도의 상태
  const [activeTaskTab, setActiveTaskTab] = useState('dashboard');
  const [activeCaseTab, setActiveCaseTab] = useState('myAssignments');

  // 업무 관리 탭 변경 핸들러
  const handleTaskTabChange = (tab) => {
    setActiveTaskTab(tab);
    // 페이지 상단으로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 사건 관리 탭 변경 핸들러
  const handleCaseTabChange = (tab) => {
    setActiveCaseTab(tab);
    // 페이지 상단으로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 직접 카운트 데이터를 가져오는 함수
  const fetchCounts = async () => {
    if (!user?.id) return;

    console.log('카운트 데이터를 가져오는 중...', user.id, '역할:', user.role);

    try {
      // 1. 보정명령 카운트
      let pendingCorrections = 0;

      if (user.role === 'admin') {
        // 관리자는 모든 보정명령 카운트를 가져옴
        const { count, error } = await supabase
          .from('correction_orders')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending');

        if (error) {
          console.error('관리자 보정명령 카운트 조회 오류:', error);
        } else {
          pendingCorrections = count || 0;
          console.log('관리자 보정명령 카운트:', pendingCorrections);
        }
      } else {
        // staff인 경우 담당 의뢰의 보정명령만 가져옴
        // 1) 먼저 사용자가 담당하는 의뢰 ID 목록 가져오기
        const { data: assigneeData, error: assigneeError } = await supabase
          .from('assignment_assignees')
          .select('assignment_id')
          .eq('user_id', user.id);

        if (assigneeError) {
          console.error('담당 의뢰 목록 조회 오류:', assigneeError);
        } else if (assigneeData && assigneeData.length > 0) {
          // 담당 의뢰 ID 추출
          const assignmentIds = assigneeData.map((item) => item.assignment_id);
          console.log('담당 의뢰 ID 목록:', assignmentIds);

          // 2) 담당 의뢰의 보정명령 카운트 조회
          const { count, error } = await supabase
            .from('correction_orders')
            .select('id', { count: 'exact', head: true })
            .in('assignment_id', assignmentIds)
            .eq('status', 'pending');

          if (error) {
            console.error('담당 보정명령 카운트 조회 오류:', error);
          } else {
            pendingCorrections = count || 0;
            console.log('담당 보정명령 카운트:', pendingCorrections);
          }
        } else {
          console.log('담당 의뢰가 없습니다.');
        }
      }

      setTabCounts((prev) => ({ ...prev, correctionOrders: pendingCorrections }));

      // 2. 보낸 업무 카운트
      const { count: sentTasks, error: sentError } = await supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', user.id)
        .not('status', 'eq', 'completed');

      if (sentError) {
        console.error('보낸 업무 카운트 조회 오류:', sentError);
      } else {
        console.log('보낸 업무 카운트:', sentTasks);
        setTabCounts((prev) => ({ ...prev, sentTasks: sentTasks || 0 }));
      }

      // 3. 받은 업무 카운트
      const { count: receivedTasks, error: receivedError } = await supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('assignee_id', user.id)
        .not('status', 'eq', 'completed');

      if (receivedError) {
        console.error('받은 업무 카운트 조회 오류:', receivedError);
      } else {
        console.log('받은 업무 카운트:', receivedTasks);
        setTabCounts((prev) => ({ ...prev, receivedTasks: receivedTasks || 0 }));
      }

      // 4. 문의 카운트 (이미 user_id로 필터링되어 있어 정상 작동)
      const { count: inquiries, error: inquiryError } = await supabase
        .from('assignment_inquiries')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'ongoing');

      if (inquiryError) {
        console.error('문의 카운트 조회 오류:', inquiryError);
      } else {
        console.log('문의 카운트:', inquiries);
        setTabCounts((prev) => ({ ...prev, inquiries: inquiries || 0 }));
      }

      // 최종 카운트 확인 로그 추가
      console.log('최종 집계된 카운트:', tabCounts);
    } catch (error) {
      console.error('카운트 조회 오류:', error);
    }
  };

  // 컴포넌트 마운트 시 카운트를 항상 업데이트
  useEffect(() => {
    console.log('컴포넌트 마운트 - 유저 정보:', user);
    if (user?.id) {
      fetchCounts();
    }
  }, [user?.id]);

  // 5분마다 카운트 새로고침
  useEffect(() => {
    if (!user?.id) return;

    const intervalId = setInterval(() => {
      console.log('카운트 자동 새로고침');
      fetchCounts();
    }, 5 * 60 * 1000); // 5분마다

    return () => clearInterval(intervalId);
  }, [user?.id]);

  // 탭 스타일 계산 함수
  const getTaskTabStyle = (tab, isActive) => {
    const baseStyle = 'font-medium px-4 py-2 rounded-md transition-colors flex items-center gap-2';

    if (isActive) {
      return `${baseStyle} bg-blue-5 text-blue-11 border-b-2 border-blue-9`;
    }

    return `${baseStyle} text-gray-11 hover:bg-gray-4 hover:text-gray-12`;
  };

  // 사건 관리 탭 스타일 계산 함수
  const getCaseTabStyle = (tab, isActive) => {
    const baseStyle = 'font-medium px-4 py-2 rounded-md transition-colors flex items-center gap-2';

    if (isActive) {
      return `${baseStyle} bg-amber-5 text-amber-11 border-b-2 border-amber-9`;
    }

    return `${baseStyle} text-gray-11 hover:bg-gray-4 hover:text-gray-12`;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className='container mx-auto px-4 py-6 max-w-7xl'>
      {/* 페이지 헤더 */}
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-gray-12'>업무 관리 대시보드</h1>
        <p className='text-gray-11'>업무, 문의, 보정명령 및 사건 현황을 한 곳에서 관리하세요.</p>
      </div>

      {/* 업무 관리 섹션 */}
      <div className='mb-6 border rounded-lg p-4 bg-white dark:bg-gray-2'>
        <h2 className='text-lg font-semibold text-gray-12 mb-2'>업무 관리</h2>
        <div className='border-b border-gray-6 overflow-x-auto'>
          <div className='flex space-x-1 min-w-max'>
            <button
              onClick={() => handleTaskTabChange('dashboard')}
              className={getTaskTabStyle('dashboard', activeTaskTab === 'dashboard')}
            >
              <svg width='15' height='15' viewBox='0 0 15 15' fill='none' xmlns='http://www.w3.org/2000/svg'>
                <path
                  d='M2.8 1H2.7C1.7595 1 1 1.7595 1 2.7V12.3C1 13.2405 1.7595 14 2.7 14H12.3C13.2405 14 14 13.2405 14 12.3V2.7C14 1.7595 13.2405 1 12.3 1H2.8ZM2.7 2H12.3C12.6866 2 13 2.3134 13 2.7V5H2V2.7C2 2.3134 2.3134 2 2.7 2ZM2 6H7V13H2.7C2.3134 13 2 12.6866 2 12.3V6ZM8 6H13V12.3C13 12.6866 12.6866 13 12.3 13H8V6Z'
                  fill='currentColor'
                  fillRule='evenodd'
                  clipRule='evenodd'
                ></path>
              </svg>
              대시보드
            </button>
            <button
              onClick={() => handleTaskTabChange('correctionOrders')}
              className={getTaskTabStyle('correctionOrders', activeTaskTab === 'correctionOrders')}
            >
              <ClipboardEdit className='h-4 w-4' />
              보정명령
              {tabCounts.correctionOrders > 0 && (
                <span className='px-2 py-0.5 text-xs rounded-full bg-orange-3 text-orange-11'>
                  {tabCounts.correctionOrders}
                </span>
              )}
            </button>
            <button
              onClick={() => handleTaskTabChange('sentTasks')}
              className={getTaskTabStyle('sentTasks', activeTaskTab === 'sentTasks')}
            >
              <SendHorizontal className='h-4 w-4' />
              보낸 업무
              {tabCounts.sentTasks > 0 && (
                <span className='px-2 py-0.5 text-xs rounded-full bg-blue-3 text-blue-11'>{tabCounts.sentTasks}</span>
              )}
            </button>
            <button
              onClick={() => handleTaskTabChange('receivedTasks')}
              className={getTaskTabStyle('receivedTasks', activeTaskTab === 'receivedTasks')}
            >
              <User className='h-4 w-4' />
              받은 업무
              <span className='px-2 py-0.5 text-xs rounded-full bg-green-3 text-green-11'>
                {tabCounts.receivedTasks || 0}
              </span>
            </button>
            <button
              onClick={() => handleTaskTabChange('inquiries')}
              className={getTaskTabStyle('inquiries', activeTaskTab === 'inquiries')}
            >
              <MailQuestion className='h-4 w-4' />
              문의
              <span className='px-2 py-0.5 text-xs rounded-full bg-violet-3 text-violet-11'>
                {tabCounts.inquiries || 0}
              </span>
            </button>
          </div>
        </div>

        {/* 업무 관리 컨텐츠 */}
        <div className='mt-4'>
          {activeTaskTab === 'dashboard' && (
            <div className='space-y-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
                {/* 보정명령 카드 */}
                <div
                  className='p-6 bg-white dark:bg-gray-2 border border-gray-6 rounded-lg shadow-sm cursor-pointer hover:border-orange-7 transition-colors hover:shadow-md'
                  onClick={() => handleTaskTabChange('correctionOrders')}
                >
                  <div className='flex justify-between items-start mb-4'>
                    <div className='bg-orange-4 p-2 rounded'>
                      <ClipboardEdit className='h-6 w-6 text-orange-11' />
                    </div>
                    <span className='text-2xl font-bold text-orange-11'>{tabCounts.correctionOrders}</span>
                  </div>
                  <h3 className='font-medium mb-1'>보정명령</h3>
                  <p className='text-sm text-gray-11'>처리가 필요한 보정명령 확인</p>
                  <div className='mt-3 pt-3 border-t border-gray-5'>
                    <span className='text-xs text-orange-11 flex items-center'>
                      <svg
                        width='15'
                        height='15'
                        viewBox='0 0 15 15'
                        fill='none'
                        xmlns='http://www.w3.org/2000/svg'
                        className='mr-1'
                      >
                        <path
                          d='M7.49991 0.876892C3.84222 0.876892 0.877075 3.84204 0.877075 7.49972C0.877075 11.1574 3.84222 14.1226 7.49991 14.1226C11.1576 14.1226 14.1227 11.1574 14.1227 7.49972C14.1227 3.84204 11.1576 0.876892 7.49991 0.876892ZM1.82707 7.49972C1.82707 4.36671 4.36689 1.82689 7.49991 1.82689C10.6329 1.82689 13.1727 4.36671 13.1727 7.49972C13.1727 10.6327 10.6329 13.1726 7.49991 13.1726C4.36689 13.1726 1.82707 10.6327 1.82707 7.49972ZM7.50003 4C7.77617 4 8.00003 4.22386 8.00003 4.5V7H10.0001C10.2762 7 10.5001 7.22386 10.5001 7.5C10.5001 7.77614 10.2762 8 10.0001 8H7.50003C7.22389 8 7.00003 7.77614 7.00003 7.5V4.5C7.00003 4.22386 7.22389 4 7.50003 4Z'
                          fill='currentColor'
                          fillRule='evenodd'
                          clipRule='evenodd'
                        ></path>
                      </svg>
                      클릭하여 모두 보기
                    </span>
                  </div>
                </div>

                {/* 보낸 업무 카드 */}
                <div
                  className='p-6 bg-white dark:bg-gray-2 border border-gray-6 rounded-lg shadow-sm cursor-pointer hover:border-blue-7 transition-colors hover:shadow-md'
                  onClick={() => handleTaskTabChange('sentTasks')}
                >
                  <div className='flex justify-between items-start mb-4'>
                    <div className='bg-blue-4 p-2 rounded'>
                      <SendHorizontal className='h-6 w-6 text-blue-11' />
                    </div>
                    <span className='text-2xl font-bold text-blue-11'>{tabCounts.sentTasks}</span>
                  </div>
                  <h3 className='font-medium mb-1'>보낸 업무</h3>
                  <p className='text-sm text-gray-11'>내가 의뢰한 업무 상태 확인</p>
                  <div className='mt-3 pt-3 border-t border-gray-5'>
                    <span className='text-xs text-blue-11 flex items-center'>
                      <svg
                        width='15'
                        height='15'
                        viewBox='0 0 15 15'
                        fill='none'
                        xmlns='http://www.w3.org/2000/svg'
                        className='mr-1'
                      >
                        <path
                          d='M7.49991 0.876892C3.84222 0.876892 0.877075 3.84204 0.877075 7.49972C0.877075 11.1574 3.84222 14.1226 7.49991 14.1226C11.1576 14.1226 14.1227 11.1574 14.1227 7.49972C14.1227 3.84204 11.1576 0.876892 7.49991 0.876892ZM1.82707 7.49972C1.82707 4.36671 4.36689 1.82689 7.49991 1.82689C10.6329 1.82689 13.1727 4.36671 13.1727 7.49972C13.1727 10.6327 10.6329 13.1726 7.49991 13.1726C4.36689 13.1726 1.82707 10.6327 1.82707 7.49972ZM7.50003 4C7.77617 4 8.00003 4.22386 8.00003 4.5V7H10.0001C10.2762 7 10.5001 7.22386 10.5001 7.5C10.5001 7.77614 10.2762 8 10.0001 8H7.50003C7.22389 8 7.00003 7.77614 7.00003 7.5V4.5C7.00003 4.22386 7.22389 4 7.50003 4Z'
                          fill='currentColor'
                          fillRule='evenodd'
                          clipRule='evenodd'
                        ></path>
                      </svg>
                      클릭하여 모두 보기
                    </span>
                  </div>
                </div>

                {/* 받은 업무 카드 */}
                <div
                  className='p-6 bg-white dark:bg-gray-2 border border-gray-6 rounded-lg shadow-sm cursor-pointer hover:border-green-7 transition-colors hover:shadow-md'
                  onClick={() => handleTaskTabChange('receivedTasks')}
                >
                  <div className='flex justify-between items-start mb-4'>
                    <div className='bg-green-4 p-2 rounded'>
                      <User className='h-6 w-6 text-green-11' />
                    </div>
                    <span className='text-2xl font-bold text-green-11'>{tabCounts.receivedTasks}</span>
                  </div>
                  <h3 className='font-medium mb-1'>받은 업무</h3>
                  <p className='text-sm text-gray-11'>나에게 배정된 업무 처리</p>
                  <div className='mt-3 pt-3 border-t border-gray-5'>
                    <span className='text-xs text-green-11 flex items-center'>
                      <svg
                        width='15'
                        height='15'
                        viewBox='0 0 15 15'
                        fill='none'
                        xmlns='http://www.w3.org/2000/svg'
                        className='mr-1'
                      >
                        <path
                          d='M7.49991 0.876892C3.84222 0.876892 0.877075 3.84204 0.877075 7.49972C0.877075 11.1574 3.84222 14.1226 7.49991 14.1226C11.1576 14.1226 14.1227 11.1574 14.1227 7.49972C14.1227 3.84204 11.1576 0.876892 7.49991 0.876892ZM1.82707 7.49972C1.82707 4.36671 4.36689 1.82689 7.49991 1.82689C10.6329 1.82689 13.1727 4.36671 13.1727 7.49972C13.1727 10.6327 10.6329 13.1726 7.49991 13.1726C4.36689 13.1726 1.82707 10.6327 1.82707 7.49972ZM7.50003 4C7.77617 4 8.00003 4.22386 8.00003 4.5V7H10.0001C10.2762 7 10.5001 7.22386 10.5001 7.5C10.5001 7.77614 10.2762 8 10.0001 8H7.50003C7.22389 8 7.00003 7.77614 7.00003 7.5V4.5C7.00003 4.22386 7.22389 4 7.50003 4Z'
                          fill='currentColor'
                          fillRule='evenodd'
                          clipRule='evenodd'
                        ></path>
                      </svg>
                      클릭하여 모두 보기
                    </span>
                  </div>
                </div>

                {/* 문의 카드 */}
                <div
                  className='p-6 bg-white dark:bg-gray-2 border border-gray-6 rounded-lg shadow-sm cursor-pointer hover:border-purple-7 transition-colors hover:shadow-md'
                  onClick={() => handleTaskTabChange('inquiries')}
                >
                  <div className='flex justify-between items-start mb-4'>
                    <div className='bg-purple-4 p-2 rounded'>
                      <MailQuestion className='h-6 w-6 text-purple-11' />
                    </div>
                    <span className='text-2xl font-bold text-purple-11'>{tabCounts.inquiries}</span>
                  </div>
                  <h3 className='font-medium mb-1'>문의</h3>
                  <p className='text-sm text-gray-11'>의뢰 관련 문의사항 확인</p>
                  <div className='mt-3 pt-3 border-t border-gray-5'>
                    <span className='text-xs text-purple-11 flex items-center'>
                      <svg
                        width='15'
                        height='15'
                        viewBox='0 0 15 15'
                        fill='none'
                        xmlns='http://www.w3.org/2000/svg'
                        className='mr-1'
                      >
                        <path
                          d='M7.49991 0.876892C3.84222 0.876892 0.877075 3.84204 0.877075 7.49972C0.877075 11.1574 3.84222 14.1226 7.49991 14.1226C11.1576 14.1226 14.1227 11.1574 14.1227 7.49972C14.1227 3.84204 11.1576 0.876892 7.49991 0.876892ZM1.82707 7.49972C1.82707 4.36671 4.36689 1.82689 7.49991 1.82689C10.6329 1.82689 13.1727 4.36671 13.1727 7.49972C13.1727 10.6327 10.6329 13.1726 7.49991 13.1726C4.36689 13.1726 1.82707 10.6327 1.82707 7.49972ZM7.50003 4C7.77617 4 8.00003 4.22386 8.00003 4.5V7H10.0001C10.2762 7 10.5001 7.22386 10.5001 7.5C10.5001 7.77614 10.2762 8 10.0001 8H7.50003C7.22389 8 7.00003 7.77614 7.00003 7.5V4.5C7.00003 4.22386 7.22389 4 7.50003 4Z'
                          fill='currentColor'
                          fillRule='evenodd'
                          clipRule='evenodd'
                        ></path>
                      </svg>
                      클릭하여 모두 보기
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTaskTab === 'correctionOrders' && (
            <div>
              <div className='flex items-center gap-2 mb-4'>
                <ClipboardEdit className='h-6 w-6 text-orange-11' />
                <h2 className='text-xl font-medium'>보정명령 관리</h2>
              </div>
              <CorrectionOrders user={user} onTabChange={handleTaskTabChange} />
            </div>
          )}

          {activeTaskTab === 'sentTasks' && (
            <div>
              <div className='flex items-center gap-2 mb-4'>
                <SendHorizontal className='h-6 w-6 text-blue-11' />
                <h2 className='text-xl font-medium'>보낸 업무 관리</h2>
              </div>
              <Task user={user} viewFilter='sent' />
            </div>
          )}

          {activeTaskTab === 'receivedTasks' && (
            <div>
              <div className='flex items-center gap-2 mb-4'>
                <User className='h-6 w-6 text-green-11' />
                <h2 className='text-xl font-medium'>받은 업무 관리</h2>
              </div>
              <Task user={user} viewFilter='received' />
            </div>
          )}

          {activeTaskTab === 'inquiries' && (
            <div>
              <div className='flex items-center gap-2 mb-4'>
                <MailQuestion className='h-6 w-6 text-purple-11' />
                <h2 className='text-xl font-medium'>문의 관리</h2>
              </div>
              <Inquiry user={user} onTabChange={handleTaskTabChange} />
            </div>
          )}
        </div>
      </div>

      {/* 사건 관리 섹션 - 별도의 activeCaseTab 상태로 관리 */}
      <div className='mb-6 border rounded-lg p-4 bg-white dark:bg-gray-2'>
        <h2 className='text-lg font-semibold text-gray-12 mb-2'>사건 관리</h2>
        <div className='border-b border-gray-6 overflow-x-auto'>
          <div className='flex space-x-1 min-w-max'>
            <button
              onClick={() => handleCaseTabChange('myAssignments')}
              className={getCaseTabStyle('myAssignments', activeCaseTab === 'myAssignments')}
            >
              <Briefcase className='h-4 w-4' />
              담당 사건
            </button>
            <button
              onClick={() => handleCaseTabChange('favoriteAssignments')}
              className={getCaseTabStyle('favoriteAssignments', activeCaseTab === 'favoriteAssignments')}
            >
              <Star className='h-4 w-4' />
              즐겨찾기
            </button>
          </div>
        </div>

        {/* 사건 관리 컨텐츠 - activeCaseTab에 따라 표시 */}
        <div className='mt-4'>
          {activeCaseTab === 'myAssignments' && (
            <div>
              <div className='flex items-center gap-2 mb-4'>
                <Briefcase className='h-6 w-6 text-blue-11' />
                <h2 className='text-xl font-medium'>담당 사건 목록</h2>
              </div>
              <div className='bg-white dark:bg-gray-2 border border-gray-6 rounded-lg p-6 shadow-sm'>
                <MyAssignments user={user} />
              </div>
            </div>
          )}

          {activeCaseTab === 'favoriteAssignments' && (
            <div>
              <div className='flex items-center gap-2 mb-4'>
                <Star className='h-6 w-6 text-amber-11' />
                <h2 className='text-xl font-medium'>즐겨찾기한 사건 목록</h2>
              </div>
              <div className='bg-white dark:bg-gray-2 border border-gray-6 rounded-lg p-6 shadow-sm'>
                <FavoriteAssignments user={user} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
