'use client';

import React, { useMemo } from 'react';
import { Box, Flex, Card, Text } from '@radix-ui/themes';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
// import { calculateBondTotal } from "./bondUtils";

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

export default function AssignmentsOverview({ assignments }) {
  const completedCount = useMemo(() => assignments.filter((a) => a.status === 'closed').length, [assignments]);

  const totalCount = assignments.length;

  // 총 수임 원금
  const totalPrincipalAmount = useMemo(() => {
    return assignments.reduce((acc, a) => {
      const bond = a.bonds?.[0];
      return acc + (bond ? parseFloat(bond.principal ?? 0) : 0);
    }, 0);
  }, [assignments]);

  // 총 회수 금액
  const totalCollected = useMemo(() => {
    let sum = 0;
    assignments.forEach((a) => {
      const closedEnf = a.enforcements?.filter((enf) => enf.status === 'closed') || [];
      closedEnf.forEach((enf) => {
        sum += parseFloat(enf.amount ?? 0);
      });
    });
    return sum;
  }, [assignments]);

  // 평균 회수율
  const averageCollectionRate = totalPrincipalAmount > 0 ? (totalCollected / totalPrincipalAmount) * 100 : 0;

  // 도넛 차트 데이터
  const doughnutData = {
    labels: ['회수액', '미회수액'],
    datasets: [
      {
        data: [totalCollected, totalPrincipalAmount - totalCollected],
        backgroundColor: ['#4caf50', '#f44336'], // 녹색 / 빨간색
        hoverBackgroundColor: ['#66bb6a', '#ef5350'],
      },
    ],
  };

  // 도넛 차트 옵션
  const doughnutOptions = {
    responsive: true,
    cutout: '60%',
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 14,
          },
        },
      },
      datalabels: {
        color: '#fff',
        font: {
          weight: 'bold',
          size: 12,
        },
        formatter: (value, ctx) => {
          const dataArr = ctx.chart.data.datasets[0].data;
          const total = (dataArr[0] ?? 0) + (dataArr[1] ?? 0);
          if (!total) return '';
          const percentage = (value / total) * 100;
          return percentage.toFixed(0) + '%';
        },
      },
    },
  };

  return (
    <Flex direction='column' gap='6' className='w-full'>
      {/* 1) 카드 형태 요약 정보 */}
      <Flex
        gap='4'
        wrap='wrap' // 화면이 좁아지면 자동 줄바꿈
        align='start' // 모바일에서 왼쪽 정렬 (원하면 center로 유지 가능)
        justify='center'
        className='mb-6'
      >
        <Card
          variant='surface'
          // 모바일에서는 전체 폭을 차지하고, sm 해상도부터는 오토로 전환
          className='w-full sm:w-auto p-4 min-w-[200px] text-center'
        >
          <Text as='p' size='3' className='text-gray-11 mb-1'>
            총 의뢰 건수
          </Text>
          <Text size='5' className='font-bold'>
            {totalCount}건
          </Text>
        </Card>
        <Card variant='surface' className='w-full sm:w-auto p-4 min-w-[200px] text-center'>
          <Text as='p' size='3' className='text-gray-11 mb-1'>
            완료된 의뢰 건수
          </Text>
          <Text size='5' className='font-bold'>
            {completedCount}건
          </Text>
        </Card>

        <Card variant='surface' className='w-full sm:w-auto p-4 min-w-[200px] text-center'>
          <Text as='p' size='3' className='text-gray-11 mb-1'>
            총 수임 원금
          </Text>
          <Text size='5' className='font-bold'>
            {Math.round(totalPrincipalAmount).toLocaleString('ko-KR')}원
          </Text>
        </Card>

        <Card variant='surface' className='w-full sm:w-auto p-4 min-w-[200px] text-center'>
          <Text as='p' size='3' className='text-gray-11 mb-1'>
            총 회수 금액
          </Text>
          <Text size='5' className='font-bold'>
            {Math.round(totalCollected).toLocaleString('ko-KR')}원
          </Text>
        </Card>

        <Card variant='surface' className='w-full sm:w-auto p-4 min-w-[200px] text-center'>
          <Text as='p' size='3' className='text-gray-11 mb-1'>
            평균 회수율
          </Text>
          <Text size='5' className='font-bold'>
            {averageCollectionRate.toFixed(1)}%
          </Text>
        </Card>
      </Flex>
    </Flex>
  );
}
