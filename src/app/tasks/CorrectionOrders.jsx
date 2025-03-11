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
  const dueDateRef = useRef(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'pending', 'completed'

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(5); // 페이지당 항목 수를 상태로 관리

  // 날짜 입력 참조
  const dueDateInputRef = useRef(null);

  // 보정명령 목록 불러오기
  useEffect(() => {
    fetchCorrectionOrders();
  }, [currentPage, activeTab, itemsPerPage]); // 페이지나 탭이 변경될 때마다 데이터 다시 불러오기

  // fetchCorrectionOrders 함수를 useCallback으로 감싸서 무한 루프 방지
  const fetchCorrectionOrders = useCallback(async () => {
    // 전체 개수 조회를 위한 쿼리
    let countQuery = supabase.from('correction_orders').select('id', { count: 'exact' });

    // 탭에 따라 필터링
    if (activeTab !== 'all') {
      countQuery = countQuery.eq('status', activeTab);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('보정명령 개수 조회 오류:', countError);
      return;
    }

    setTotalCount(count || 0);
    setTotalPages(Math.ceil((count || 0) / itemsPerPage));

    // 데이터 조회 쿼리
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

    // 탭에 따라 필터링
    if (activeTab !== 'all') {
      query = query.eq('status', activeTab);
    }

    // 페이지네이션 적용
    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    // 정렬 순서 변경: 상태(진행 중 먼저, 그 다음 완료), 그 다음 기한 날짜
    const { data, error } = await query
      .order('status', { ascending: false }) // 'pending'이 'completed'보다 사전순으로 뒤에 오므로 내림차순 정렬
      .order('due_date', { ascending: true })
      .range(from, to);

    if (error) {
      console.error('보정명령 조회 오류:', error);
      return;
    }

    // status 필드가 없는 경우 기본값으로 'pending' 설정
    const processedData = (data || []).map((order) => ({
      ...order,
      status: order.status || 'pending',
    }));

    setCorrectionOrders(processedData);
  }, [currentPage, activeTab, itemsPerPage]);

  // 의뢰 검색
  const searchAssignments = async () => {
    if (!searchTerm.trim()) {
      setAssignments([]);
      return;
    }

    setSearchLoading(true);

    try {
      // 채권자 이름으로 검색
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
      console.log('채권자 검색 결과:', creditorAssignments);

      // 채무자 이름으로 검색
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
      console.log('채무자 검색 결과:', debtorAssignments);

      // 의뢰 ID 목록 생성 (중복 제거)
      const assignmentIds = [
        ...new Set([
          ...creditorAssignments.map((c) => c.assignment_id),
          ...debtorAssignments.map((d) => d.assignment_id),
        ]),
      ];

      console.log('검색된 의뢰 ID:', assignmentIds);

      if (assignmentIds.length === 0) {
        setAssignments([]);
        setSearchLoading(false);
        return;
      }

      // 의뢰 정보 조회 (채권자, 채무자 정보 포함)
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select(
          `
          id,
          description,
          creditors:assignment_creditors(id, name),
          debtors:assignment_debtors(id, name)
        `
        )
        .in('id', assignmentIds);

      if (assignmentsError) throw assignmentsError;
      console.log('검색된 의뢰 상세:', assignmentsData);

      // 검색 결과 가공 (채권자, 채무자 정보 포함)
      const processedAssignments = assignmentsData.map((assignment) => {
        // 채권자 이름 목록
        const creditorNames =
          assignment.creditors && assignment.creditors.length > 0
            ? assignment.creditors.map((c) => c.name).join(', ')
            : '채권자 정보 없음';

        // 채무자 이름 목록
        const debtorNames =
          assignment.debtors && assignment.debtors.length > 0
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

  // 검색어 입력 처리 함수
  const handleSearchTermChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // 검색 버튼 클릭 처리 함수
  const handleSearchClick = () => {
    searchAssignments();
  };

  // 엔터 키 처리 함수
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchAssignments();
    }
  };

  // 도착일 변경 시 보정기한 자동 설정 (7일 후)
  const handleArrivalDateChange = (e) => {
    const selectedDate = e.target.value;
    setArrivalDate(selectedDate);

    if (selectedDate) {
      try {
        // 날짜 문자열을 Date 객체로 변환 (타임존 문제 해결)
        const arrivalDateObj = parseISO(selectedDate);
        // 7일 후 날짜 계산
        const dueDateObj = addDays(arrivalDateObj, 7);
        // YYYY-MM-DD 형식으로 변환
        const dueDateStr = format(dueDateObj, 'yyyy-MM-dd');
        setDueDate(dueDateStr);

        // UI에서도 날짜가 선택되도록 처리
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

  // 파일 업로드 처리
  const handleFileDrop = (acceptedFiles) => {
    setFiles([...files, ...acceptedFiles]);
    setUploadError(null); // 새 파일 추가 시 이전 오류 초기화
  };

  // 파일 삭제
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
      // 날짜 형식 확인 (타임존 문제 해결)
      const formattedArrivalDate = format(parseISO(arrivalDate), 'yyyy-MM-dd');
      const formattedDueDate = format(parseISO(dueDate), 'yyyy-MM-dd');

      // 1. 보정명령 등록
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

      // 2. 파일 업로드 (파일이 있는 경우에만)
      if (files.length > 0) {
        try {
          for (const file of files) {
            const fileExt = file.name.split('.').pop();
            // 원래 방식대로 랜덤 ID로 파일 저장
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${correctionOrder.id}/${fileName}`;

            console.log('파일 업로드 시도:', {
              bucket: STORAGE_BUCKET,
              filePath,
              fileSize: file.size,
              fileType: file.type,
              originalName: file.name,
            });

            const { data: uploadData, error: uploadError } = await supabase.storage
              .from(STORAGE_BUCKET)
              .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true, // 같은 경로에 파일이 있으면 덮어쓰기
              });

            if (uploadError) {
              console.error('파일 업로드 오류:', uploadError);
              console.error('오류 세부 정보:', JSON.stringify(uploadError));
              throw new Error(`파일 업로드 실패: ${uploadError.message}`);
            }

            console.log('파일 업로드 성공:', uploadData);

            // 업로드된 파일의 공개 URL 가져오기
            const { data: publicUrlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
            console.log('파일 URL:', publicUrlData);

            // 채권자, 채무자 이름 추출 (화면 표시용)
            const firstCreditorName =
              selectedAssignment.creditors && selectedAssignment.creditors.length > 0
                ? selectedAssignment.creditors[0].name
                : '채권자없음';

            const firstDebtorName =
              selectedAssignment.debtors && selectedAssignment.debtors.length > 0
                ? selectedAssignment.debtors[0].name
                : '채무자없음';

            // 사건번호_채무자이름(채권자이름) 형식의 표시용 이름 생성
            const displayName = `${caseNumber}_${firstDebtorName}(${firstCreditorName})`;

            const { error: fileError } = await supabase.from('correction_order_files').insert({
              correction_order_id: correctionOrder.id,
              file_name: file.name, // 원본 파일 이름 저장
              file_path: filePath,
              file_size: file.size,
              file_type: file.type,
              display_name: displayName, // 표시용 이름 추가
            });

            if (fileError) {
              console.error('파일 정보 저장 오류:', fileError);
              throw new Error(`파일 정보 저장 실패: ${fileError.message}`);
            }
          }
        } catch (fileUploadError) {
          console.error('파일 업로드 중 오류 발생:', fileUploadError);
          throw fileUploadError;
        }
      }

      // 성공 후 초기화
      setIsOpen(false);
      setSelectedAssignment(null);
      setCaseNumber('');
      setContent('');
      setArrivalDate('');
      setDueDate('');
      setFiles([]);
      setUploadError(null);
      fetchCorrectionOrders();

      alert('보정명령이 성공적으로 등록되었습니다.');
    } catch (error) {
      console.error('보정명령 등록 오류:', error);
      console.error('오류 세부 정보:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      setUploadError(error.message);

      // 사용자에게 더 자세한 오류 메시지 표시
      let errorMessage = `보정명령 등록 중 오류가 발생했습니다: ${error.message}`;

      // Supabase 스토리지 관련 오류인 경우 추가 정보 제공
      if (error.message.includes('storage') || error.message.includes('bucket') || error.message.includes('upload')) {
        errorMessage += '\n\n다음 사항을 확인해 주세요:\n';
        errorMessage += '1. Supabase 대시보드에서 "documents" 버킷이 생성되어 있는지 확인\n';
        errorMessage += '2. 버킷이 Public으로 설정되어 있거나 적절한 RLS 정책이 설정되어 있는지 확인\n';
        errorMessage += '3. 파일 크기가 제한을 초과하지 않는지 확인 (일반적으로 50MB 이하)\n';
        errorMessage += '4. 파일 형식이 허용되는지 확인';
      }

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // D-day 계산
  const calculateDday = (dueDate) => {
    const today = new Date();
    // 타임존 문제 해결을 위해 날짜만 추출
    today.setHours(0, 0, 0, 0);

    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    const diff = differenceInDays(due, today);
    return diff;
  };

  // 날짜 포맷팅 함수 (타임존 문제 해결)
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'yyyy-MM-dd');
    } catch (error) {
      console.error('날짜 포맷팅 오류:', error);
      return dateString;
    }
  };

  // 모달 초기화
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

  // 보정명령 삭제 함수
  const handleDelete = async (id) => {
    if (!confirm('정말로 이 보정명령을 삭제하시겠습니까?')) {
      return;
    }

    try {
      // Optimistic UI 업데이트: 로컬 상태에서 먼저 항목 제거
      const orderToDelete = correctionOrders.find((order) => order.id === id);
      setCorrectionOrders((prevOrders) => prevOrders.filter((order) => order.id !== id));

      // 성공 메시지 표시
      const successToast = alert('보정명령이 삭제되었습니다.');

      console.log('보정명령 삭제 시작:', id);

      // 1. 연결된 파일 정보 조회
      const { data: fileData, error: fileQueryError } = await supabase
        .from('correction_order_files')
        .select('*')
        .eq('correction_order_id', id);

      if (fileQueryError) {
        console.error('파일 정보 조회 오류:', fileQueryError);
        // 오류 발생 시 삭제된 항목 복원
        setCorrectionOrders((prevOrders) =>
          [...prevOrders, orderToDelete].sort((a, b) => {
            // 상태에 따라 정렬 (진행 중 먼저, 그 다음 완료)
            if (a.status !== b.status) {
              return a.status === 'completed' ? 1 : -1;
            }
            // 같은 상태면 기한 날짜순
            return new Date(a.due_date) - new Date(b.due_date);
          })
        );
        throw fileQueryError;
      }

      console.log('조회된 파일 정보:', fileData);

      // 2. 스토리지에서 파일 삭제
      if (fileData && fileData.length > 0) {
        console.log('파일 삭제 시작');
        for (const file of fileData) {
          console.log('파일 삭제 시도:', file.file_path);
          const { error: storageError } = await supabase.storage.from(STORAGE_BUCKET).remove([file.file_path]);

          if (storageError) {
            console.error('파일 삭제 오류:', storageError);
            console.error('오류 세부 정보:', JSON.stringify(storageError));
            // 파일 삭제 실패해도 계속 진행
          } else {
            console.log('파일 삭제 성공:', file.file_path);
          }
        }
      }

      // 3. 파일 정보 삭제
      if (fileData && fileData.length > 0) {
        console.log('파일 정보 삭제 시작');
        const { error: fileDeleteError } = await supabase
          .from('correction_order_files')
          .delete()
          .eq('correction_order_id', id);

        if (fileDeleteError) {
          console.error('파일 정보 삭제 오류:', fileDeleteError);
          console.error('오류 세부 정보:', JSON.stringify(fileDeleteError));
          // 파일 삭제 실패해도 계속 진행
        } else {
          console.log('파일 정보 삭제 성공');
        }
      }

      // 4. 보정명령 삭제
      console.log('보정명령 삭제 시작');
      const { error: orderDeleteError } = await supabase.from('correction_orders').delete().eq('id', id);

      if (orderDeleteError) {
        console.error('보정명령 삭제 오류:', orderDeleteError);
        console.error('오류 세부 정보:', JSON.stringify(orderDeleteError));

        // 오류 발생 시 삭제된 항목 복원
        setCorrectionOrders((prevOrders) =>
          [...prevOrders, orderToDelete].sort((a, b) => {
            // 상태에 따라 정렬 (진행 중 먼저, 그 다음 완료)
            if (a.status !== b.status) {
              return a.status === 'completed' ? 1 : -1;
            }
            // 같은 상태면 기한 날짜순
            return new Date(a.due_date) - new Date(b.due_date);
          })
        );

        throw orderDeleteError;
      }

      console.log('보정명령 삭제 성공');

      // 페이지네이션 업데이트
      if (correctionOrders.length === 1 && currentPage > 1) {
        // 현재 페이지의 마지막 항목을 삭제한 경우 이전 페이지로 이동
        setCurrentPage(currentPage - 1);
      } else {
        // 삭제 후 현재 페이지의 데이터 다시 불러오기
        fetchCorrectionOrders();
      }
    } catch (error) {
      console.error('삭제 오류:', error);
      console.error('오류 세부 정보:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      alert(`삭제 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  // 상태 변경 함수도 Optimistic UI 패턴 적용
  const handleStatusChange = async (id, newStatus) => {
    // 완료 처리 시 확인 대화상자 표시
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
      // 변경할 항목 찾기
      const orderIndex = correctionOrders.findIndex((order) => order.id === id);
      if (orderIndex === -1) return;

      const orderToUpdate = correctionOrders[orderIndex];

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

      // Optimistic UI 업데이트: 로컬 상태 먼저 업데이트
      const updatedOrder = {
        ...orderToUpdate,
        ...updateData,
      };

      const newOrders = [...correctionOrders];
      newOrders[orderIndex] = updatedOrder;

      // 상태에 따라 정렬 (진행 중 먼저, 그 다음 완료)
      const sortedOrders = newOrders.sort((a, b) => {
        if (a.status !== b.status) {
          return a.status === 'completed' ? 1 : -1;
        }
        // 같은 상태면 기한 날짜순
        return new Date(a.due_date) - new Date(b.due_date);
      });

      setCorrectionOrders(sortedOrders);

      // 성공 메시지 표시
      alert(newStatus === 'completed' ? '보정명령이 완료 처리되었습니다.' : '보정명령이 진행 중으로 변경되었습니다.');

      // 서버에 업데이트 요청
      const { error } = await supabase.from('correction_orders').update(updateData).eq('id', id);

      if (error) {
        // 오류 발생 시 원래 상태로 복원
        const restoredOrders = [...correctionOrders];
        restoredOrders[orderIndex] = orderToUpdate;
        setCorrectionOrders(restoredOrders);

        throw error;
      }

      // 상태 업데이트 후 목록 다시 불러오기 (백그라운드에서 실행)
      fetchCorrectionOrders();
    } catch (error) {
      console.error('상태 변경 오류:', error);
      alert(`상태 변경 중 오류가 발생했습니다: ${error.message}`);
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

  return (
    <div className='space-y-4'>
      {/* 보정명령 등록 버튼 */}
      <div className='flex justify-between items-center'>
        <button
          onClick={handleOpenModal}
          className='flex items-center gap-2 px-4 py-2 bg-blue-9 hover:bg-blue-10 text-gray-1 rounded-md transition-colors'
        >
          <Plus size={16} />
          보정명령 등록
        </button>

        {/* 페이지당 항목 수 선택 */}
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
            <option value={5}>5개</option>
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
          <div className='p-4 bg-gray-3 rounded-lg text-gray-11 text-center'>등록된 보정명령이 없습니다.</div>
        ) : (
          <>
            {correctionOrders.map((order) => {
              const dday = calculateDday(order.due_date);
              return (
                <div key={order.id} className='p-4 bg-gray-3 rounded-lg space-y-2'>
                  {/* 상단 정보 및 버튼 */}
                  <div className='flex justify-between items-start'>
                    <div>
                      {/* D-day 표시 */}
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

                        {/* 완료 날짜 표시 */}
                        {order.status === 'completed' && order.completed_at && (
                          <span className='ml-2 text-xs text-gray-11'>{formatDate(order.completed_at)} 완료</span>
                        )}
                      </div>
                    </div>

                    {/* 버튼 그룹 */}
                    <div className='flex gap-2'>
                      {order.status === 'pending' ? (
                        <button
                          onClick={() => handleStatusChange(order.id, 'completed')}
                          className='px-3 py-1 bg-green-9 hover:bg-green-10 text-white text-sm rounded'
                        >
                          완료 처리
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

                  {/* 당사자 정보 */}
                  <div className='flex flex-wrap gap-2 text-sm'>
                    <span className='text-gray-11'>채권자:</span>
                    <span className='text-gray-12 font-medium'>
                      {order.assignment?.creditors && order.assignment.creditors.length > 0
                        ? order.assignment.creditors.map((c) => c.name).join(', ')
                        : '채권자 정보 없음'}
                    </span>
                    <span className='text-gray-11'>채무자:</span>
                    <span className='text-gray-12 font-medium'>
                      {order.assignment?.debtors && order.assignment.debtors.length > 0
                        ? order.assignment.debtors.map((d) => d.name).join(', ')
                        : '채무자 정보 없음'}
                    </span>
                  </div>

                  {/* 사건번호 */}
                  <div className='text-sm'>
                    <span className='text-gray-11'>사건번호:</span>
                    <span className='ml-2 text-gray-12'>{order.case_number}</span>
                  </div>

                  {/* 보정명령 내용 */}
                  <div className='text-sm'>
                    <div className='text-gray-11 mb-1'>보정명령 내용:</div>
                    <div className='text-gray-12 whitespace-pre-wrap'>{order.content}</div>
                  </div>

                  {/* 첨부파일 */}
                  {order.files && order.files.length > 0 && (
                    <div className='text-sm'>
                      <div className='text-gray-11 mb-1'>첨부파일:</div>
                      <div className='flex flex-wrap gap-2'>
                        {order.files.map((file) => (
                          <a
                            key={file.id}
                            href={`${
                              supabase.storage.from(STORAGE_BUCKET).getPublicUrl(file.file_path).data.publicUrl
                            }`}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='flex items-center gap-1 px-2 py-1 bg-gray-4 hover:bg-gray-5 rounded text-gray-12'
                            title={file.file_name}
                          >
                            <FileText size={14} />
                            {file.display_name || file.file_name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 날짜 정보 */}
                  <div className='flex gap-4 text-sm text-gray-11'>
                    <div>도착일: {formatDate(order.arrival_date)}</div>
                    <div>기한: {formatDate(order.due_date)}</div>
                  </div>
                </div>
              );
            })}

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            )}
          </>
        )}
      </div>

      {/* 보정명령 등록 모달 */}
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

            {/* 모달 컨텐츠 */}
            <div className='space-y-4'>
              {/* 당사자 검색 */}
              <div>
                <label className='block text-sm font-medium text-gray-12 mb-1'>
                  당사자 검색 (이름 또는 회사명) <span className='text-red-9'>*</span>
                </label>
                <div className='relative flex'>
                  <div className='relative flex-grow'>
                    <input
                      type='text'
                      placeholder='이름 또는 회사명으로 검색...'
                      value={searchTerm}
                      onChange={handleSearchTermChange}
                      onKeyDown={handleSearchKeyPress}
                      className='w-full pl-10 pr-4 py-2 bg-gray-3 border border-gray-6 rounded-l-lg text-gray-12 placeholder-gray-11 focus:outline-none focus:border-blue-9'
                    />
                    <div className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-11'>
                      <Search size={16} />
                    </div>
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

              {/* 사건번호 입력 */}
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

              {/* 파일 업로드 */}
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

              {/* 버튼 그룹 */}
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
