'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import { Box, Text, Card, Button } from '@radix-ui/themes';
import { useUser } from '@/hooks/useUser';
import AssignmentsOverview from '@/components/Assignment/AssignmentsOverview';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const MyBondsPage = () => {
  const router = useRouter();
  const { user } = useUser();
  const [selectedTab, setSelectedTab] = useState('personal');
  const [userGroups, setUserGroups] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isYearSelectOpen, setIsYearSelectOpen] = useState(false);
  const [monthlyData, setMonthlyData] = useState({
    currentMonth: 0,
    lastMonth: 0,
    monthlyAmounts: [],
    dailyAmounts: [],
  });

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  // 년도 선택 함수
  const selectYear = (year) => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(year);
    setSelectedDate(newDate);
    setIsYearSelectOpen(false);
  };

  // 금액 포맷 함수
  const formatAmount = (amount) => {
    if (!amount || amount < 1000) return '0원';
    return Math.round(amount).toLocaleString('ko-KR') + '원';
  };

  // 월 이동 함수
  const changeMonth = (direction) => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
  };

  // 사용자가 속한 그룹 목록 가져오기
  const fetchUserGroups = async () => {
    if (!user?.id) return;

    const { data: groupData, error: groupError } = await supabase
      .from('group_members')
      .select(
        `
        group_id,
        groups (
          id,
          name
        )
      `
      )
      .eq('user_id', user.id);

    if (groupError) {
      console.error('Error fetching groups:', groupError);
      return;
    }

    setUserGroups(
      groupData.map((g) => ({
        id: g.groups.id,
        name: g.groups.name,
      }))
    );
  };

  // 의뢰 데이터 불러오기 (개인 또는 그룹)
  const fetchAssignmentData = async (type, groupId = null) => {
    if (!user?.id) return;

    let query = supabase
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
        )
      `
      )
      .eq('type', '채권');

    if (type === 'personal') {
      query = query
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
        .eq('assignment_clients.client_id', user.id);
    } else if (type === 'group' && groupId) {
      query = query
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
          assignment_groups!inner (
            group_id
          )
        `
        )
        .eq('assignment_groups.group_id', groupId);
    }

    const { data: assignmentData, error: assignmentError } = await query;

    if (assignmentError) {
      console.error('Error fetching assignments:', assignmentError);
      return;
    }

    setAssignments(assignmentData);

    // 전체 회수 금액 계산
    const allClosedEnforcements = assignmentData.flatMap((assignment) =>
      assignment.enforcements.filter((e) => e.status === 'closed')
    );

    // 선택된 월의 일별 회수 금액 계산
    const selectedYear = selectedDate.getFullYear();
    const selectedMonth = selectedDate.getMonth();
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();

    // 일별 누적 금액 계산
    const dailyAmounts = [];
    let accumulatedAmount = 0;
    const today = new Date();
    const isCurrentMonth =
      selectedDate.getMonth() === today.getMonth() && selectedDate.getFullYear() === today.getFullYear();
    const lastDayToShow = isCurrentMonth ? today.getDate() : lastDay;

    // 1일부터 말일까지 반복
    for (let day = 1; day <= lastDay; day++) {
      if (day <= lastDayToShow) {
        const dayTotal = allClosedEnforcements
          .filter((e) => {
            const enfDate = new Date(e.created_at);
            return (
              enfDate.getDate() === day &&
              enfDate.getMonth() === selectedMonth &&
              enfDate.getFullYear() === selectedYear
            );
          })
          .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
        accumulatedAmount += dayTotal;
      }
      dailyAmounts.push({
        date: `${selectedMonth + 1}.${day}`,
        amount: day <= lastDayToShow ? accumulatedAmount : null,
        showLabel: isCurrentMonth && day === today.getDate(),
      });
    }

    // 최근 4개월 데이터 계산
    const last4Months = [];
    for (let i = 3; i >= 0; i--) {
      const targetDate = new Date(selectedYear, selectedMonth - i, 1);
      const monthTotal = allClosedEnforcements
        .filter((e) => {
          const date = new Date(e.created_at);
          return date.getMonth() === targetDate.getMonth() && date.getFullYear() === targetDate.getFullYear();
        })
        .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
      last4Months.push({
        month: `${targetDate.getMonth() + 1}월`,
        amount: monthTotal,
      });
    }

    setMonthlyData({
      currentMonth: accumulatedAmount,
      lastMonth: last4Months[2].amount, // 이전 달의 금액
      monthlyAmounts: last4Months,
      dailyAmounts,
    });
  };

  useEffect(() => {
    fetchUserGroups();
  }, [user?.id]);

  useEffect(() => {
    if (selectedTab === 'personal') {
      fetchAssignmentData('personal');
    } else {
      fetchAssignmentData('group', selectedTab);
    }
  }, [selectedTab, selectedDate, user?.id]);

  // 누적 금액 라인 차트 데이터

  const lineChartData = {
  labels: monthlyData.dailyAmounts?.map((d) => d.date) || [],
  datasets: [
    {
      label: '누적 회수 금액',
      data: monthlyData.dailyAmounts?.map((d) => d.amount) || [],
      borderColor: 'rgb(42, 122, 221)', // Radix blue9
      backgroundColor: 'rgba(42, 122, 221, 0.1)', 
      tension: 0.4,
      fill: true,
      pointRadius: (context) => {
        if (!monthlyData.dailyAmounts?.[context.dataIndex]) return 0;
        return monthlyData.dailyAmounts[context.dataIndex].showLabel ? 4 : 0;
      },
      pointBackgroundColor: 'rgb(42, 122, 221)',
    },
  ],
};

