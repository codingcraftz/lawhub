'use client';

import React, { useState } from 'react';
import { Flex, Button } from '@radix-ui/themes';

/**
 * @param {Array} assignments - 전체 의뢰 목록
 * @param {Function} setFilteredAssignments - 필터링된 데이터 업데이트 함수
 */
export default function FilterBar({ assignments, setFilteredAssignments }) {
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 전체 | 소송 | 채권
  const [statusFilter, setStatusFilter] = useState('ongoing'); // ✅ 기본값을 진행중으로 설정
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 검색 필터 적용
  const handleFilter = () => {
    let filtered = [...assignments];

    if (searchText.trim()) {
      const searchTerm = searchText.toLowerCase();
      filtered = filtered.filter((a) => {
        const creditorNames = a.assignment_creditors?.map((c) => c.name?.toLowerCase()).join(' ');
        const debtorNames = a.assignment_debtors?.map((d) => d.name?.toLowerCase()).join(' ');
        const desc = a.description?.toLowerCase() || '';

        return creditorNames?.includes(searchTerm) || debtorNames?.includes(searchTerm) || desc.includes(searchTerm);
      });
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((a) => a.type === typeFilter);
    }

    // 현재 선택된 진행 상태에 맞춰 필터링 적용
    filtered = filtered.filter((a) => a.status === statusFilter);

    setFilteredAssignments(filtered);
  };

  // 진행 상태 필터 변경
  const handleStatusChange = (newStatus) => {
    setStatusFilter(newStatus);
    setFilteredAssignments(assignments.filter((a) => a.status === newStatus));
  };

  return (
    <Flex className='my-4 flex flex-col sm:flex-row gap-3 w-full items-center justify-between' wrap='wrap'>
      <div className='flex gap-3 w-full sm:w-auto items-center'>
        {/* 🔍 검색 입력창 */}
        <input
          type='text'
          placeholder='채권자, 채무자, 내용 검색...'
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className='border border-gray-3 bg-gray-1 placeholder-slate-11 px-3 py-2 rounded-md w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-blue-500'
        />

        {/* ⬇️ 유형 필터 (전체 | 소송 | 채권) */}
        <div className='relative w-full sm:w-auto'>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className='w-full sm:w-40 px-4 py-2 border border-gray-3 text-slate-11 rounded-md bg-gray-1 text-left flex justify-between items-center focus:ring-2 focus:ring-blue-500'
          >
            {typeFilter === 'all' ? '전체' : typeFilter === '소송' ? '소송' : '채권'}
            <span className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
          </button>

          {isDropdownOpen && (
            <ul className='absolute z-10 w-full sm:w-40 mt-1 bg-gray-2 border border-gray-3 rounded-md shadow-lg'>
              <li
                className='px-4 py-2 hover:bg-gray-4 cursor-pointer'
                onClick={() => {
                  setTypeFilter('all');
                  setIsDropdownOpen(false);
                }}
              >
                전체
              </li>
              <li
                className='px-4 py-2 hover:bg-gray-4 cursor-pointer'
                onClick={() => {
                  setTypeFilter('소송');
                  setIsDropdownOpen(false);
                }}
              >
                소송
              </li>
              <li
                className='px-4 py-2 hover:bg-gray-4 cursor-pointer'
                onClick={() => {
                  setTypeFilter('채권');
                  setIsDropdownOpen(false);
                }}
              >
                채권
              </li>
            </ul>
          )}
        </div>

        {/* ✅ 필터 적용 버튼 */}
        <Button
          onClick={handleFilter}
          className='bg-blue-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-blue-600 w-full sm:w-auto'
        >
          필터 적용
        </Button>
      </div>

      {/* 🔄 진행 상태 필터 (Tabs 스타일 버튼) - 맨 우측 배치 */}
      <div className='flex items-center gap-2 border border-gray-3 px-4 py-2 rounded-md w-full sm:w-auto'>
        <Button onClick={() => handleStatusChange('ongoing')} color={statusFilter === 'ongoing' ? 'green' : 'gray'}>
          진행중
        </Button>
        <Button           onClick={() => handleStatusChange('closed')} color={statusFilter === "ongoing"?'gray':'red'}>완료</Button>
      </div>
    </Flex>
  );
}
