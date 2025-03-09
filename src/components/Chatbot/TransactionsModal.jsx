'use client';

import React, { useState, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { Table, Button, Box } from '@radix-ui/themes';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { PlusIcon, Cross2Icon, ChevronUpIcon, ChevronDownIcon } from '@radix-ui/react-icons';
import * as Dialog from '@radix-ui/react-dialog';

// 헬퍼 함수: 선택한 날짜를 로컬 타임존 기준의 "yyyy-MM-dd" 형식 문자열로 변환
const formatDateLocal = (date) => {
  if (!date) return null;
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().split('T')[0];
};

const CustomDateInput = React.forwardRef(({ value, onClick, placeholder }, ref) => (
  <button
    type='button'
    className='w-full text-left px-4 py-2 bg-gray-3 text-gray-12 placeholder-gray-11 rounded-lg border border-gray-6 focus:outline-none focus:ring-2 focus:ring-blue-8'
    onClick={onClick}
    ref={ref}
  >
    {value || placeholder}
  </button>
));
CustomDateInput.displayName = 'CustomDateInput';

export default function TransactionsModal({ type, transactions, setTransactions, onClose }) {
  // 입력 필드 상태
  const [transactionDate, setTransactionDate] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(null);
  // 수정 중인 항목의 인덱스 (수정 모드가 아니면 null)
  const [editIndex, setEditIndex] = useState(null);

  // 정렬 상태: sortKey (정렬 기준)와 sortOrder ("asc" 또는 "desc")
  const [sortKey, setSortKey] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');

  // 거래 추가/수정 처리 함수
  const handleAddOrUpdate = () => {
    if (!amount) {
      alert('금액(부가가치세 제외)을 입력해주세요.');
      return;
    }
    const newTransaction = {
      id: editIndex !== null && transactions[editIndex] ? transactions[editIndex].id : Date.now(),
      transactionDate: transactionDate ? formatDateLocal(transactionDate) : null,
      startDate: startDate ? formatDateLocal(startDate) : null,
      endDate: endDate ? formatDateLocal(endDate) : null,
      amount: parseFloat(amount),
      dueDate: dueDate ? formatDateLocal(dueDate) : null,
    };

    if (editIndex !== null) {
      const updatedTransactions = transactions.map((item, index) => (index === editIndex ? newTransaction : item));
      setTransactions(updatedTransactions);
      setEditIndex(null);
    } else {
      setTransactions([...transactions, newTransaction]);
    }

    // 입력 필드 초기화
    setTransactionDate(null);
    setStartDate(null);
    setEndDate(null);
    setAmount('');
    setDueDate(null);
  };

  // 기존 거래 수정: 선택한 거래 데이터를 입력 폼에 채워넣고 수정 모드로 전환
  const handleEdit = (index) => {
    const item = transactions[index];
    if (type === 'construction') {
      setStartDate(item.startDate ? new Date(item.startDate) : null);
      setEndDate(item.endDate ? new Date(item.endDate) : null);
      setAmount(item.amount.toString());
      setDueDate(item.dueDate ? new Date(item.dueDate) : null);
    } else {
      setTransactionDate(item.transactionDate ? new Date(item.transactionDate) : null);
      setAmount(item.amount.toString());
      setDueDate(item.dueDate ? new Date(item.dueDate) : null);
    }
    setEditIndex(index);
  };

  // 거래 삭제 처리
  const handleDelete = (index) => {
    const updated = transactions.filter((_, i) => i !== index);
    setTransactions(updated);
  };

  // 정렬 처리 함수
  const handleSort = (key) => {
    if (sortKey === key) {
      // 같은 열 클릭 시 정렬 순서 토글
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  // 정렬된 거래 내역 (sortKey가 설정되어 있으면 정렬 적용)
  const sortedTransactions = useMemo(() => {
    let sorted = [...transactions];
    if (sortKey) {
      sorted.sort((a, b) => {
        // 금액은 숫자 비교
        if (sortKey === 'amount') {
          return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
        }
        // 날짜나 문자열은 localeCompare 사용 (null 처리)
        const aValue = a[sortKey] || '';
        const bValue = b[sortKey] || '';
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      });
    }
    return sorted;
  }, [transactions, sortKey, sortOrder]);

  // 헤더의 정렬 아이콘 렌더링 함수
  // 현재 열이 정렬 기준이면 해당 순서의 아이콘을, 그렇지 않으면
  // 위/아래 아이콘을 반투명하게 보여 정렬 가능함을 나타냅니다.
  const renderSortIcon = (key) => {
    if (sortKey === key) {
      return sortOrder === 'asc' ? <FaSortUp size={16} /> : <FaSortDown size={16} />;
    }
    return <FaSort size={16} className='opacity-50' />;
  };

  return (
    <Dialog.Root open>
      <Dialog.Overlay className='fixed inset-0 bg-black opacity-50' />
      <Dialog.Content className='fixed top-1/2 left-1/2 max-w-3xl w-full max-h-[80vh] overflow-y-auto transform -translate-x-1/2 -translate-y-1/2 bg-gray-2 p-6 rounded-lg shadow-lg border border-gray-6 min-h-[600px]'>
        <Dialog.Title className='text-xl font-bold mb-4 text-gray-12'>거래 내역 입력</Dialog.Title>

        {/* 거래 내역 입력 폼 */}
        <Box className='mb-4'>
          {type === 'construction' ? (
            <div className='grid grid-cols-1 gap-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm mb-1 text-gray-12'>시작일</label>
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    dateFormat='yyyy-MM-dd'
                    locale={ko}
                    placeholderText='시작일 선택'
                    customInput={<CustomDateInput />}
                    showYearDropdown
                    showMonthDropdown
                    yearDropdownItemNumber={15}
                    scrollableYearDropdown
                  />
                </div>
                <div>
                  <label className='block text-sm mb-1 text-gray-12'>종료일</label>
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    dateFormat='yyyy-MM-dd'
                    locale={ko}
                    placeholderText='종료일 선택'
                    customInput={<CustomDateInput />}
                    showYearDropdown
                    showMonthDropdown
                    yearDropdownItemNumber={15}
                    scrollableYearDropdown
                  />
                </div>
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm mb-1 text-gray-12'>금액(원)</label>
                  <input
                    type='number'
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className='w-full px-4 py-2 border rounded bg-gray-2 text-gray-12'
                    placeholder='금액 입력'
                  />
                </div>
                <div>
                  <label className='block text-sm mb-1 text-gray-12'>지급약정일</label>
                  <DatePicker
                    selected={dueDate}
                    onChange={(date) => setDueDate(date)}
                    dateFormat='yyyy-MM-dd'
                    locale={ko}
                    placeholderText='지급약정일 선택'
                    customInput={<CustomDateInput />}
                    showYearDropdown
                    showMonthDropdown
                    yearDropdownItemNumber={15}
                    scrollableYearDropdown
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className='grid grid-cols-3 gap-4'>
              <div>
                <label className='block text-sm mb-1 text-gray-12'>거래일</label>
                <DatePicker
                  selected={transactionDate}
                  onChange={(date) => setTransactionDate(date)}
                  dateFormat='yyyy-MM-dd'
                  locale={ko}
                  placeholderText='거래일 선택'
                  customInput={<CustomDateInput />}
                  showYearDropdown
                  showMonthDropdown
                  yearDropdownItemNumber={15}
                  scrollableYearDropdown
                />
              </div>
              <div>
                <label className='block text-sm mb-1 text-gray-12'>금액(원)</label>
                <input
                  type='number'
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className='w-full px-4 py-2 border rounded bg-gray-2 text-gray-12'
                  placeholder='금액 입력'
                />
              </div>
              <div>
                <label className='block text-sm mb-1 text-gray-12'>지급약정일</label>
                <DatePicker
                  selected={dueDate}
                  onChange={(date) => setDueDate(date)}
                  dateFormat='yyyy-MM-dd'
                  locale={ko}
                  placeholderText='지급약정일 선택'
                  customInput={<CustomDateInput />}
                  showYearDropdown
                  showMonthDropdown
                  yearDropdownItemNumber={15}
                  scrollableYearDropdown
                />
              </div>
            </div>
          )}
          <Button variant='soft' color='blue' className='w-full mt-4' onClick={handleAddOrUpdate}>
            {editIndex !== null ? (
              '수정하기'
            ) : (
              <>
                <PlusIcon className='mr-1' />
                추가하기
              </>
            )}
          </Button>
        </Box>

        {/* 거래 내역 테이블 */}
        <Table.Root className='table-fixed w-full mb-4'>
          <Table.Header>
            <Table.Row>
              {type === 'construction' ? (
                <>
                  <Table.ColumnHeaderCell className='w-1/4 text-gray-12'>
                    <button
                      className='flex items-center justify-center gap-1 w-full'
                      onClick={() => handleSort('startDate')}
                    >
                      시작일 {renderSortIcon('startDate')}
                    </button>
                  </Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell className='w-1/4 text-gray-12'>
                    <button
                      className='flex items-center justify-center gap-1 w-full'
                      onClick={() => handleSort('endDate')}
                    >
                      종료일 {renderSortIcon('endDate')}
                    </button>
                  </Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell className='w-1/4 text-gray-12'>
                    <button
                      className='flex items-center justify-center gap-1 w-full'
                      onClick={() => handleSort('amount')}
                    >
                      금액 {renderSortIcon('amount')}
                    </button>
                  </Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell className='w-1/4 text-gray-12'>
                    <button
                      className='flex items-center justify-center gap-1 w-full'
                      onClick={() => handleSort('dueDate')}
                    >
                      지급약정일 {renderSortIcon('dueDate')}
                    </button>
                  </Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell className='w-1/3 text-gray-12'>수정/삭제</Table.ColumnHeaderCell>
                </>
              ) : (
                <>
                  <Table.ColumnHeaderCell className='w-1/3 text-gray-12'>
                    <button
                      className='flex items-center justify-center gap-1 w-full'
                      onClick={() => handleSort('transactionDate')}
                    >
                      거래일 {renderSortIcon('transactionDate')}
                    </button>
                  </Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell className='w-1/3 text-gray-12'>
                    <button
                      className='flex items-center justify-center gap-1 w-full'
                      onClick={() => handleSort('amount')}
                    >
                      금액 {renderSortIcon('amount')}
                    </button>
                  </Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell className='w-1/3 text-gray-12'>
                    <button
                      className='flex items-center justify-center gap-1 w-full'
                      onClick={() => handleSort('dueDate')}
                    >
                      지급약정일 {renderSortIcon('dueDate')}
                    </button>
                  </Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell className='w-1/3 text-gray-12'>수정/삭제</Table.ColumnHeaderCell>
                </>
              )}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {sortedTransactions.map((transaction, index) => (
              <Table.Row key={transaction.id}>
                {type === 'construction' ? (
                  <>
                    <Table.Cell className='text-gray-12 text-center'>{transaction.startDate}</Table.Cell>
                    <Table.Cell className='text-gray-12 text-center'>{transaction.endDate}</Table.Cell>
                    <Table.Cell className='text-gray-12 text-center'>
                      {transaction.amount.toLocaleString()}원
                    </Table.Cell>
                    <Table.Cell className='text-gray-12 text-center'>{transaction.dueDate}</Table.Cell>
                  </>
                ) : (
                  <>
                    <Table.Cell className='text-gray- text-center12'>{transaction.transactionDate}</Table.Cell>
                    <Table.Cell className='text-gray-12 text-center'>
                      {transaction.amount.toLocaleString()}원
                    </Table.Cell>
                    <Table.Cell className='text-gray-12 text-center'>{transaction.dueDate}</Table.Cell>
                  </>
                )}
                <Table.Cell>
                  <div className='flex gap-2 justify-center'>
                    <Button variant='outline' color='blue' size='1' onClick={() => handleEdit(index)}>
                      수정
                    </Button>
                    <Button variant='outline' color='red' size='1' onClick={() => handleDelete(index)}>
                      삭제
                    </Button>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
        <Dialog.Close asChild>
          <Button variant='soft' color='gray' className='w-full' onClick={onClose}>
            완료
          </Button>
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Root>
  );
}