// Bar 차트 데이터 수정
const barChartData = {
  labels: monthlyData.monthlyAmounts?.map((d) => d.month) || [],
  datasets: [
    {
      label: '월별 회수 금액',
      data: monthlyData.monthlyAmounts?.map((d) => d.amount) || [],
      backgroundColor: (context) => {
        if (!monthlyData.monthlyAmounts) return 'rgba(158, 158, 158, 0.5)';
        const index = context.dataIndex;
        return index === monthlyData.monthlyAmounts.length - 1
          ? 'rgb(42, 122, 221)' // 현재 월: Radix blue9
          : 'rgba(158, 158, 158, 0.5)'; // 이전 월: 회색
      },
      borderRadius: 8,
    },
  ],
};

// 차트 공통 옵션 수정 (scales 부분)
const chartScales = {
  y: {
    beginAtZero: true,
    grid: { color: 'rgba(206, 206, 206, 0.2)' }, // Radix gray6
    ticks: {
      color: 'rgb(82, 82, 82)', // Radix gray11
      callback: (value) => formatAmount(value),
    },
  },
  x: {
    grid: { display: false },
    ticks: { 
      color: 'rgb(82, 82, 82)', // Radix gray11
    },
  },
};
// Line 차트 옵션
const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      enabled: true,
      callbacks: {
        title: (context) => {
          const index = context[0].dataIndex;
          return monthlyData.dailyAmounts?.[index]?.date || '';
        },
        label: (context) => {
          const value = context.raw;
          return value ? `${value.toLocaleString('ko-KR')}원` : '데이터 없음';
        },
      },
    },
  },
  scales: chartScales,
};

// Bar 차트 옵션
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { 
    legend: { display: false }, 
    title: { display: false } 
  },
  scales: chartScales,
};
  // 월별 회수 금액 바 차트 데이터
  const getTabTitle = () => {
    if (selectedTab === 'personal') return '개인 의뢰';
    const group = userGroups.find((g) => g.id === selectedTab);
    return group ? `[${group.name}]` : '';
  };

  return (
    <Box className="p-4 mx-auto w-full sm:px-6 md:px-8 lg:px-12 max-w-[1600px]">
      <div className="flex items-center gap-2 mb-8">
        <ArrowLeftIcon
          className="w-8 h-8 cursor-pointer hover:text-blue-10 transition-colors"
          onClick={() => router.back()}
        />
        <h1 className="text-3xl font-bold text-gray-12">내 채권 현황</h1>
      </div>

      <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
        <Button
          size="3"
          className="min-w-[120px]"
          variant={selectedTab === 'personal' ? 'solid' : 'soft'}
          onClick={() => setSelectedTab('personal')}
        >
          개인 의뢰
        </Button>
        {userGroups.map((group) => (
          <Button
            key={group.id}
            size="3"
            className="min-w-[120px]"
            variant={selectedTab === group.id ? 'solid' : 'soft'}
            onClick={() => setSelectedTab(group.id)}
          >
            {group.name}
          </Button>
        ))}
      </div>

      {assignments.length > 0 && <AssignmentsOverview assignments={assignments} />}

      <div className="mt-10">
        <Card className="p-8 max-w-[1200px] mx-auto bg-gray-1 shadow-md rounded-lg">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-8">
              <div className="relative">
                <Button
                  size="3"
                  variant="soft"
                  onClick={() => setIsYearSelectOpen(!isYearSelectOpen)}
                  className="min-w-[120px] bg-gray-3/50 hover:bg-gray-4/50 text-gray-12"
                >
                  {selectedDate.getFullYear()}년
                </Button>
                {isYearSelectOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-gray-2 rounded-lg shadow-lg border border-gray-4 py-2 z-10">
                    {years.map((year) => (
                      <div
                        key={year}
                        className="px-4 py-2 hover:bg-gray-3/50 cursor-pointer text-gray-11 hover:text-gray-12"
                        onClick={() => selectYear(year)}
                      >
                        {year}년
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 bg-gray-3/50 rounded-full px-4 py-2">
                <Button
                  size="3"
                  variant="ghost"
                  className="hover:bg-gray-4/50 text-gray-11"
                  onClick={() => changeMonth('prev')}
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </Button>
                <Text size="6" className="font-bold min-w-[60px] text-center text-gray-12">
                  {selectedDate.getMonth() + 1}월
                </Text>
                <Button
                  size="3"
                  variant="ghost"
                  className="hover:bg-gray-4/50 text-gray-11"
                  onClick={() => changeMonth('next')}
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex flex-col gap-2 mb-6">
              <h2 className="text-2xl font-bold text-gray-12">{formatAmount(monthlyData.currentMonth)}</h2>
              <div className="flex items-center gap-2 text-gray-11">
                <span>지난달 대비</span>
                <strong className={monthlyData.currentMonth > monthlyData.lastMonth ? 'text-blue-10' : 'text-red-10'}>
                  {formatAmount(Math.abs(monthlyData.currentMonth - monthlyData.lastMonth))}
                </strong>
                <span>{monthlyData.currentMonth > monthlyData.lastMonth ? '증가' : '감소'}</span>
              </div>
            </div>

            <div className="h-[500px] mb-12">
              <Line data={lineChartData} options={lineChartOptions} />
            </div>

            <div className="border-t border-gray-4 pt-8">
              <h3 className="text-xl font-bold mb-6 text-gray-12">최근 4개월 회수 현황</h3>
              <div className="h-[400px]">
                <Bar data={barChartData} options={chartOptions} />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Box>
  );
};

export default MyBondsPage;
