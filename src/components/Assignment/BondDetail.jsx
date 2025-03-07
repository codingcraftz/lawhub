'use client';

import React from 'react';
import { Box, Flex, Text } from '@radix-ui/themes';
import { formatDate, calcInterest } from './bondUtils';

export default function BondDetail({ bond }) {
  if (!bond) {
    return <Text>등록된 채권 정보가 없습니다.</Text>;
  }

  const principal = parseFloat(bond.principal ?? 0);

  // 1차 이자
  const totalInterest1 = calcInterest(
    bond.interest_1_rate,
    bond.interest_1_start_date,
    bond.interest_1_end_date,
    principal
  );

  // 2차 이자
  const totalInterest2 = calcInterest(
    bond.interest_2_rate,
    bond.interest_2_start_date,
    bond.interest_2_end_date,
    principal
  );

  const showInterest1 = bond.interest_1_rate && bond.interest_1_start_date && bond.interest_1_end_date;
  const showInterest2 = bond.interest_2_rate && bond.interest_2_start_date && bond.interest_2_end_date;

  // 비용 배열이 있으면 0보다 큰 항목만 필터링
  const allExpenses = Array.isArray(bond.expenses) ? bond.expenses : [];
  const filteredExpenses = allExpenses.filter((ex) => parseFloat(ex.amount ?? 0) > 0);
  const hasExpenses = filteredExpenses.length > 0;

  return (
    <Box className='p-4 rounded-md bg-gray-3'>
      <Flex direction='column' gap='2'>
        {/* 수임 원금 */}
        <Text>
          <strong>수임 원금:</strong> {principal.toLocaleString()}원
        </Text>

        {/* 1차 이자 */}
        {showInterest1 && (
          <Text>
            <strong>1차 이자:</strong> {Math.floor(totalInterest1).toLocaleString()}원{' '}
            <span className='text-sm text-gray-11'>
              ({formatDate(bond.interest_1_start_date)} ~ {formatDate(bond.interest_1_end_date)})
            </span>
          </Text>
        )}

        {/* 2차 이자 */}
        {showInterest2 && (
          <Text>
            <strong>2차 이자:</strong> {Math.floor(totalInterest2).toLocaleString()}원{' '}
            <span className='text-sm text-gray-11'>
              ({formatDate(bond.interest_2_start_date)} ~ {formatDate(bond.interest_2_end_date)})
            </span>
          </Text>
        )}

        {/* 비용 항목 (필터링된 항목이 있을 때만 표시) */}
        {hasExpenses && (
          <Box>
            <strong>비용 항목:</strong>
            <ul className='list-disc ml-6 mt-1'>
              {filteredExpenses.map((ex, idx) => (
                <li key={idx}>
                  {ex.item}: {parseFloat(ex.amount ?? 0).toLocaleString()}원
                </li>
              ))}
            </ul>
          </Box>
        )}
      </Flex>
    </Box>
  );
}
