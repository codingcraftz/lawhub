'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { ArrowLeftIcon } from '@radix-ui/react-icons';
import { Box, Text, Card } from '@radix-ui/themes';
import AssignmentsOverview from '@/components/Assignment/AssignmentsOverview';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const UserBondsPage = () => {
  const router = useRouter();
  const { id: userId } = useParams();
  const [userName, setUserName] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [monthlyData, setMonthlyData] = useState({
    currentMonth: 0,
    lastMonth: 0,
    monthlyAmounts: [],
  });

  // 사용자 이름 불러오기
  const fetchUserName = async () => {
    if (!userId) return;

    const { data: userData, error: userError } = await supabase.from('users').select('name').eq('id', userId).single();

    if (userError) {
      console.error('Error fetching user:', userError);
      return;
    }

    setUserName(userData.name);
  };

  // 사용자의 채권 의뢰 및 회수 데이터 불러오기
  const fetchAssignmentData = async () => {
    if (!userId) return;

    const { data: assignmentData, error: assignmentError } = await supabase
      .from('assignments')
      .select(
        `
        *,
        bonds (*),
        enforcements (
          id,
          type,
          status,
          amount,
          created_at
        ),
        assignment_clients!inner (
          client_id
        )
      `
      )
      .eq('assignment_clients.client_id', userId)
      .eq('type', '채권');

    if (assignmentError) {
      console.error('Error fetching assignments:', assignmentError);
      return;
    }

    setAssignments(assignmentData);

    // 전체 회수 금액 계산
    const allClosedEnforcements = assignmentData.flatMap((assignment) =>
      assignment.enforcements.filter((e) => e.status === 'closed')
    );

    // 현재 월과 지난 달의 회수 금액 계산
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthTotal = allClosedEnforcements
      .filter((e) => {
        const date = new Date(e.created_at);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

    const lastMonthTotal = allClosedEnforcements
      .filter((e) => {
        const date = new Date(e.created_at);
        return date.getMonth() === currentMonth - 1 && date.getFullYear() === currentYear;
      })
      .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

    // 최근 6개월 데이터 계산
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(currentYear, currentMonth - i, 1);
      const monthTotal = allClosedEnforcements
        .filter((e) => {
          const date = new Date(e.created_at);
          return date.getMonth() === targetDate.getMonth() && date.getFullYear() === targetDate.getFullYear();
        })
        .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

      last6Months.push({
        month: `${targetDate.getMonth() + 1}월`,
        amount: monthTotal,
      });
    }

    setMonthlyData({
      currentMonth: currentMonthTotal,
      lastMonth: lastMonthTotal,
      monthlyAmounts: last6Months,
    });
  };

  useEffect(() => {
    fetchUserName();
    fetchAssignmentData();
  }, [userId]);

  // 차트 데이터
  const chartData = {
    labels: monthlyData.monthlyAmounts.map((d) => d.month),
    datasets: [
      {
        label: '회수 금액',
        data: monthlyData.monthlyAmounts.map((d) => d.amount),
        borderColor: '#1c7ed6',
        backgroundColor: 'rgba(28, 126, 214, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: '#1c7ed6',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: function (value) {
            return value.toLocaleString('ko-KR') + '원';
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <Box className='p-4 mx-auto w-full max-w-screen-2xl'>
      <div className='flex items-center gap-2 mb-6'>
        <ArrowLeftIcon className='w-8 h-8 cursor-pointer' onClick={() => router.back()} />
        <h1 className='text-2xl font-bold'>{userName}님의 채권 현황</h1>
      </div>

      {assignments.length > 0 && <AssignmentsOverview assignments={assignments} />}

      <div className='mt-8 space-y-6'>
        <Card className='p-6'>
          <Text size='5' className='font-bold mb-2'>
            이번 달까지 {Math.round(monthlyData.currentMonth).toLocaleString('ko-KR')}원 회수했어요
          </Text>
          <Text className='text-gray-11 mb-4'>
            지난달보다 {Math.round(Math.abs(monthlyData.currentMonth - monthlyData.lastMonth)).toLocaleString('ko-KR')}
            원 {monthlyData.currentMonth > monthlyData.lastMonth ? '더' : '덜'} 회수했어요
          </Text>

          <div className='h-[300px]'>
            <Line data={chartData} options={chartOptions} />
          </div>
        </Card>
      </div>
    </Box>
  );
};

export default UserBondsPage;
