'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import {
  MessageCircle,
  CheckCircle,
  Loader2,
  Plus,
  ArrowRightLeft,
  Calendar,
  FileText,
  Send,
  User,
  Users,
} from 'lucide-react';
import Pagination from '@/components/Pagination';

const PAGE_SIZE = 10;

export default function Inquiry({ user, preview = false, onTabChange }) {
  const [activeTab, setActiveTab] = useState('ongoing'); // "ongoing" / "closed" 등
  const [inquiries, setInquiries] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(4);
  const [counts, setCounts] = useState({
    ongoing: 0,
    closed: 0,
  });
  const [expandedInquiry, setExpandedInquiry] = useState(null);
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedCommentText, setEditedCommentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchInquiryCounts = async () => {
    if (!user) {
      console.log('사용자 정보가 없어 문의 카운트를 가져올 수 없습니다.');
      return;
    }

    console.log('문의 카운트 로드 시작:', user.id);

    try {
      // 진행 중인 문의 개수
      let ongoingQuery = supabase.from('assignment_inquiries').select('id', { count: 'exact' }).eq('status', 'ongoing');

      // 종료된 문의 개수
      let closedQuery = supabase.from('assignment_inquiries').select('id', { count: 'exact' }).eq('status', 'closed');

      // 역할에 따른 필터링
      if (user.role === 'admin') {
        // 관리자: 모든 문의 조회(필터 없음)
        console.log('관리자 역할: 모든 문의 카운트 조회');
      } else if (user.role === 'staff') {
        // 스탭: 담당자로 설정된 의뢰에 속한 문의만
        console.log('스태프 역할: 담당 의뢰 문의 카운트 조회');
        const { data: assignees } = await supabase
          .from('assignment_assignees')
          .select('assignment_id')
          .eq('user_id', user.id);

        const assignmentIds = assignees?.map((a) => a.assignment_id) || [];
        console.log('담당 의뢰 ID 목록:', assignmentIds);

        if (assignmentIds.length > 0) {
          ongoingQuery = ongoingQuery.in('assignment_id', assignmentIds);
          closedQuery = closedQuery.in('assignment_id', assignmentIds);
        }
      } else {
        // 그 외(예: client) → 내가 직접 등록한 문의만
        console.log('일반 사용자 역할: 직접 등록한 문의 카운트 조회');
        ongoingQuery = ongoingQuery.eq('user_id', user.id);
        closedQuery = closedQuery.eq('user_id', user.id);
      }

      const [ongoingResult, closedResult] = await Promise.all([ongoingQuery, closedQuery]);

      const ongoingCount = ongoingResult.count || 0;
      const closedCount = closedResult.count || 0;

      console.log('문의 카운트 결과:', { ongoing: ongoingCount, closed: closedCount });

      setCounts({
        ongoing: ongoingCount,
        closed: closedCount,
      });
    } catch (err) {
      console.error('문의 카운트 조회 오류:', err);
    }
  };

  const fetchInquiries = async () => {
    if (!user) {
      console.log('사용자 정보가 없어 문의 목록을 가져올 수 없습니다.');
      return;
    }

    console.log('문의 목록 로드 시작:', user.id, '탭:', activeTab, '페이지:', currentPage);
    setLoading(true);

    try {
      // 초기 쿼리: assignment_inquiries 테이블에서 필요한 컬럼 + 관계식 조회
      let query = supabase
        .from('assignment_inquiries')
        .select(
          `
            id,
            assignment_id,
            user_id,
            inquiry,
            details,
            created_at,
            status,
            title,
            assignment:assignments (
              id,
              description,
              creditors:assignment_creditors (id, name),
              debtors:assignment_debtors (id, name),
              assignment_clients (
                client_id,
                client:users(name)
              ),
              assignment_groups (
                group_id,
                group:groups(name)
              )
            ),
            user:user_id(name)
          `,
          { count: 'exact' }
        )
        .order('created_at', { ascending: false });

      // ───────────────────────────────────
      // (1) 역할(Role)에 따른 필터 로직
      // ───────────────────────────────────
      if (user.role === 'admin') {
        // 관리자: 모든 문의 조회(필터 없음)
        console.log('관리자 역할: 모든 문의 조회');
      } else if (user.role === 'staff') {
        // 스탭: assignment_assignees 에 등록된 '내가 담당자로 설정된' 의뢰에 속한 문의만
        console.log('스태프 역할: 담당 의뢰 문의 조회');
        const { data: assignees, error: assigneeError } = await supabase
          .from('assignment_assignees')
          .select('assignment_id')
          .eq('user_id', user.id);
        if (assigneeError) throw assigneeError;

        const assignmentIds = assignees?.map((a) => a.assignment_id) || [];
        console.log('담당 의뢰 ID 목록:', assignmentIds);

        // assignment_inquiries.assignment_id 가 위 assignmentIds 안에 있는 레코드만 필터
        if (assignmentIds.length > 0) {
          query = query.in('assignment_id', assignmentIds);
        }
      } else {
        // 그 외(예: client) → 내가 직접 등록한 문의만
        console.log('일반 사용자 역할: 직접 등록한 문의 조회');
        query = query.eq('user_id', user.id);
      }

      // ───────────────────────────────────
      // (2) 탭 상태에 따른 필터 로직
      // ───────────────────────────────────
      if (activeTab === 'ongoing') {
        query = query.eq('status', 'ongoing');
        console.log('진행 중인 문의만 필터링');
      } else if (activeTab === 'closed') {
        query = query.eq('status', 'closed');
        console.log('완료된 문의만 필터링');
      }

      // 미리보기 모드일 때는 페이지네이션 없이 첫 itemsPerPage 개만 조회
      if (preview) {
        query = query.eq('status', 'ongoing').limit(itemsPerPage);
        console.log('미리보기 모드: 진행 중인 문의만', itemsPerPage, '개 로드');
      } else {
        // 페이지네이션 적용
        const from = (currentPage - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;
        query = query.range(from, to);
        console.log(`페이지 ${currentPage}, 범위 ${from}-${to} 로드`);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      console.log('문의 로드 완료:', data?.length || 0, '건, 총', count, '건');

      setInquiries(data || []);
      setTotalCount(count || 0);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));

      // 탭 카운트 업데이트
      fetchInquiryCounts();
    } catch (err) {
      console.error('문의 조회 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  // 댓글 목록 조회
  const fetchComments = async (inquiryId) => {
    try {
      const { data, error } = await supabase
        .from('assignment_inquiry_comments')
        .select(
          `
          id,
          inquiry_id,
          user_id,
          comment,
          created_at,
          user:user_id(name)
        `
        )
        .eq('inquiry_id', inquiryId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setComments((prev) => ({
        ...prev,
        [inquiryId]: data || [],
      }));
    } catch (err) {
      console.error('댓글 조회 오류:', err);
    }
  };

  // 문의 선택 및 댓글 로드
  const handleExpandInquiry = (inquiryId) => {
    // 같은 문의를 두 번 클릭하면 닫기
    if (expandedInquiry === inquiryId) {
      setExpandedInquiry(null);
      return;
    }

    setExpandedInquiry(inquiryId);

    // 댓글이 아직 로드되지 않았거나 확장된 경우에만 로드
    if (!comments[inquiryId]) {
      fetchComments(inquiryId);
    }
  };

  // 댓글 작성
  const handleCommentSubmit = async (inquiryId) => {
    if (!newComment.trim() || !user?.id) return;
    setSubmittingComment(true);

    try {
      const newCommentData = {
        inquiry_id: inquiryId,
        user_id: user.id,
        comment: newComment,
      };

      const { data, error } = await supabase
        .from('assignment_inquiry_comments')
        .insert(newCommentData)
        .select(
          `
          id,
          inquiry_id,
          user_id,
          comment,
          created_at,
          user:user_id(name)
        `
        )
        .single();

      if (error) throw error;

      // 로컬 상태 업데이트
      setComments((prev) => ({
        ...prev,
        [inquiryId]: [...(prev[inquiryId] || []), data],
      }));

      // 입력 필드 초기화
      setNewComment('');
    } catch (err) {
      console.error('댓글 작성 오류:', err);
      alert('댓글 작성 중 오류가 발생했습니다.');
    } finally {
      setSubmittingComment(false);
    }
  };

  // 종료(완료) 처리
  const handleCloseInquiry = async (inquiryId) => {
    if (!window.confirm('정말로 종료(완료) 처리하시겠습니까?')) return;

    try {
      // Optimistic UI 업데이트
      const inquiryIndex = inquiries.findIndex((inquiry) => inquiry.id === inquiryId);
      if (inquiryIndex === -1) return;

      const updatedInquiries = [...inquiries];
      updatedInquiries[inquiryIndex] = {
        ...updatedInquiries[inquiryIndex],
        status: 'closed',
      };

      setInquiries(updatedInquiries);

      const { error } = await supabase.from('assignment_inquiries').update({ status: 'closed' }).eq('id', inquiryId);

      if (error) throw error;

      alert('문의가 완료 처리되었습니다.');
      fetchInquiries(); // 목록 재조회
    } catch (err) {
      console.error(err);
      alert('문의 완료 처리 중 오류가 발생했습니다.');
    }
  };

  // 진행 중으로 변경
  const handleReopenInquiry = async (inquiryId) => {
    if (!window.confirm('정말로 이 문의를 진행 중으로 변경하시겠습니까?')) return;

    try {
      // Optimistic UI 업데이트
      const inquiryIndex = inquiries.findIndex((inquiry) => inquiry.id === inquiryId);
      if (inquiryIndex === -1) return;

      const updatedInquiries = [...inquiries];
      updatedInquiries[inquiryIndex] = {
        ...updatedInquiries[inquiryIndex],
        status: 'ongoing',
      };

      setInquiries(updatedInquiries);

      const { error } = await supabase.from('assignment_inquiries').update({ status: 'ongoing' }).eq('id', inquiryId);

      if (error) throw error;

      alert('문의가 진행 중으로 변경되었습니다.');
      fetchInquiries(); // 목록 재조회
    } catch (err) {
      console.error(err);
      alert('문의 상태 변경 중 오류가 발생했습니다.');
    }
  };

  // 페이지당 항목 수 변경 처리
  const handleItemsPerPageChange = (e) => {
    const newItemsPerPage = parseInt(e.target.value, 10);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // 탭 변경
  const handleTabChange = (tab) => {
    if (tab === 'ongoing' || tab === 'closed') {
      setActiveTab(tab);
      setCurrentPage(1);
    } else if (onTabChange) {
      // 상위 컴포넌트의 탭 변경 함수 호출
      onTabChange(tab);
    } else if (typeof window !== 'undefined') {
      // 부모 컴포넌트에서 함수를 전달받지 않은 경우 URL로 이동
      window.location.href = '/tasks?tab=' + tab;
    }
  };

  // 새 문의 등록 모달 열기
  const handleOpenInquiryModal = () => {
    alert('문의 등록 기능을 구현해주세요.');
  };

  // 날짜 포맷 함수
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // 댓글 수정 모드 활성화
  const handleEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditedCommentText(comment.comment);
  };

  // 댓글 수정 취소
  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditedCommentText('');
  };

  // 댓글 수정 저장
  const handleSaveEdit = async (inquiryId, commentId) => {
    if (!editedCommentText.trim()) return;

    try {
      // Optimistic UI 업데이트
      const updatedComments = comments[inquiryId].map((comment) =>
        comment.id === commentId ? { ...comment, comment: editedCommentText } : comment
      );

      setComments({
        ...comments,
        [inquiryId]: updatedComments,
      });

      // 수정 모드 종료
      setEditingCommentId(null);
      setEditedCommentText('');

      // 데이터베이스 업데이트
      const { error } = await supabase
        .from('assignment_inquiry_comments')
        .update({ comment: editedCommentText })
        .eq('id', commentId)
        .eq('user_id', user.id); // 본인 작성 댓글만 수정 가능

      if (error) throw error;
    } catch (err) {
      console.error('댓글 수정 오류:', err);
      alert('댓글 수정 중 오류가 발생했습니다.');
      // 오류 발생 시 원래 상태로 복원하기 위해 댓글 다시 조회
      fetchComments(inquiryId);
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async (inquiryId, commentId) => {
    if (!window.confirm('정말로 이 댓글을 삭제하시겠습니까?')) return;

    setIsDeleting(true);

    try {
      // Optimistic UI 업데이트
      const updatedComments = comments[inquiryId].filter((comment) => comment.id !== commentId);

      setComments({
        ...comments,
        [inquiryId]: updatedComments,
      });

      // 데이터베이스에서 삭제
      const { error } = await supabase
        .from('assignment_inquiry_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id); // 본인 작성 댓글만 삭제 가능

      if (error) throw error;
    } catch (err) {
      console.error('댓글 삭제 오류:', err);
      alert('댓글 삭제 중 오류가 발생했습니다.');
      // 오류 발생 시 원래 상태로 복원하기 위해 댓글 다시 조회
      fetchComments(inquiryId);
    } finally {
      setIsDeleting(false);
    }
  };

  // 댓글 작성자가 현재 사용자인지 확인
  const isCommentAuthor = (comment) => {
    return comment.user_id === user?.id;
  };

  useEffect(() => {
    if (user) {
      fetchInquiries();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentPage, itemsPerPage, user?.id]);

  // 미리보기 탭이 변경될 때도 데이터를 다시 로드
  useEffect(() => {
    if (user && preview) {
      fetchInquiries();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview, user?.id]);

  // 클라이언트 이름 목록 조회
  const getClientNames = (inquiry) => {
    if (!inquiry.assignment?.assignment_clients?.length) return '의뢰인 정보 없음';

    return inquiry.assignment.assignment_clients.map((client) => client.client.name).join(', ');
  };

  // 그룹 이름 목록 조회
  const getGroupNames = (inquiry) => {
    if (!inquiry.assignment?.assignment_groups?.length) return '그룹 정보 없음';

    return inquiry.assignment.assignment_groups.map((group) => group.group.name).join(', ');
  };

  // 채권자 이름 목록 조회
  const getCreditorNames = (inquiry) => {
    if (!inquiry.assignment?.creditors?.length) return '채권자 정보 없음';

    return inquiry.assignment.creditors.map((creditor) => creditor.name).join(', ');
  };

  // 채무자 이름 목록 조회
  const getDebtorNames = (inquiry) => {
    if (!inquiry.assignment?.debtors?.length) return '채무자 정보 없음';

    return inquiry.assignment.debtors.map((debtor) => debtor.name).join(', ');
  };

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
            onClick={() => handleTabChange('ongoing')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'ongoing' ? 'text-blue-9 border-b-2 border-blue-9' : 'text-gray-11 hover:text-gray-12'
            }`}
          >
            진행 중
          </button>
          <button
            onClick={() => handleTabChange('closed')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'closed' ? 'text-blue-9 border-b-2 border-blue-9' : 'text-gray-11 hover:text-gray-12'
            }`}
          >
            종료(완료)
          </button>
        </div>
      )}

      {/* 로딩 상태 */}
      {loading ? (
        <div className='flex items-center justify-center py-12'>
          <Loader2 size={24} className='animate-spin text-gray-400 mr-2' />
          <span className='text-gray-500'>데이터를 불러오는 중...</span>
        </div>
      ) : (
        <>
          {/* 문의 목록 */}
          {inquiries.length === 0 ? (
            <div className='p-4 bg-gray-3 dark:bg-gray-4 rounded-lg text-gray-11 text-center'>
              등록된 문의가 없습니다.
            </div>
          ) : (
            <div className={`grid grid-cols-1 ${!preview ? 'md:grid-cols-2' : ''} gap-4`}>
              {inquiries.map((inquiry) => (
                <div
                  key={inquiry.id}
                  className='p-4 bg-slate-2 dark:bg-slate-3 border border-slate-4 dark:border-slate-5 rounded-lg space-y-2 shadow-sm hover:shadow-md transition-all'
                >
                  {/* 상단 정보 및 버튼 */}
                  <div className='flex justify-between items-start'>
                    <div>
                      {/* 상태 표시 */}
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          inquiry.status === 'closed' ? 'bg-green-3 text-green-11' : 'bg-orange-3 text-orange-11'
                        }`}
                      >
                        {inquiry.status === 'closed' ? '완료' : '진행 중'}
                      </span>
                    </div>

                    {/* 작업 버튼 */}
                    <div className='flex gap-2'>
                      {inquiry.status === 'ongoing' ? (
                        <button
                          onClick={() => handleCloseInquiry(inquiry.id)}
                          className='px-3 py-1 bg-green-9 hover:bg-green-10 text-white text-sm rounded'
                        >
                          완료
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReopenInquiry(inquiry.id)}
                          className='px-3 py-1 bg-orange-9 hover:bg-orange-10 text-white text-sm rounded'
                        >
                          진행 중으로 변경
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 채권자/채무자 정보 */}
                  <div className='mt-2'>
                    {inquiry.assignment ? (
                      <div className='flex flex-col gap-1'>
                        <div className='flex items-center gap-1 text-sm text-gray-11'>
                          <span className='font-medium'>채권자:</span>{' '}
                          <span className='text-gray-11'>{getCreditorNames(inquiry)}</span>
                        </div>
                        <div className='flex items-center gap-1 text-sm text-gray-11'>
                          <span className='font-medium'>채무자:</span>{' '}
                          <span className='text-gray-11'>{getDebtorNames(inquiry)}</span>
                        </div>
                      </div>
                    ) : (
                      <p className='text-sm italic text-gray-11'>의뢰 정보 없음</p>
                    )}
                  </div>

                  {/* 문의 내용 - Task.jsx와 비슷한 스타일 */}
                  <div className='mt-3 p-3 bg-slate-3 dark:bg-slate-4 rounded-md'>
                    <p className='text-sm text-gray-12 whitespace-pre-wrap'>{inquiry.title}</p>
                  </div>

                  {/* 하단 정보 */}
                  <div className='mt-3 pt-2 border-t border-slate-4'>
                    <div className='flex justify-between text-sm text-gray-11'>
                      <div className='flex items-center gap-1 text-sm text-gray-11'>
                        <Calendar size={14} />
                        <span>등록일: {new Date(inquiry.created_at).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className='font-medium'>문의자:</span>{' '}
                        <span className='text-gray-12'>{inquiry.user?.name || '알 수 없음'}</span>
                      </div>
                    </div>
                  </div>

                  {/* 댓글 버튼 */}
                  <div className='mt-3 text-center'>
                    <button
                      onClick={() => handleExpandInquiry(inquiry.id)}
                      className='inline-flex items-center gap-1 px-3 py-1 bg-gray-3 hover:bg-gray-4 text-gray-12 text-sm rounded transition-colors'
                    >
                      <MessageCircle size={16} />
                      {expandedInquiry === inquiry.id ? '댓글 접기' : '댓글 보기'}
                      {comments[inquiry.id]?.length > 0 && (
                        <span className='ml-1 px-1.5 py-0.5 bg-blue-3 text-blue-11 text-xs rounded-full'>
                          {comments[inquiry.id].length}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* 댓글 섹션 */}
                  {expandedInquiry === inquiry.id && (
                    <div className='mt-4 pt-3 border-t border-slate-4'>
                      <h4 className='text-sm font-medium text-gray-12 mb-2 flex items-center'>
                        <MessageCircle size={16} className='mr-1' />
                        댓글
                      </h4>

                      {/* 댓글 목록 */}
                      <div className='space-y-3 mb-3'>
                        {!comments[inquiry.id] ? (
                          <div className='flex items-center justify-center py-3'>
                            <Loader2 size={16} className='animate-spin text-gray-400 mr-2' />
                            <span className='text-sm text-gray-500'>댓글을 불러오는 중...</span>
                          </div>
                        ) : comments[inquiry.id].length === 0 ? (
                          <div className='py-2 text-center text-sm text-gray-11'>첫 댓글을 작성해보세요.</div>
                        ) : (
                          comments[inquiry.id].map((comment) => (
                            <div key={comment.id} className='p-2 bg-slate-3 dark:bg-slate-4 rounded-md'>
                              <div className='flex justify-between text-xs text-gray-11 mb-1'>
                                <span className='font-medium text-gray-12'>{comment.user?.name || '알 수 없음'}</span>
                                <span>{formatDate(comment.created_at)}</span>
                              </div>

                              {editingCommentId === comment.id ? (
                                // 수정 모드
                                <div className='space-y-2'>
                                  <textarea
                                    value={editedCommentText}
                                    onChange={(e) => setEditedCommentText(e.target.value)}
                                    className='w-full p-2 bg-gray-3 border border-gray-6 rounded-md text-sm text-gray-12 placeholder-gray-11 focus:outline-none focus:border-blue-9 min-h-[60px] resize-none'
                                  />
                                  <div className='flex justify-end gap-2'>
                                    <button
                                      onClick={handleCancelEdit}
                                      className='px-2 py-1 bg-gray-5 hover:bg-gray-6 text-gray-12 text-xs rounded'
                                    >
                                      취소
                                    </button>
                                    <button
                                      onClick={() => handleSaveEdit(inquiry.id, comment.id)}
                                      className='px-2 py-1 bg-blue-9 hover:bg-blue-10 text-white text-xs rounded'
                                    >
                                      저장
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                // 일반 모드
                                <div>
                                  <p className='text-sm text-gray-12 whitespace-pre-wrap'>{comment.comment}</p>

                                  {isCommentAuthor(comment) && (
                                    <div className='flex justify-end gap-2 mt-1'>
                                      <button
                                        onClick={() => handleEditComment(comment)}
                                        className='px-2 py-0.5 bg-blue-8 hover:bg-blue-5 text-gray-12 text-xs rounded'
                                        disabled={isDeleting}
                                      >
                                        수정
                                      </button>
                                      <button
                                        onClick={() => handleDeleteComment(inquiry.id, comment.id)}
                                        className='px-2 py-0.5 bg-red-9 hover:bg-red-10 text-white text-xs rounded'
                                        disabled={isDeleting}
                                      >
                                        삭제
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      {/* 댓글 작성 폼 */}
                      <div className='flex gap-2 mt-3'>
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder='댓글을 작성하세요...'
                          className='flex-grow p-2 bg-gray-3 border border-gray-6 rounded-md text-sm text-gray-12 placeholder-gray-11 focus:outline-none focus:border-blue-9 min-h-[80px] resize-none'
                        />
                        <button
                          onClick={() => handleCommentSubmit(inquiry.id)}
                          disabled={submittingComment || !newComment.trim()}
                          className='px-3 py-2 bg-blue-9 hover:bg-blue-10 text-white text-sm rounded-md disabled:opacity-50 disabled:cursor-not-allowed self-end flex items-center'
                        >
                          {submittingComment ? (
                            <Loader2 size={16} className='animate-spin' />
                          ) : (
                            <>
                              <Send size={16} className='mr-1' />
                              등록
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 미리보기 모드에서 더 보기 버튼 */}
          {preview && inquiries.length > 0 && totalCount > itemsPerPage && (
            <div className='mt-4 text-center'>
              <button
                onClick={() => handleTabChange('inquiries')}
                className='inline-flex items-center px-4 py-2 text-sm text-purple-11 hover:text-purple-9 transition-colors'
              >
                <svg
                  width='15'
                  height='15'
                  viewBox='0 0 15 15'
                  fill='none'
                  xmlns='http://www.w3.org/2000/svg'
                  className='mr-2'
                >
                  <path
                    d='M7.49991 0.876892C3.84222 0.876892 0.877075 3.84204 0.877075 7.49972C0.877075 11.1574 3.84222 14.1226 7.49991 14.1226C11.1576 14.1226 14.1227 11.1574 14.1227 7.49972C14.1227 3.84204 11.1576 0.876892 7.49991 0.876892ZM1.82707 7.49972C1.82707 4.36671 4.36689 1.82689 7.49991 1.82689C10.6329 1.82689 13.1727 4.36671 13.1727 7.49972C13.1727 10.6327 10.6329 13.1726 7.49991 13.1726C4.36689 13.1726 1.82707 10.6327 1.82707 7.49972ZM7.50003 4C7.77617 4 8.00003 4.22386 8.00003 4.5V7H10.0001C10.2762 7 10.5001 7.22386 10.5001 7.5C10.5001 7.77614 10.2762 8 10.0001 8H7.50003C7.22389 8 7.00003 7.77614 7.00003 7.5V4.5C7.00003 4.22386 7.22389 4 7.50003 4Z'
                    fill='currentColor'
                    fillRule='evenodd'
                    clipRule='evenodd'
                  ></path>
                </svg>
                모든 문의 보기 ({totalCount}건)
              </button>
            </div>
          )}

          {/* 페이지네이션 - 미리보기 모드가 아닐 때만 표시 */}
          {totalCount > 0 && !preview && (
            <div className='mt-6 flex flex-col items-center gap-2'>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
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
