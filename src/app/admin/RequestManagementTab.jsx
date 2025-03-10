'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/utils/supabase';
import { Table, Text, Button, Box, TextArea } from '@radix-ui/themes';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';

function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black opac'>
      <div className='p-6 rounded-lg shadow-lg max-w-lg w-full bg-gray-2'>
        <div className='flex justify-between items-center mb-4'>
          <h2 className='text-xl font-bold'>{title}</h2>
          <button onClick={onClose} className='text-2xl'>
            &times;
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}

export default function AdminCaseManagement() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);
  const [usersMap, setUsersMap] = useState({});
  const [adminNotes, setAdminNotes] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');
  const [modalSortKey, setModalSortKey] = useState(null);
  const [modalSortOrder, setModalSortOrder] = useState('asc');

  // 데이터 로드 함수
  const fetchCases = async () => {
    setLoading(true);

    const { data: casesData, error: casesError } = await supabase
      .from('chatbot_cases')
      .select('*')
      .order('created_at', { ascending: false });

    if (casesError) {
      console.error('Error fetching cases:', casesError);
      setLoading(false);
      return;
    }

    // 각 case의 거래 내역을 가져와서 총액 계산
    const casesWithTransactions = await Promise.all(
      casesData.map(async (caseItem) => {
        const { data: transactions } = await supabase.from('transactions').select('amount').eq('case_id', caseItem.id);

        const totalAmount = transactions?.reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0;
        return {
          ...caseItem,
          total_amount: totalAmount,
        };
      })
    );

    const userIds = [...new Set(casesData.map((c) => c.user_id))];
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, phone_number')
      .in('id', userIds);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      setLoading(false);
      return;
    }

    const usersMap = usersData.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {});

    setUsersMap(usersMap);
    setCases(casesWithTransactions);
    setLoading(false);
  };

  useEffect(() => {
    fetchCases();
  }, []);

  // 의뢰 상태 변경 함수
  const handleStatusChange = async (caseId, newStatus) => {
    const { error } = await supabase.from('chatbot_cases').update({ status: newStatus }).eq('id', caseId);
    if (error) {
      console.error('Error updating case status:', error);
      return;
    }
    fetchCases();
  };

  // 상세보기 모달 열기 (거래 내역 포함)
  const openCaseDetails = async (caseItem) => {
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .eq('case_id', caseItem.id);

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError);
      return;
    }

    // 거래 내역의 총액 계산
    const totalAmount = transactions?.reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0;

    setAdminNotes(caseItem.admin_notes || '');
    setSelectedCase({
      ...caseItem,
      transactions,
      total_amount: totalAmount,
    });

    // cases 배열에서 해당 case의 총액도 업데이트
    setCases((prevCases) => prevCases.map((c) => (c.id === caseItem.id ? { ...c, total_amount: totalAmount } : c)));
  };

  // 관리자 메모 저장 (자동 저장: TextArea에서 focus가 벗어나면 저장)
  const saveAdminNotes = async () => {
    if (!selectedCase) return;

    const { error } = await supabase
      .from('chatbot_cases')
      .update({ admin_notes: adminNotes })
      .eq('id', selectedCase.id);

    if (error) {
      console.error('Error saving admin notes:', error);
      return;
    }

    fetchCases();
  };

  // 정렬 처리 함수
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  // 정렬 아이콘 렌더링 함수
  const renderSortIcon = (key) => {
    if (sortKey === key) {
      return sortOrder === 'asc' ? <FaSortUp size={16} /> : <FaSortDown size={16} />;
    }
    return <FaSort size={16} className='opacity-50' />;
  };

  // 정렬된 케이스 목록
  const sortedCases = useMemo(() => {
    let sorted = [...cases];
    if (sortKey) {
      sorted.sort((a, b) => {
        let aValue, bValue;

        switch (sortKey) {
          case 'created_at':
            aValue = new Date(a.created_at);
            bValue = new Date(b.created_at);
            return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
          case 'total_amount':
            aValue = Number(a.total_amount) || 0;
            bValue = Number(b.total_amount) || 0;
            return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
          case 'case_type':
            aValue = a.case_type || '';
            bValue = b.case_type || '';
            return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
          case 'user_name':
            aValue = usersMap[a.user_id]?.name || '';
            bValue = usersMap[b.user_id]?.name || '';
            return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
          case 'user_phone':
            aValue = usersMap[a.user_id]?.phone_number || '';
            bValue = usersMap[b.user_id]?.phone_number || '';
            return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
          case 'status':
            aValue = a.status || '';
            bValue = b.status || '';
            return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
          default:
            return 0;
        }
      });
    }
    return sorted;
  }, [cases, sortKey, sortOrder, usersMap]);

  // 날짜 포맷 함수
  const formatDate = (dateString) => {
    if (!dateString) return '미등록';
    const date = new Date(dateString);

    // 1970년 1월 1일인 경우 미등록으로 표시
    if (date.getFullYear() === 1970 && date.getMonth() === 0 && date.getDate() === 1) {
      return '미등록';
    }

    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  // 모달 내 정렬 처리 함수
  const handleModalSort = (key) => {
    if (modalSortKey === key) {
      setModalSortOrder(modalSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setModalSortKey(key);
      setModalSortOrder('asc');
    }
  };

  // 정렬된 거래 내역
  const sortedTransactions = useMemo(() => {
    if (!selectedCase?.transactions) return [];

    let sorted = [...selectedCase.transactions];
    if (modalSortKey) {
      sorted.sort((a, b) => {
        let aValue, bValue;

        switch (modalSortKey) {
          case 'transaction_date':
            aValue = new Date(a.transaction_date || '');
            bValue = new Date(b.transaction_date || '');
            return modalSortOrder === 'asc' ? aValue - bValue : bValue - aValue;
          case 'amount':
            aValue = Number(a.amount) || 0;
            bValue = Number(b.amount) || 0;
            return modalSortOrder === 'asc' ? aValue - bValue : bValue - aValue;
          case 'due_date':
            aValue = new Date(a.due_date || '');
            bValue = new Date(b.due_date || '');
            return modalSortOrder === 'asc' ? aValue - bValue : bValue - aValue;
          default:
            return 0;
        }
      });
    }
    return sorted;
  }, [selectedCase?.transactions, modalSortKey, modalSortOrder]);

  if (loading) return <Text>로딩 중...</Text>;
  if (!cases.length) return <Text>의뢰 내역이 없습니다.</Text>;

  return (
    <Box className='bg-gray-2 p-8 rounded-lg shadow-md'>
      <Table.Root>
        <Table.Header>
          <Table.Row className='bg-gray-4'>
            <Table.ColumnHeaderCell className='text-gray-12 py-2 px-4'>
              <button
                className='flex items-center justify-center gap-1 w-full'
                onClick={() => handleSort('created_at')}
              >
                생성일 {renderSortIcon('created_at')}
              </button>
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell className='text-gray-12 py-2 px-4'>
              <button className='flex items-center justify-center gap-1 w-full' onClick={() => handleSort('case_type')}>
                유형 {renderSortIcon('case_type')}
              </button>
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell className='text-gray-12 py-2 px-4'>
              <button
                className='flex items-center justify-center gap-1 w-full'
                onClick={() => handleSort('total_amount')}
              >
                총 금액 {renderSortIcon('total_amount')}
              </button>
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell className='text-gray-12 py-2 px-4'>
              <button className='flex items-center justify-center gap-1 w-full' onClick={() => handleSort('user_name')}>
                고객 이름 {renderSortIcon('user_name')}
              </button>
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell className='text-gray-12 py-2 px-4'>
              <button
                className='flex items-center justify-center gap-1 w-full'
                onClick={() => handleSort('user_phone')}
              >
                고객 번호 {renderSortIcon('user_phone')}
              </button>
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell className='text-gray-12 py-2 px-4'>
              <button className='flex items-center justify-center gap-1 w-full' onClick={() => handleSort('status')}>
                상태 {renderSortIcon('status')}
              </button>
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell className='text-gray-12 py-2 px-4'>상세보기</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {sortedCases.map((caseItem) => (
            <Table.Row key={caseItem.id} className='hover:bg-gray-5 transition-colors duration-200'>
              <Table.Cell className='text-gray-12 py-2 px-4'>{formatDate(caseItem.created_at)}</Table.Cell>
              <Table.Cell className='text-gray-12 py-2 px-4'>{caseItem.case_type}</Table.Cell>
              <Table.Cell className='text-gray-12 py-2 px-4'>
                {caseItem.total_amount ? `${Number(caseItem.total_amount).toLocaleString()} 원` : '-'}
              </Table.Cell>
              <Table.Cell className='text-gray-12 py-2 px-4'>
                {usersMap[caseItem.user_id]?.name || '알 수 없음'}
              </Table.Cell>
              <Table.Cell className='text-gray-12 py-2 px-4'>
                {usersMap[caseItem.user_id]?.phone_number || '-'}
              </Table.Cell>
              <Table.Cell className='py-2 px-4'>
                <select
                  value={caseItem.status}
                  onChange={(e) => handleStatusChange(caseItem.id, e.target.value)}
                  className='bg-gray-1 border border-gray-6 text-gray-12 px-3 py-1 rounded transition-colors duration-200 focus:border-gray-8'
                >
                  <option value='접수신청'>접수신청</option>
                  <option value='진행 중'>진행 중</option>
                  <option value='완료'>완료</option>
                  <option value='취소됨'>취소됨</option>
                </select>
              </Table.Cell>
              <Table.Cell className='py-2 px-4'>
                <Button
                  variant='soft'
                  color='blue'
                  onClick={() => openCaseDetails(caseItem)}
                  className='hover:bg-blue-10 transition-colors duration-200'
                >
                  상세보기
                </Button>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>

      {/* 상세보기 모달 */}
      <Modal isOpen={!!selectedCase} onClose={() => setSelectedCase(null)} title='의뢰 상세보기'>
        {selectedCase && (
          <>
            <div className='mb-4'>
              <Text className='font-semibold mb-2'>관리자 메모</Text>
              <TextArea
                className='border border-gray-6 w-full p-3 rounded'
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                onBlur={saveAdminNotes}
                placeholder='여기에 메모를 입력하세요 (자동 저장됩니다)'
              />
            </div>

            <div>
              <Text className='font-semibold text-gray-12 mb-2'>거래 내역</Text>
              {sortedTransactions.length ? (
                <Table.Root>
                  <Table.Header>
                    <Table.Row className='bg-gray-4'>
                      <Table.ColumnHeaderCell className='text-gray-12 py-2 px-4'>
                        <button
                          className='flex items-center justify-center gap-1 w-full'
                          onClick={() => handleModalSort('transaction_date')}
                        >
                          거래일{' '}
                          {modalSortKey === 'transaction_date' ? (
                            modalSortOrder === 'asc' ? (
                              <FaSortUp size={16} />
                            ) : (
                              <FaSortDown size={16} />
                            )
                          ) : (
                            <FaSort size={16} className='opacity-50' />
                          )}
                        </button>
                      </Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell className='text-gray-12 py-2 px-4'>
                        <button
                          className='flex items-center justify-center gap-1 w-full'
                          onClick={() => handleModalSort('amount')}
                        >
                          금액{' '}
                          {modalSortKey === 'amount' ? (
                            modalSortOrder === 'asc' ? (
                              <FaSortUp size={16} />
                            ) : (
                              <FaSortDown size={16} />
                            )
                          ) : (
                            <FaSort size={16} className='opacity-50' />
                          )}
                        </button>
                      </Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell className='text-gray-12 py-2 px-4'>
                        <button
                          className='flex items-center justify-center gap-1 w-full'
                          onClick={() => handleModalSort('due_date')}
                        >
                          지급약정일{' '}
                          {modalSortKey === 'due_date' ? (
                            modalSortOrder === 'asc' ? (
                              <FaSortUp size={16} />
                            ) : (
                              <FaSortDown size={16} />
                            )
                          ) : (
                            <FaSort size={16} className='opacity-50' />
                          )}
                        </button>
                      </Table.ColumnHeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {sortedTransactions.map((t, index) => (
                      <Table.Row key={index} className='hover:bg-gray-5 transition-colors duration-200'>
                        <Table.Cell className='text-gray-12 py-2 px-4'>
                          {formatDate(t.transaction_date) || '-'}
                        </Table.Cell>
                        <Table.Cell className='text-gray-12 py-2 px-4'>
                          {Number(t.amount).toLocaleString()} 원
                        </Table.Cell>
                        <Table.Cell className='text-gray-12 py-2 px-4'>{formatDate(t.due_date) || '-'}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              ) : (
                <Text className='text-gray-12'>거래 내역이 없습니다.</Text>
              )}
            </div>
          </>
        )}
      </Modal>
    </Box>
  );
}
