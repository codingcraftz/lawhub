'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Clock, Send, CheckCircle, Loader2, FileText, X, Plus, Calendar, ArrowRightLeft } from 'lucide-react';
import Pagination from '@/components/Pagination';

export default function ReceivedTasks({ user, preview = false }) {
  const [activeTab, setActiveTab] = useState('pending');
  const [tasks, setTasks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(4);

  // 업무 목록 조회
  const fetchTasks = async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      // 전체 개수 조회를 위한 쿼리
      let countQuery = supabase.from('tasks').select('id', { count: 'exact' }).eq('assignee_id', user.id); // 받은 업무만 조회

      // 탭에 따라 필터링
      if (activeTab === 'all') {
        // 전체 탭은 상태 필터 없음
      } else if (activeTab === 'pending') {
        countQuery = countQuery.not('status', 'eq', 'completed');
      } else if (activeTab === 'completed') {
        countQuery = countQuery.eq('status', 'completed');
      }

      const { count, error: countError } = await countQuery;

      if (countError) throw countError;

      setTotalCount(count || 0);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));

      // 데이터 조회 쿼리
      let query = supabase
        .from('tasks')
        .select(
          `
          *,
          assignment:assignments (
            id,
            description,
            creditors:assignment_creditors (id, name),
            debtors:assignment_debtors (id, name)
          ),
          creator:users!tasks_created_by_fkey1 (
            id,
            name,
            email
          ),
          assignee:users!tasks_assignee_id_fkey1 (
            id,
            name,
            email
          )
        `
        )
        .eq('assignee_id', user.id); // 받은 업무만 조회

      // 탭에 따라 필터링
      if (activeTab === 'all') {
        // 전체 탭은 상태 필터 없음
      } else if (activeTab === 'pending') {
        query = query.not('status', 'eq', 'completed');
      } else if (activeTab === 'completed') {
        query = query.eq('status', 'completed');
      }

      // 정렬
      query = query.order('status', { ascending: false }).order('created_at', { ascending: false });

      // 미리보기 모드일 때는, 페이지네이션 없이 첫 itemsPerPage 개만 조회
      if (preview) {
        query = query.limit(itemsPerPage);
      } else {
        // 페이지네이션 적용
        const from = (currentPage - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;
        query = query.range(from, to);
      }

      const { data, error } = await query;

      if (error) throw error;

      // status 필드가 없는 경우 기본값으로 'pending' 설정
      const processedData = (data || []).map((task) => ({
        ...task,
        status: task.status || 'pending',
      }));

      setTasks(processedData);
    } catch (error) {
      console.error('업무 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 업무 완료 처리
  const handleStatusChange = async (taskId, newStatus) => {
    if (newStatus === 'completed') {
      if (!confirm('이 업무를 완료 처리하시겠습니까?')) return;
    } else {
      if (!confirm('이 업무를 진행 중으로 변경하시겠습니까?')) return;
    }

    try {
      // Optimistic UI 업데이트
      const taskIndex = tasks.findIndex((task) => task.id === taskId);
      if (taskIndex === -1) return;

      // 업데이트할 데이터 준비
      const updateData = {
        status: newStatus,
      };

      // 완료 상태로 변경할 때 completed_at 설정
      const now = new Date();
      if (newStatus === 'completed') {
        updateData.completed_at = now.toISOString();
      } else {
        // 진행 중으로 변경할 때 completed_at 제거
        updateData.completed_at = null;
      }

      // 로컬 상태 업데이트
      const updatedTasks = [...tasks];
      updatedTasks[taskIndex] = {
        ...updatedTasks[taskIndex],
        ...updateData,
      };

      setTasks(updatedTasks);

      const { error } = await supabase.from('tasks').update(updateData).eq('id', taskId);

      if (error) throw error;

      alert(newStatus === 'completed' ? '업무가 완료 처리되었습니다.' : '업무가 진행 중으로 변경되었습니다.');
      fetchTasks();
    } catch (error) {
      console.error('업무 상태 변경 오류:', error);
      alert('업무 상태 변경 중 오류가 발생했습니다.');
    }
  };

  // 업무 삭제
  const handleDelete = async (taskId) => {
    if (!confirm('정말로 이 업무를 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);

      if (error) throw error;

      // 성공 시 목록에서 제거
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
      alert('업무가 삭제되었습니다.');
    } catch (error) {
      console.error('업무 삭제 오류:', error);
      alert('업무 삭제 중 오류가 발생했습니다.');
    }
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // 페이지당 항목 수 변경 핸들러
  const handleItemsPerPageChange = (e) => {
    const newItemsPerPage = parseInt(e.target.value, 10);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // 페이지당 항목 수가 변경되면 첫 페이지로 이동
  };

  // 업무 목록 초기 로드 및 필터/페이지 변경 시 다시 로드
  useEffect(() => {
    if (user?.id) {
      fetchTasks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentPage, itemsPerPage, user?.id]);

  // 미리보기 모드 변경 시 다시 로드 (preview 모드일 때만)
  useEffect(() => {
    if (user?.id && preview) {
      fetchTasks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview, user?.id]);

  return (
    <div className='space-y-4'>
      {/* 상단 도구 모음 - 미리보기 모드가 아닐 때만 표시 */}
      {!preview && (
        <div className='flex justify-between items-center'>
          {/* 페이지당 항목 수 선택 */}
          <div className='flex items-center gap-2 ml-auto'>
            <label htmlFor='itemsPerPage' className='text-sm text-gray-11'>
              페이지당 항목 수:
            </label>
            <select
              id='itemsPerPage'
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              className='px-2 py-1 bg-gray-3 border border-gray-6 rounded text-gray-12 text-sm'
            >
              <option value={4}>4개</option>
              <option value={10}>10개</option>
              <option value={20}>20개</option>
              <option value={50}>50개</option>
            </select>
          </div>
        </div>
      )}

      {/* 상태 탭 - 미리보기 모드가 아닐 때만 표시 */}
      {!preview && (
        <div className='flex border-b border-gray-6'>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'all' ? 'text-blue-9 border-b-2 border-blue-9' : 'text-gray-11 hover:text-gray-12'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'pending' ? 'text-blue-9 border-b-2 border-blue-9' : 'text-gray-11 hover:text-gray-12'
            }`}
          >
            진행 중
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'completed' ? 'text-blue-9 border-b-2 border-blue-9' : 'text-gray-11 hover:text-gray-12'
            }`}
          >
            완료
          </button>
        </div>
      )}

      {/* 로딩 상태 또는 업무 목록 */}
      {loading ? (
        <div className='flex items-center justify-center py-12'>
          <Loader2 size={24} className='animate-spin text-gray-400 mr-2' />
          <span className='text-gray-500'>데이터를 불러오는 중...</span>
        </div>
      ) : (
        <>
          {/* 업무 목록 */}
          {tasks.length === 0 ? (
            <div className='p-4 bg-gray-3 dark:bg-gray-4 rounded-lg text-gray-11 text-center'>
              등록된 받은 업무가 없습니다.
            </div>
          ) : (
            <div className={`grid grid-cols-1 ${!preview ? 'md:grid-cols-2' : ''} gap-4`}>
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className='p-4 bg-slate-2 dark:bg-slate-3 border border-slate-4 dark:border-slate-5 rounded-lg space-y-2 shadow-sm hover:shadow-md transition-all'
                >
                  {/* 상단 정보 및 버튼 */}
                  <div className='flex justify-between items-start'>
                    <div className='flex flex-col gap-2'>
                      <div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            task.status === 'completed' ? 'bg-green-3 text-green-11' : 'bg-orange-3 text-orange-11'
                          }`}
                        >
                          {task.status === 'completed' ? '완료' : '진행 중'}
                        </span>
                      </div>

                      {/* 완료 날짜 */}
                      {task.status === 'completed' && task.completed_at && (
                        <span className='ml-2 text-xs text-gray-11'>
                          {new Date(task.completed_at).toLocaleDateString()} 완료
                        </span>
                      )}
                    </div>

                    {/* 작업 버튼 */}
                    <div className='flex gap-2'>
                      {task.status === 'pending' ? (
                        <button
                          onClick={() => handleStatusChange(task.id, 'completed')}
                          className='px-3 py-1 bg-green-9 hover:bg-green-10 text-white text-sm rounded'
                        >
                          완료
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(task.id, 'pending')}
                          className='px-3 py-1 bg-orange-9 hover:bg-orange-10 text-white text-sm rounded'
                        >
                          진행 중으로 변경
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(task.id)}
                        className='px-3 py-1 bg-red-9 hover:bg-red-10 text-white text-sm rounded'
                      >
                        삭제
                      </button>
                    </div>
                  </div>

                  {/* 의뢰/사건 정보 */}
                  <div className='mt-3'>
                    {task.assignment ? (
                      <>
                        <div className='flex flex-col gap-1 mt-2'>
                          <p className='text-sm text-gray-11'>
                            <span className='font-medium'>채권자:</span>{' '}
                            {task.assignment.creditors?.map((c) => c.name).join(', ') || '채권자 정보 없음'}
                          </p>
                          <p className='text-sm text-gray-11'>
                            <span className='font-medium'>채무자:</span>{' '}
                            {task.assignment.debtors?.map((d) => d.name).join(', ') || '채무자 정보 없음'}
                          </p>
                        </div>
                      </>
                    ) : (
                      <p className='text-sm italic text-gray-11'>참조 의뢰 없음</p>
                    )}
                  </div>

                  {/* 업무 내용 */}
                  <div className='mt-3 p-3 bg-slate-3 dark:bg-slate-4 rounded-md'>
                    <p className='text-sm text-gray-12 whitespace-pre-wrap'>{task.description}</p>
                  </div>

                  {/* 날짜 정보 */}
                  <div className='flex gap-4 mt-2'>
                    <div className='flex items-center gap-1 text-sm text-gray-11'>
                      <Calendar size={14} />
                      <span>생성일: {new Date(task.created_at).toLocaleDateString()}</span>
                    </div>
                    {task.completed_at && (
                      <div className='flex items-center gap-1 text-sm text-gray-11'>
                        <Calendar size={14} />
                        <span>완료일: {new Date(task.completed_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  <div className='mt-3 pb-2 border-b border-slate-4'>
                    <div className='flex justify-between text-sm text-gray-11'>
                      <div>
                        <span className='font-medium'>요청자:</span>{' '}
                        <span className='text-gray-12'>{task.creator?.name || '알 수 없음'}</span>
                      </div>
                      <div>
                        <span className='font-medium'>담당자:</span>{' '}
                        <span className='text-gray-12'>{task.assignee?.name || '알 수 없음'}</span>
                      </div>
                    </div>
                  </div>

                  {/* 첨부 파일 */}
                  {task.attachments && task.attachments.length > 0 && (
                    <div className='mt-3'>
                      <h4 className='text-sm font-medium text-gray-12 mb-1'>첨부파일</h4>
                      <div className='space-y-1'>
                        {task.attachments.map((file, index) => (
                          <div key={index} className='flex items-center gap-2'>
                            <FileText size={14} className='text-gray-11' />
                            <a
                              href={supabase.storage.from('tasks').getPublicUrl(file.path).data.publicUrl}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='text-sm text-blue-9 hover:text-blue-10 hover:underline'
                            >
                              {file.name}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 페이지네이션 - 미리보기 모드가 아닐 때만 표시 */}
          {!preview && totalCount > 0 && (
            <div className='mt-6 flex flex-col items-center gap-2'>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                className='shadow-sm'
              />
              <div className='text-sm text-gray-11'>
                총 {totalCount}개 중 {(currentPage - 1) * itemsPerPage + 1}-
                {Math.min(currentPage * itemsPerPage, totalCount)}개 표시
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
