// src/app/client/assignment/[id]/BondDetails.jsx

'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Button, Flex, Text, Box } from '@radix-ui/themes';
import { motion } from 'framer-motion';
import BondForm from '../_components/dialogs/BondForm';
import { formatDate, formattedEndDate } from '@/utils/util';

const BondDetails = ({ assignmentId, user }) => {
  const [bond, setBond] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const isAdmin = user?.role === 'staff' || user?.role === 'admin';
  console.log(bond);

  const fetchBond = async () => {
    const { data, error } = await supabase.from('bonds').select('*').eq('assignment_id', assignmentId).maybeSingle();

    if (!error) {
      setBond(data || null);
    }
  };

  useEffect(() => {
    fetchBond();
  }, [assignmentId]);

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    fetchBond();
  };

  if (!bond) {
    return (
      <section className='mb-6 p-4 rounded shadow-md shadow-gray-7 bg-gray-2 text-gray-12'>
        <Flex className='justify-between mb-3'>
          <Text as='h2' className='font-semibold text-lg'>
            채권 정보
          </Text>
          {isAdmin && <Button onClick={() => setIsFormOpen(true)}>등록</Button>}
        </Flex>
        <Text>등록된 채권 정보가 없습니다.</Text>

        <BondForm
          assignmentId={assignmentId}
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          bondData={null}
          onSuccess={handleFormSuccess}
        />
      </section>
    );
  }

  // 이자 계산
  const principal = parseFloat(bond.principal || 0);
  const calcInterest = (rate, sdate, edate) => {
    if (!rate || !sdate || !edate) return 0;
    const start = sdate === 'dynamic' ? new Date() : new Date(sdate);
    const end = edate === 'dynamic' ? new Date() : new Date(edate);
    const diffYears = (end - start) / (1000 * 3600 * 24 * 365.25);
    return principal * (parseFloat(rate) / 100) * Math.max(diffYears, 0);
  };

  const totalInterest1 = calcInterest(bond.interest_1_rate, bond.interest_1_start_date, bond.interest_1_end_date);
  const totalInterest2 = calcInterest(bond.interest_2_rate, bond.interest_2_start_date, bond.interest_2_end_date);

  const totalExpenses = Array.isArray(bond.expenses)
    ? bond.expenses.reduce((sum, ex) => sum + parseFloat(ex.amount || 0), 0)
    : 0;

  const totalAmount = principal + totalInterest1 + totalInterest2 + totalExpenses;

  return (
    <section className='mb-6 p-4 rounded shadow-md shadow-gray-7 bg-gray-2 text-gray-12'>
      <Flex justify='between' align='center' className='mb-3'>
        <Text as='h2' className='font-semibold text-lg'>
          채권 정보
        </Text>
        {isAdmin && <Button onClick={() => setIsFormOpen(true)}>등록/수정</Button>}
      </Flex>

      <Flex justify='between' align='center'>
        <Text as='p' className='text-lg font-bold text-blue-11'>
          {Math.floor(principal).toLocaleString()}원
          {isAdmin && (
            <Text as='p' className='text-base font-normal text-gray-11'>
              원금+비용: {Math.floor(principal + totalExpenses).toLocaleString()}
            </Text>
          )}
        </Text>
        <Button variant='ghost' onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? '닫기' : '상세 보기'}
        </Button>
      </Flex>

      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{
          height: isExpanded ? 'auto' : 0,
          opacity: isExpanded ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
        className='overflow-hidden'
      >
        <Flex direction='column' className='bg-gray-3 rounded p-4 mt-2'>
          <Box mb='3'>
            <Text className='font-semibold'>
              수임 원금:{' '}
              <Text as='span' className='font-normal'>
                {principal.toLocaleString()}원
              </Text>
            </Text>
          </Box>

          <Box mb='3'>
            <Text className='font-semibold mb-1'>
              1차 이자{' '}
              <Text as='span' className='font-normal text-sm'>
                ({formatDate(bond.interest_1_start_date)} ~ {formattedEndDate(bond.interest_1_end_date)})
              </Text>
            </Text>
            <Text as='p' size='2'>
              이자율: {bond.interest_1_rate}%
            </Text>
            <Text size='2'>이자 총액: {Math.floor(totalInterest1).toLocaleString()}원</Text>
          </Box>

          <Box mb='3'>
            <Text className='font-semibold mb-1'>
              2차 이자{' '}
              <Text as='span' className='font-normal text-sm'>
                ({formatDate(bond.interest_2_start_date)} ~ {formattedEndDate(bond.interest_2_end_date)})
              </Text>
            </Text>
            <Text as='p' size='2'>
              이자율: {bond.interest_2_rate}%
            </Text>
            <Text size='2'>이자 총액: {Math.floor(totalInterest2).toLocaleString()}원</Text>
          </Box>
          <Box>
            <Text className='font-semibold mb-1'>비용</Text>
            {(() => {
              // 1) bond.expenses에서 amount가 0보다 큰 항목만 필터링
              const filteredExpenses = bond?.expenses?.filter((expense) => parseInt(expense.amount, 10) > 0) || [];

              // 2) 필터링된 항목이 하나도 없으면 “등록된 비용이 없습니다”
              if (filteredExpenses.length === 0) {
                return (
                  <Text as='p' size='2'>
                    등록된 비용이 없습니다.
                  </Text>
                );
              }

              // 3) 필터링된 항목이 있으면 표시
              return (
                <ul className='list-disc ml-5 space-y-1'>
                  {filteredExpenses.map((expense, idx) => (
                    <li key={idx} className='text-sm'>
                      {expense.item}: {parseInt(expense.amount, 10).toLocaleString()}원
                    </li>
                  ))}
                </ul>
              );
            })()}
          </Box>
        </Flex>
      </motion.div>

      {isFormOpen && (
        <BondForm
          assignmentId={assignmentId}
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          bondData={bond}
          onSuccess={handleFormSuccess}
        />
      )}
    </section>
  );
};

export default BondDetails;
