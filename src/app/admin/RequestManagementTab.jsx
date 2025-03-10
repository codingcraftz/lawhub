'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Table, Text, Button, Box, TextArea } from '@radix-ui/themes';

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
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black opacity-80'>
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
    setCases(casesData);
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

    setAdminNotes(caseItem.admin_notes || '');
    setSelectedCase({ ...caseItem, transactions });
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

  if (loading) return <Text>로딩 중...</Text>;
  if (!cases.length) return <Text>의뢰 내역이 없습니다.</Text>;

  return (
    <Box className='bg-gray-2 p-8 rounded-lg shadow-md'>
      <Table.Root>
        <Table.Header>
          <Table.Row className='bg-gray-4'>
            <Table.ColumnHeaderCell className='text-gray-12 py-2 px-4'>고객 이름</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell className='text-gray-12 py-2 px-4'>유형</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell className='text-gray-12 py-2 px-4'>총 금액</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell className='text-gray-12 py-2 px-4'>생성일</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell className='text-gray-12 py-2 px-4'>상태</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell className='text-gray-12 py-2 px-4'>처리</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {cases.map((caseItem) => (
            <Table.Row key={caseItem.id} className='hover:bg-gray-5 transition-colors duration-200'>
              <Table.Cell className='text-gray-12 py-2 px-4'>
                {usersMap[caseItem.user_id]?.name || '알 수 없음'}
              </Table.Cell>
              <Table.Cell className='text-gray-12 py-2 px-4'>{caseItem.case_type}</Table.Cell>
              <Table.Cell className='text-gray-12 py-2 px-4'>
                {caseItem.total_amount ? `${Number(caseItem.total_amount).toLocaleString()} 원` : '-'}
              </Table.Cell>
              <Table.Cell className='text-gray-12 py-2 px-4'>
                {new Date(caseItem.created_at).toLocaleString('ko-KR')}
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
      <Modal isOpen={!!selectedCase} onClose={() => setSelectedCase(null)} title="의뢰 상세보기">
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
              {selectedCase.transactions && selectedCase.transactions.length ? (
                <Table.Root>
                  <Table.Header>
                    <Table.Row className='bg-gray-4'>
                      <Table.ColumnHeaderCell className='text-gray-12 py-2 px-4'>거래일</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell className='text-gray-12 py-2 px-4'>금액</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell className='text-gray-12 py-2 px-4'>지급약정일</Table.ColumnHeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {selectedCase.transactions.map((t, index) => (
                      <Table.Row key={index} className='hover:bg-gray-5 transition-colors duration-200'>
                        <Table.Cell className='text-gray-12 py-2 px-4'>{t.transaction_date || '-'}</Table.Cell>
                        <Table.Cell className='text-gray-12 py-2 px-4'>
                          {Number(t.amount).toLocaleString()} 원
                        </Table.Cell>
                        <Table.Cell className='text-gray-12 py-2 px-4'>{t.due_date || '-'}</Table.Cell>
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
