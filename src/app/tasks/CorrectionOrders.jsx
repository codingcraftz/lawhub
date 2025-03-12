import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Upload, FileText, Calendar, X, Search } from 'lucide-react';
import { format, differenceInDays, addDays, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { supabase } from '@/utils/supabase';
import FileUploadDropZone from '@/components/FileUploadDropZone';
import Pagination from '@/components/Pagination';

// 스토리지 버킷 이름 (Supabase 대시보드에서 생성한 버킷 이름과 일치해야 함)
const STORAGE_BUCKET = 'documents';

export default function CorrectionOrders({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  const [caseNumber, setCaseNumber] = useState('');
  const [content, setContent] = useState('');
  const [arrivalDate, setArrivalDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [files, setFiles] = useState([]);

  const [correctionOrders, setCorrectionOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const [activeTab, setActiveTab] = useState('all'); // 'all', 'pending', 'completed'

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(4); // 페이지당 항목 수

  // 날짜 입력 참조
  const dueDateInputRef = useRef(null);

  // 보정명령 목록 불러오기: useCallback으로 감싸고, currentPage/activeTab/itemsPerPage 변경 시 새로 호출
  const fetchCorrectionOrders = useCallback(async () => {
    try {
      console.log('보정명령 데이터 로드 시작:', user?.id, '역할:', user?.role);

      // 1) 보정명령 전체 개수 확인을 위한 초기 쿼리
      let countQuery = supabase.from('correction_orders').select('id', { count: 'exact', head: true });

      // 2) 실제 데이터 조회를 위한 초기 쿼리
      let query = supabase.from('correction_orders').select(
        `
            *,
            assignment:assignments (
              id,
              description,
              creditors:assignment_creditors (id, name),
              debtors:assignment_debtors (id, name)
            ),
            files:correction_order_files (*)
          `
      );

      // 상태(activeTab)에 따른 필터링
      if (activeTab !== 'all') {
        countQuery = countQuery.eq('status', activeTab);
        query = query.eq('status', activeTab);
      }

      // 사용자 역할에 따른 필터링
      if (user?.role === 'staff') {
        console.log('스태프 역할: 담당 의뢰의 보정명령만 조회');
        // 스태프인 경우 담당하는 의뢰의 보정명령만 조회
        const { data: assigneeData, error: assigneeError } = await supabase
          .from('assignment_assignees')
          .select('assignment_id')
          .eq('user_id', user.id);

        if (assigneeError) {
          console.error('담당 의뢰 목록 조회 오류:', assigneeError);
          return;
        }

        if (assigneeData && assigneeData.length > 0) {
          const assignmentIds = assigneeData.map((item) => item.assignment_id);
          console.log('담당 의뢰 ID 목록:', assignmentIds);

          // 담당 의뢰 ID를 기준으로 보정명령 필터링
          countQuery = countQuery.in('assignment_id', assignmentIds);
          query = query.in('assignment_id', assignmentIds);
        } else {
          console.log('담당 의뢰가 없습니다.');
          setCorrectionOrders([]);
          setTotalCount(0);
          setTotalPages(0);
          return;
        }
      } else if (user?.role === 'admin') {
        console.log('관리자 역할: 모든 보정명령 조회');
        // 관리자는 모든 보정명령 조회 (추가 필터 없음)
      } else {
        console.log('일반 사용자: 자신의 의뢰와 관련된 보정명령만 조회해야 함');
        // 여기에 일반 사용자(client)를 위한 필터링 로직 추가 필요
        // 현재는 구현되어 있지 않은 것 같으므로 일단 빈 배열 반환
        setCorrectionOrders([]);
        setTotalCount(0);
        setTotalPages(0);
        return;
      }

      // 카운트 쿼리 실행
      const { count, error: countError } = await countQuery;
      if (countError) {
        console.error('보정명령 개수 조회 오류:', countError);
        return;
      }

      setTotalCount(count || 0);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
      console.log('보정명령 총 개수:', count);

      // 페이지네이션
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      // 정렬: (1) status 내림차순(pending 먼저, completed 나중), (2) due_date 오름차순
      query = query.order('status', { ascending: false }).order('due_date', { ascending: true }).range(from, to);

      // 최종 데이터 쿼리 실행
      const { data, error } = await query;
      if (error) {
        console.error('보정명령 조회 오류:', error);
        return;
      }

      console.log('보정명령 데이터 로드 완료:', data?.length || 0, '건');

      // 파일 URL 처리
      const processedData = (data || []).map((order) => {
        const file_urls = [];
        if (order.files && order.files.length > 0) {
          order.files.forEach((file) => {
            const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(file.file_path);
            if (urlData && urlData.publicUrl) {
              file_urls.push({
                url: urlData.publicUrl,
                name: file.display_name || file.file_name || file.file_path.split('/').pop(),
              });
            }
          });
        }
        return {
          ...order,
          status: order.status || 'pending',
          file_urls,
        };
      });

      setCorrectionOrders(processedData);
    } catch (err) {
      console.error('fetchCorrectionOrders 오류:', err);
    }
  }, [currentPage, activeTab, itemsPerPage, user?.id, user?.role]);

  // useEffect로 보정명령 목록 불러오기
  useEffect(() => {
    fetchCorrectionOrders();
  }, [fetchCorrectionOrders]);

  // 의뢰 검색 함수
  const searchAssignments = async () => {
    if (!searchTerm.trim()) {
      setAssignments([]);
      return;
    }

    setSearchLoading(true);
    try {
      // 1) 채권자 이름으로 검색
      const { data: creditorAssignments, error: creditorError } = await supabase
        .from('assignment_creditors')
        .select(
          `
          id,
          name,
          assignment_id
        `
        )
        .ilike('name', `%${searchTerm}%`);

      if (creditorError) throw creditorError;

      // 2) 채무자 이름으로 검색
      const { data: debtorAssignments, error: debtorError } = await supabase
        .from('assignment_debtors')
        .select(
          `
          id,
          name,
          assignment_id
        `
        )
        .ilike('name', `%${searchTerm}%`);

      if (debtorError) throw debtorError;

      // 의뢰 ID 목록 합치기
      const assignmentIds = [
        ...new Set([
          ...creditorAssignments.map((c) => c.assignment_id),
          ...debtorAssignments.map((d) => d.assignment_id),
        ]),
      ];

      if (assignmentIds.length === 0) {
        setAssignments([]);
        setSearchLoading(false);
        return;
      }

      // 3) 의뢰 상세 조회
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select(
          `
          id,
          description,
          creditors:assignment_creditors (id, name),
          debtors:assignment_debtors (id, name)
        `
        )
        .in('id', assignmentIds);

      if (assignmentsError) throw assignmentsError;

      // 검색 결과 가공
      const processedAssignments = assignmentsData.map((assignment) => {
        const creditorNames = assignment.creditors?.length
          ? assignment.creditors.map((c) => c.name).join(', ')
          : '채권자 정보 없음';
        const debtorNames = assignment.debtors?.length
          ? assignment.debtors.map((d) => d.name).join(', ')
          : '채무자 정보 없음';

        return {
          ...assignment,
          creditorNames,
          debtorNames,
        };
      });

      setAssignments(processedAssignments);
    } catch (error) {
      console.error('의뢰 검색 오류:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  // 검색어 입력 핸들러
  const handleSearchTermChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // 검색 버튼 클릭
  const handleSearchClick = () => {
    searchAssignments();
  };

  // 검색 인풋에서 Enter 키 입력
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchAssignments();
    }
  };

  // 도착일 변경 시 자동으로 보정기한(7일 후) 설정
  const handleArrivalDateChange = (e) => {
    const selectedDate = e.target.value;
    setArrivalDate(selectedDate);

    if (selectedDate) {
      try {
        const arrivalDateObj = parseISO(selectedDate);
        const dueDateObj = addDays(arrivalDateObj, 7);
        const dueDateStr = format(dueDateObj, 'yyyy-MM-dd');
        setDueDate(dueDateStr);

        if (dueDateInputRef.current) {
          dueDateInputRef.current.value = dueDateStr;
        }
      } catch (error) {
        console.error('날짜 계산 오류:', error);
      }
    } else {
      setDueDate('');
      if (dueDateInputRef.current) {
        dueDateInputRef.current.value = '';
      }
    }
  };

  // DropZone으로 파일 업로드
  const handleFileDrop = (acceptedFiles) => {
    setFiles([...files, ...acceptedFiles]);
    setUploadError(null);
  };

  // 개별 파일 삭제
  const handleFileRemove = (index) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  // 보정명령 등록
  const handleSubmit = async () => {
    if (!selectedAssignment || !caseNumber || !content || !arrivalDate || !dueDate) {
      alert('필수 항목(의뢰, 사건번호, 내용, 도착일, 보정기한)을 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    setUploadError(null);

    try {
      const formattedArrivalDate = format(parseISO(arrivalDate), 'yyyy-MM-dd');
      const formattedDueDate = format(parseISO(dueDate), 'yyyy-MM-dd');

      // 1) 보정명령 테이블에 등록
      const { data: correctionOrder, error: correctionError } = await supabase
        .from('correction_orders')
        .insert({
          assignment_id: selectedAssignment.id,
          case_number: caseNumber,
          content,
          arrival_date: formattedArrivalDate,
          due_date: formattedDueDate,
        })
        .select()
        .single();

      if (correctionError) throw correctionError;

      // 2) 첨부파일 업로드
      if (files.length > 0) {
        for (const file of files) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `${correctionOrder.id}/${fileName}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: true,
            });

          if (uploadError) {
            throw new Error(`파일 업로드 실패: ${uploadError.message}`);
          }

          // 업로드된 파일의 공개 URL
          const { data: publicUrlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

          // 화면 표시용 이름: 사건번호_채무자이름(채권자이름)
          const firstCreditorName = selectedAssignment.creditors?.[0]?.name ?? '채권자없음';
          const firstDebtorName = selectedAssignment.debtors?.[0]?.name ?? '채무자없음';
          const displayName = `${caseNumber}_${firstDebtorName}(${firstCreditorName})`;

          // 파일 메타정보 등록
          const { error: fileError } = await supabase.from('correction_order_files').insert({
            correction_order_id: correctionOrder.id,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            file_type: file.type,
            display_name: displayName,
          });

          if (fileError) {
            throw new Error(`파일 정보 저장 실패: ${fileError.message}`);
          }
        }
      }

      // 등록 후 상태 초기화
      setIsOpen(false);
      setSelectedAssignment(null);
      setCaseNumber('');
      setContent('');
      setArrivalDate('');
      setDueDate('');
      setFiles([]);

      // 새 목록 불러오기
      fetchCorrectionOrders();

      alert('보정명령이 성공적으로 등록되었습니다.');
    } catch (error) {
      console.error('보정명령 등록 오류:', error);
      setUploadError(error.message);

      let errorMessage = `보정명령 등록 중 오류가 발생했습니다: ${error.message}`;
      if (error.message.includes('storage') || error.message.includes('bucket') || error.message.includes('upload')) {
        errorMessage += '\n\n다음 사항을 확인해 주세요:\n';
        errorMessage += '1. Supabase 대시보드에서 "documents" 버킷이 생성되어 있는지\n';
        errorMessage += '2. 버킷이 Public으로 설정되어 있거나 적절한 RLS 정책이 있는지\n';
        errorMessage += '3. 파일 크기가 제한(일반적으로 50MB 이하)을 넘지 않는지\n';
        errorMessage += '4. 파일 형식이 허용되는지\n';
      }
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // D-day 계산
  const calculateDday = (dueDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    return differenceInDays(due, today);
  };

  // 날짜 포맷 (타임존 문제 최소화)
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'yyyy-MM-dd');
    } catch (error) {
      console.error('날짜 포맷 오류:', error);
      return dateString;
    }
  };

  // 모달 열기
  const handleOpenModal = () => {
    setIsOpen(true);
    setSelectedAssignment(null);
    setCaseNumber('');
    setContent('');
    setArrivalDate('');
    setDueDate('');
    setFiles([]);
    setUploadError(null);
  };

  // 보정명령 삭제
  const handleDelete = async (id) => {
    if (!confirm('정말로 이 보정명령을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const orderToDelete = correctionOrders.find((order) => order.id === id);
      setCorrectionOrders((prev) => prev.filter((order) => order.id !== id));

      alert('보정명령이 삭제되었습니다.');

      // 1) 연결된 파일 정보 조회
      const { data: fileData, error: fileQueryError } = await supabase
        .from('correction_order_files')
        .select('*')
        .eq('correction_order_id', id);

      if (fileQueryError) {
        // UI 복원
        setCorrectionOrders((prev) => [...prev, orderToDelete]);
        throw fileQueryError;
      }

      // 2) 스토리지에서 파일 삭제
      if (fileData?.length) {
        for (const file of fileData) {
          const { error: storageError } = await supabase.storage.from(STORAGE_BUCKET).remove([file.file_path]);
          if (storageError) {
            console.error('파일 삭제 오류:', storageError);
          }
        }
      }

      // 3) 파일 정보 삭제
      if (fileData?.length) {
        const { error: fileDeleteError } = await supabase
          .from('correction_order_files')
          .delete()
          .eq('correction_order_id', id);

        if (fileDeleteError) {
          console.error('파일 정보 삭제 오류:', fileDeleteError);
        }
      }

      // 4) 보정명령 삭제
      const { error: orderDeleteError } = await supabase.from('correction_orders').delete().eq('id', id);
      if (orderDeleteError) {
        // UI 복원
        setCorrectionOrders((prev) => [...prev, orderToDelete]);
        throw orderDeleteError;
      }

      // 페이지네이션 갱신
      if (correctionOrders.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        fetchCorrectionOrders();
      }
    } catch (error) {
      console.error('삭제 오류:', error);
      alert(`삭제 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  // 상태 변경 (pending ↔ completed)
  const handleStatusChange = async (id, newStatus) => {
    if (newStatus === 'completed') {
      if (!confirm('이 보정명령을 완료 처리하시겠습니까?')) {
        return;
      }
    } else {
      if (!confirm('이 보정명령을 진행 중으로 변경하시겠습니까?')) {
        return;
      }
    }

    try {
      const orderIndex = correctionOrders.findIndex((order) => order.id === id);
      if (orderIndex === -1) return;

      const orderToUpdate = correctionOrders[orderIndex];
      const updateData = { status: newStatus };

      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      } else {
        updateData.completed_at = null;
      }

      // Optimistic UI
      const updatedOrder = { ...orderToUpdate, ...updateData };
      const newOrders = [...correctionOrders];
      newOrders[orderIndex] = updatedOrder;

      // 진행 중 먼저, 완료 뒤에 정렬
      const sortedOrders = newOrders.sort((a, b) => {
        if (a.status !== b.status) {
          return a.status === 'completed' ? 1 : -1;
        }
        return new Date(a.due_date) - new Date(b.due_date);
      });
      setCorrectionOrders(sortedOrders);

      alert(newStatus === 'completed' ? '보정명령이 완료 처리되었습니다.' : '보정명령이 진행 중으로 변경되었습니다.');

      // 서버에 업데이트
      const { error } = await supabase.from('correction_orders').update(updateData).eq('id', id);
      if (error) {
        // 실패 시 롤백
        const restoredOrders = [...correctionOrders];
        restoredOrders[orderIndex] = orderToUpdate;
        setCorrectionOrders(restoredOrders);
        throw error;
      }

      // 상태 변경 후 재조회
      fetchCorrectionOrders();
    } catch (error) {
      console.error('상태 변경 오류:', error);
      alert(`상태 변경 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  // 페이지 변경
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // 페이지당 항목 수 변경
  const handleItemsPerPageChange = (e) => {
    const newItemsPerPage = parseInt(e.target.value, 10);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  return (
    <div className='space-y-4'>
      {/* 상단 등록 버튼 및 페이지당 항목 수 선택 */}
      <div className='flex justify-between items-center'>
        <button
          onClick={handleOpenModal}
          className='flex items-center gap-2 px-4 py-2 bg-blue-9 hover:bg-blue-10 rounded-md transition-colors'
        >
          <Plus size={16} />
          보정명령 등록
        </button>

        <div className='flex items-center gap-2'>
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

      {/* 상태 탭 */}
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

      {/* 보정명령 목록 */}
      <div className='space-y-4'>
        {correctionOrders.length === 0 ? (
          <div className='p-4 bg-gray-3 dark:bg-gray-4 rounded-lg text-gray-11 text-center'>
            등록된 보정명령이 없습니다.
          </div>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            {correctionOrders.map((order) => {
              const dday = calculateDday(order.due_date);
              return (
                <div
                  key={order.id}
                  className='p-4 bg-slate-2 dark:bg-slate-3 border border-slate-4 dark:border-slate-5 rounded-lg space-y-2 shadow-sm hover:shadow-md transition-all'
                >
                  {/* 상단 정보 */}
                  <div className='flex justify-between items-start'>
                    <div className='flex flex-col gap-1'>
                      {/* D-day */}
                      <div
                        className={`text-sm font-bold ${
                          dday < 0 ? 'text-red-9' : dday < 3 ? 'text-orange-9' : 'text-blue-9'
                        }`}
                      >
                        {dday < 0 ? '기한 만료' : `D-${dday}`}
                      </div>
                      {/* 상태 표시 */}
                      <div className='mt-1'>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            order.status === 'completed' ? 'bg-green-3 text-green-11' : 'bg-orange-3 text-orange-11'
                          }`}
                        >
                          {order.status === 'completed' ? '완료' : '진행 중'}
                        </span>
                        {order.status === 'completed' && order.completed_at && (
                          <span className='ml-2 text-xs text-gray-11'>{formatDate(order.completed_at)} 완료</span>
                        )}
                      </div>
                    </div>

                    {/* 버튼 그룹 */}
                    <div className='flex flex-col gap-1 items-end'>
                      {order.status === 'pending' ? (
                        <button
                          onClick={() => handleStatusChange(order.id, 'completed')}
                          className='px-3 py-1 bg-green-9 hover:bg-green-10 text-white text-sm rounded'
                        >
                          완료
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(order.id, 'pending')}
                          className='px-3 py-1 bg-orange-9 hover:bg-orange-10 text-white text-sm rounded'
                        >
                          진행 중으로 변경
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(order.id)}
                        className='px-3 py-1 bg-red-9 hover:bg-red-10 text-white text-sm rounded'
                      >
                        삭제
                      </button>
                    </div>
                  </div>

                  {/* 사건정보 */}
                  <div className='mt-3'>
                    <h3 className='text-lg font-semibold text-gray-12'>{order.case_number}</h3>
                    <div className='flex flex-col text-sm mt-2 text-gray-11'>
                      <p>
                        <span className='font-medium'>채권자:</span>{' '}
                        {order.assignment?.creditors?.map((c) => c.name).join(', ') || '채권자 정보 없음'}
                      </p>
                      <p>
                        <span className='font-medium'>채무자:</span>{' '}
                        {order.assignment?.debtors?.map((d) => d.name).join(', ') || '채무자 정보 없음'}
                      </p>
                    </div>
                  </div>

                  {/* 날짜 정보 */}
                  <div className='flex gap-4 mt-2 text-sm text-gray-11'>
                    <div className='flex items-center gap-1'>
                      <Calendar size={14} />
                      <span>도착일: {formatDate(order.arrival_date)}</span>
                    </div>
                    <div className='flex items-center gap-1'>
                      <Calendar size={14} />
                      <span>기한: {formatDate(order.due_date)}</span>
                    </div>
                  </div>

                  {/* 보정명령 내용 */}
                  <div className='mt-3 p-3 bg-slate-3 dark:bg-slate-4 rounded-md'>
                    <p className='text-sm text-gray-12 whitespace-pre-wrap'>{order.content}</p>
                  </div>

                  {/* 첨부파일 */}
                  {order.file_urls && order.file_urls.length > 0 && (
                    <div className='mt-2'>
                      <h4 className='text-sm font-medium text-gray-12 mb-1'>첨부파일</h4>
                      {order.file_urls.map((file, index) => (
                        <div key={index} className='flex items-center gap-2 text-sm text-gray-11'>
                          <FileText size={14} />
                          <a
                            href={file.url}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='text-blue-9 hover:text-blue-10 hover:underline'
                          >
                            {file.name}
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 페이지네이션 */}
        {totalCount > 0 && (
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
      </div>

      {/* 모달 (보정명령 등록) */}
      {isOpen && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-gray-2 rounded-lg w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto'>
            {/* 모달 헤더 */}
            <div className='flex justify-between items-center mb-6'>
              <h2 className='text-lg font-semibold text-gray-12'>보정명령 등록</h2>
              <button onClick={() => setIsOpen(false)} className='text-gray-11 hover:text-gray-12 transition-colors'>
                <X size={20} />
              </button>
            </div>

            {/* 모달 내용 */}
            <div className='space-y-4'>
              {/* 당사자 검색 */}
              <div>
                <label className='block text-sm font-medium text-gray-12 mb-1'>
                  당사자 검색 (이름 또는 회사명) <span className='text-red-9'>*</span>
                </label>
                <div className='relative flex'>
                  <div className='relative flex-grow'>
                    <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-11' size={16} />
                    <input
                      type='text'
                      placeholder='이름 또는 회사명으로 검색...'
                      value={searchTerm}
                      onChange={handleSearchTermChange}
                      onKeyDown={handleSearchKeyPress}
                      className='w-full pl-10 pr-4 py-2 bg-gray-3 border border-gray-6 rounded-l-lg text-gray-12 placeholder-gray-11 focus:outline-none focus:border-blue-9'
                    />
                    {searchLoading && (
                      <div className='absolute right-3 top-1/2 transform -translate-y-1/2'>
                        <div className='animate-spin h-4 w-4 border-2 border-blue-9 border-t-transparent rounded-full'></div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleSearchClick}
                    disabled={searchLoading || !searchTerm.trim()}
                    className='px-4 py-2 bg-blue-9 hover:bg-blue-10 disabled:bg-gray-6 text-gray-1 rounded-r-lg transition-colors flex items-center justify-center'
                  >
                    검색
                  </button>
                </div>
              </div>

              {/* 검색 결과 */}
              {assignments.length > 0 && (
                <div className='max-h-60 overflow-y-auto space-y-2 border border-gray-6 rounded-lg p-2'>
                  {assignments.map((assignment) => (
                    <button
                      key={assignment.id}
                      onClick={() => {
                        setSelectedAssignment(assignment);
                        setSearchTerm('');
                        setAssignments([]);
                      }}
                      className='w-full p-3 text-left hover:bg-gray-4 rounded-lg transition-colors border border-gray-5'
                    >
                      <div className='flex flex-col gap-1 mb-1'>
                        <div className='font-medium text-gray-12'>
                          <span className='text-gray-11'>채권자:</span> {assignment.creditorNames}
                        </div>
                        <div className='font-medium text-gray-12'>
                          <span className='text-gray-11'>채무자:</span> {assignment.debtorNames}
                        </div>
                      </div>
                      <div className='text-sm text-gray-11 line-clamp-2'>
                        {assignment.description || '사건 개요 없음'}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searchTerm && assignments.length === 0 && !searchLoading && (
                <div className='p-3 bg-gray-3 rounded-lg text-gray-11 text-center'>검색 결과가 없습니다.</div>
              )}

              {/* 선택된 의뢰 표시 */}
              {selectedAssignment && (
                <div className='p-3 bg-gray-3 rounded-lg border border-blue-9'>
                  <div className='flex flex-col gap-1 mb-1'>
                    <div className='font-medium text-gray-12'>
                      <span className='text-gray-11'>채권자:</span> {selectedAssignment.creditorNames}
                    </div>
                    <div className='font-medium text-gray-12'>
                      <span className='text-gray-11'>채무자:</span> {selectedAssignment.debtorNames}
                    </div>
                  </div>
                  <div className='text-sm text-gray-11'>{selectedAssignment.description || '사건 개요 없음'}</div>
                </div>
              )}

              {/* 사건번호 */}
              <div>
                <label className='block text-sm font-medium text-gray-12 mb-1'>
                  사건번호 <span className='text-red-9'>*</span>
                </label>
                <input
                  type='text'
                  placeholder='예: 2023가단12345'
                  value={caseNumber}
                  onChange={(e) => setCaseNumber(e.target.value)}
                  className='w-full px-4 py-2 bg-gray-3 border border-gray-6 rounded-lg text-gray-12 placeholder-gray-11 focus:outline-none focus:border-blue-9'
                />
              </div>

              {/* 보정명령 내용 */}
              <div>
                <label className='block text-sm font-medium text-gray-12 mb-1'>
                  보정명령 내용 <span className='text-red-9'>*</span>
                </label>
                <textarea
                  placeholder='보정명령 내용을 입력하세요'
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  className='w-full px-4 py-2 bg-gray-3 border border-gray-6 rounded-lg text-gray-12 placeholder-gray-11 focus:outline-none focus:border-blue-9 resize-none'
                />
              </div>

              {/* 날짜 선택 */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-12 mb-1'>
                    보정명령 도착일 <span className='text-red-9'>*</span>
                  </label>
                  <input
                    type='date'
                    value={arrivalDate}
                    onChange={handleArrivalDateChange}
                    className='w-full px-4 py-2 bg-gray-3 border border-gray-6 rounded-lg text-gray-12 focus:outline-none focus:border-blue-9'
                  />
                  <p className='text-xs text-gray-11 mt-1'>
                    도착일을 선택하면 보정기한이 자동으로 7일 후로 설정됩니다.
                  </p>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-12 mb-1'>
                    보정기한 <span className='text-red-9'>*</span>
                  </label>
                  <input
                    ref={dueDateInputRef}
                    type='date'
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className='w-full px-4 py-2 bg-gray-3 border border-gray-6 rounded-lg text-gray-12 focus:outline-none focus:border-blue-9'
                  />
                </div>
              </div>

              {/* 첨부파일 */}
              <div>
                <label className='block text-sm font-medium text-gray-12 mb-1'>
                  첨부파일 <span className='text-gray-11'>(선택사항)</span>
                </label>
                <div className='border-2 border-dashed border-gray-6 rounded-lg p-4'>
                  <FileUploadDropZone onDrop={handleFileDrop} />
                  {files.length > 0 && (
                    <div className='mt-2 space-y-1'>
                      {files.map((file, index) => (
                        <div key={index} className='flex items-center gap-2 text-sm'>
                          <FileText size={14} />
                          {file.name}
                          <button
                            onClick={() => handleFileRemove(index)}
                            className='text-red-9 hover:text-red-10 transition-colors'
                          >
                            삭제
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {uploadError && <div className='mt-2 text-sm text-red-9'>{uploadError}</div>}
              </div>

              {/* 등록/취소 버튼 */}
              <div className='flex justify-end gap-3 mt-6'>
                <button
                  onClick={() => setIsOpen(false)}
                  className='px-4 py-2 bg-gray-4 hover:bg-gray-5 text-gray-12 rounded-md transition-colors'
                >
                  취소
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className='px-4 py-2 bg-blue-9 hover:bg-blue-10 text-gray-1 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {loading ? '등록 중...' : '등록'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
