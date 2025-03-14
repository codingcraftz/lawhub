'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import { Box, Text, Card, Button } from '@radix-ui/themes';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

// 목데이터 생성 함수 수정
const generateMockData = (selectedDate = new Date()) => {
  // 사용자 그룹 목데이터
  const mockGroups = [
    { id: 'group-1', name: '대우건설 협력사' },
    { id: 'group-2', name: '씨제이물류 프로젝트' },
    { id: 'group-3', name: '한국감정원' },
  ];

  // 월별 회수 금액 목데이터 생성
  const generateMonthlyData = () => {
    // 총 채권 금액과 회수율 데이터
    const totalDebtAmount = Math.floor(Math.random() * 3000000000) + 1000000000;
    const totalRecoveredAmount = Math.floor(Math.random() * totalDebtAmount * 0.7);
    const recoveryRate = ((totalRecoveredAmount / totalDebtAmount) * 100).toFixed(1);

    // 최근 6개월 데이터 (선택된 날짜 기준) - 누적 회수액
    const months = [];
    let cumulativeAmount = totalRecoveredAmount * 0.3; // 시작점을 총액의 30%로

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(selectedDate);
      monthDate.setMonth(selectedDate.getMonth() - i);

      // 매월 누적 회수액이 증가하도록
      const monthlyIncrease = Math.floor(Math.random() * 50000000) + 10000000;
      cumulativeAmount += monthlyIncrease;

      // 총 금액을 넘지 않도록
      const amount = Math.min(cumulativeAmount, totalRecoveredAmount);

      months.push({
        month: `${monthDate.getMonth() + 1}월`,
        amount: amount,
        recoveryRate: ((amount / totalDebtAmount) * 100).toFixed(1), // 월별 회수율
      });
    }

    // 일별 누적 금액 - 선택된 날짜 기준
    const days = [];
    const selectedYear = selectedDate.getFullYear();
    const selectedMonth = selectedDate.getMonth();
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    let accumulatedAmount = 0;

    // 현재 날짜와 선택된 날짜 비교
    const today = new Date();
    const isCurrentMonth =
      selectedDate.getMonth() === today.getMonth() && selectedDate.getFullYear() === today.getFullYear();
    const lastDayToShow = isCurrentMonth ? today.getDate() : daysInMonth;

    for (let day = 1; day <= daysInMonth; day++) {
      if (day > lastDayToShow && isCurrentMonth) {
        days.push({
          date: `${selectedMonth + 1}.${day}`,
          amount: null,
          showLabel: false,
        });
        continue;
      }

      // 일별 랜덤 증가액
      const dailyIncrease = Math.floor(Math.random() * 5000000) + 1000000;
      accumulatedAmount += dailyIncrease;

      days.push({
        date: `${selectedMonth + 1}.${day}`,
        amount: accumulatedAmount,
        showLabel: isCurrentMonth && day === today.getDate(),
      });
    }

    // 채권 종류별 회수율 데이터
    const debtCategories = [
      { name: '집행권원 보유', amount: Math.floor(Math.random() * 1000000000) + 200000000 },
      { name: '집행권원 미보유', amount: Math.floor(Math.random() * 800000000) + 150000000 },
      { name: '악성 채권', amount: Math.floor(Math.random() * 600000000) + 100000000 },
    ];

    // 각 채권 종류별 회수액 계산
    debtCategories.forEach((category) => {
      category.recovered = Math.floor(Math.random() * category.amount * 0.9);
      category.recoveryRate = ((category.recovered / category.amount) * 100).toFixed(1);
    });

    return {
      totalDebtAmount,
      totalRecoveredAmount,
      recoveryRate,
      monthlyAmounts: months,
      debtCategories,
      dailyAmounts: days,
    };
  };

  // 의뢰 데이터 생성
  const generateAssignments = () => {
    const assignmentTypes = ['회생채권', '공사대금', '매매대금', '임대차보증금', '대여금'];
    const statuses = ['진행 중', '회수 완료', '일부 회수', '회수 불가'];
    const assignmentCount = Math.floor(Math.random() * 5) + 5; // 5-10개 의뢰

    const assignments = [];

    for (let i = 0; i < assignmentCount; i++) {
      const totalAmount = Math.floor(Math.random() * 500000000) + 50000000;
      const recoveredAmount = Math.floor(Math.random() * totalAmount);

      assignments.push({
        id: `assign-${i}`,
        title: `${assignmentTypes[Math.floor(Math.random() * assignmentTypes.length)]} 채권`,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        debtor_name: `${['주식회사', '유한회사'][Math.floor(Math.random() * 2)]} ${
          ['대한', '서울', '미래', '한국', '글로벌'][Math.floor(Math.random() * 5)]
        }${['산업', '건설', '전자', '물류', '기업'][Math.floor(Math.random() * 5)]}`,
        created_at: new Date(Date.now() - Math.floor(Math.random() * 10000000000)),
        bonds: {
          original_amount: totalAmount,
          recovered_amount: recoveredAmount,
          recovery_rate: ((recoveredAmount / totalAmount) * 100).toFixed(1),
        },
      });
    }

    return assignments;
  };

  return {
    groups: mockGroups,
    monthlyData: generateMonthlyData(),
    assignments: generateAssignments(),
  };
};

const MyBondsMockPage = () => {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState('personal');
  const [userGroups, setUserGroups] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isYearSelectOpen, setIsYearSelectOpen] = useState(false);
  const [monthlyData, setMonthlyData] = useState({
    totalDebtAmount: 0,
    totalRecoveredAmount: 0,
    recoveryRate: 0,
    monthlyAmounts: [],
    debtCategories: [],
    dailyAmounts: [],
  });

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  // 목데이터 로드 - 선택된 날짜 전달
  useEffect(() => {
    const mockData = generateMockData(selectedDate);
    setUserGroups(mockData.groups);
    setMonthlyData(mockData.monthlyData);
    setAssignments(mockData.assignments);
  }, []);

  // 탭/날짜 변경시 새 목데이터 로드 - 선택된 날짜 전달
  useEffect(() => {
    const mockData = generateMockData(selectedDate);
    setMonthlyData(mockData.monthlyData);
    setAssignments(mockData.assignments);
  }, [selectedTab, selectedDate]);

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

  // Bar 차트 데이터
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

  // 차트 공통 옵션
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
            return monthlyData.monthlyAmounts?.[index]?.month || '';
          },
          label: (context) => {
            const value = context.raw;
            return [
              `누적 회수액: ${value ? value.toLocaleString('ko-KR') + '원' : '데이터 없음'}`,
              `회수율: ${monthlyData.monthlyAmounts?.[context.dataIndex]?.recoveryRate || 0}%`,
            ];
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
      title: { display: false },
    },
    scales: chartScales,
  };

  // 채권 유형별 회수율 데이터 (도넛 차트용)
  const doughnutChartData = {
    labels: monthlyData.debtCategories?.map((c) => c.name) || [],
    datasets: [
      {
        data: monthlyData.debtCategories?.map((c) => c.recoveryRate) || [],
        backgroundColor: [
          'rgba(42, 122, 221, 0.8)', // blue
          'rgba(76, 175, 80, 0.8)', // green
          'rgba(255, 152, 0, 0.8)', // orange
          'rgba(156, 39, 176, 0.8)', // purple
          'rgba(244, 67, 54, 0.8)', // red
        ],
        borderColor: 'rgb(255, 255, 255)',
        borderWidth: 1,
      },
    ],
  };

  // 도넛 차트 옵션
  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: 'rgb(82, 82, 82)',
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const category = monthlyData.debtCategories?.[context.dataIndex];
            if (!category) return '';
            return [
              `회수율: ${category.recoveryRate}%`,
              `채권액: ${formatAmount(category.amount)}`,
              `회수액: ${formatAmount(category.recovered)}`,
            ];
          },
        },
      },
    },
  };

  // 의뢰 요약 컴포넌트 개선
  const AssignmentsOverview = ({ assignments, monthlyData }) => {
    // ... existing code ...

    return (
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10'>
        <div className='bg-blue-2 border border-blue-6 rounded-lg p-6 shadow-sm'>
          <p className='text-gray-11 text-sm mb-2'>총 채권액</p>
          <p className='text-blue-11 text-2xl font-bold mb-1'>{formatAmount(monthlyData.totalDebtAmount)}</p>
          <p className='text-gray-11 text-sm'>전체 {assignments.length}건</p>
        </div>

        <div className='bg-green-2 border border-green-6 rounded-lg p-6 shadow-sm'>
          <p className='text-gray-11 text-sm mb-2'>총 회수액</p>
          <p className='text-green-11 text-2xl font-bold mb-1'>{formatAmount(monthlyData.totalRecoveredAmount)}</p>
          <div className='flex items-center'>
            <div className='w-full bg-gray-4 rounded-full h-2'>
              <div className='bg-green-9 h-2 rounded-full' style={{ width: `${monthlyData.recoveryRate}%` }}></div>
            </div>
            <span className='text-gray-11 text-sm ml-2'>{monthlyData.recoveryRate}%</span>
          </div>
        </div>

        <div className='bg-orange-2 border border-orange-6 rounded-lg p-6 shadow-sm'>
          <p className='text-gray-11 text-sm mb-2'>회수 진행 중</p>
          <p className='text-orange-11 text-2xl font-bold mb-1'>
            {formatAmount(monthlyData.totalDebtAmount - monthlyData.totalRecoveredAmount)}
          </p>
          <p className='text-gray-11 text-sm'>미회수율 {(100 - monthlyData.recoveryRate).toFixed(1)}%</p>
        </div>

        <div className='bg-blue-2 border border-blue-6 rounded-lg p-6 shadow-sm'>
          <p className='text-gray-11 text-sm mb-2'>예상 최종 회수액</p>
          <p className='text-blue-11 text-2xl font-bold mb-1'>{formatAmount(monthlyData.totalRecoveredAmount * 1.2)}</p>
          <p className='text-gray-11 text-sm'>
            예상 회수율 {Math.min(100, (monthlyData.recoveryRate * 1.2).toFixed(1))}%
          </p>
        </div>
      </div>
    );
  };

  // 탭 제목 가져오기
  const getTabTitle = () => {
    if (selectedTab === 'personal') return '개인 의뢰';
    const group = userGroups.find((g) => g.id === selectedTab);
    return group ? `[${group.name}]` : '';
  };

  return (
    <Box className='p-4 mx-auto w-full sm:px-6 md:px-8 lg:px-12 max-w-[1600px] bg-gray-2'>
      <div className='flex items-center gap-2 mb-8'>
        <ArrowLeftIcon
          className='w-8 h-8 cursor-pointer hover:text-blue-10 transition-colors'
          onClick={() => router.back()}
        />
        <h1 className='text-3xl font-bold text-gray-12'>채권 회수 현황</h1>
      </div>

      <div className='flex gap-3 mb-8 overflow-x-auto pb-2'>
        <Button
          size='3'
          className='min-w-[120px]'
          variant={selectedTab === 'personal' ? 'solid' : 'soft'}
          onClick={() => setSelectedTab('personal')}
        >
          개인 의뢰
        </Button>
        {userGroups.map((group) => (
          <Button
            key={group.id}
            size='3'
            className='min-w-[120px]'
            variant={selectedTab === group.id ? 'solid' : 'soft'}
            onClick={() => setSelectedTab(group.id)}
          >
            {group.name}
          </Button>
        ))}
      </div>

      <h2 className='text-2xl font-bold text-gray-12 mb-6'>{getTabTitle()} 채권 현황</h2>

      {assignments.length > 0 && <AssignmentsOverview assignments={assignments} monthlyData={monthlyData} />}

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10'>
        {/* 총 회수액 차트 */}
        <div className='bg-gray-1 rounded-lg shadow-md p-6 border border-gray-5'>
          <h3 className='text-xl font-bold mb-6 text-gray-12'>누적 회수 실적</h3>

          {/* 연도 및 월 선택 UI */}
          <div className='flex items-center justify-between mb-6'>
            <div className='relative'>
              <Button
                size='2'
                variant='soft'
                onClick={() => setIsYearSelectOpen(!isYearSelectOpen)}
                className='bg-gray-3/50 hover:bg-gray-4/50 text-gray-12'
              >
                {selectedDate.getFullYear()}년
              </Button>
              {isYearSelectOpen && (
                <div className='absolute top-full left-0 mt-1 bg-gray-2 rounded-lg shadow-lg border border-gray-4 py-2 z-10'>
                  {years.map((year) => (
                    <div
                      key={year}
                      className='px-4 py-2 hover:bg-gray-3/50 cursor-pointer text-gray-11 hover:text-gray-12'
                      onClick={() => selectYear(year)}
                    >
                      {year}년
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className='flex items-center gap-4 bg-gray-3/50 rounded-full px-4 py-2'>
              <Button
                size='1'
                variant='ghost'
                className='hover:bg-gray-4/50 text-gray-11'
                onClick={() => changeMonth('prev')}
              >
                <ChevronLeftIcon className='w-4 h-4' />
              </Button>
              <p className='font-semibold text-gray-12 min-w-[50px] text-center'>{selectedDate.getMonth() + 1}월</p>
              <Button
                size='1'
                variant='ghost'
                className='hover:bg-gray-4/50 text-gray-11'
                onClick={() => changeMonth('next')}
              >
                <ChevronRightIcon className='w-4 h-4' />
              </Button>
            </div>
          </div>

          {/* 현재 회수액 및 회수율 표시 */}
          <div className='mb-4 flex items-end justify-between'>
            <div>
              <p className='text-gray-11 text-sm'>현재 총 회수액</p>
              <p className='text-2xl font-bold text-blue-11'>{formatAmount(monthlyData.totalRecoveredAmount)}</p>
            </div>
            <div className='text-right'>
              <p className='text-gray-11 text-sm'>회수율</p>
              <p className='text-2xl font-bold text-green-11'>{monthlyData.recoveryRate}%</p>
            </div>
          </div>

          {/* 회수액 차트 */}
          <div className='h-[300px] mt-6'>
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </div>

        {/* 채권 종류별 회수율 */}
        <div className='bg-gray-1 rounded-lg shadow-md p-6 border border-gray-5'>
          <h3 className='text-xl font-bold mb-6 text-gray-12'>채권 종류별 회수율</h3>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='h-[280px] flex items-center justify-center'>
              <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
            </div>

            <div className='space-y-4'>
              {monthlyData.debtCategories?.map((category, idx) => (
                <div key={idx} className='bg-gray-2 p-4 rounded-lg border border-gray-4'>
                  <div className='flex justify-between items-center mb-2'>
                    <p className='font-semibold text-gray-12'>{category.name}</p>
                    <p className='text-sm font-bold text-blue-11'>{category.recoveryRate}%</p>
                  </div>
                  <div className='w-full bg-gray-4 rounded-full h-2 mb-2'>
                    <div
                      className={`h-2 rounded-full ${
                        idx === 0
                          ? 'bg-blue-9'
                          : idx === 1
                          ? 'bg-green-9'
                          : idx === 2
                          ? 'bg-orange-9'
                          : idx === 3
                          ? 'bg-violet-9'
                          : 'bg-red-9'
                      }`}
                      style={{ width: `${category.recoveryRate}%` }}
                    ></div>
                  </div>
                  <div className='flex justify-between text-xs text-gray-11'>
                    <span>총액: {formatAmount(category.amount)}</span>
                    <span>회수액: {formatAmount(category.recovered)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 의뢰 목록 테이블 */}
      <div className='mt-12 bg-gray-1 rounded-lg shadow-md p-6 border border-gray-5'>
        <h2 className='text-xl font-bold mb-6 text-gray-12'>채권 의뢰 목록</h2>

        <div className='overflow-x-auto'>
          <table className='w-full min-w-[800px] border-collapse'>
            <thead>
              <tr className='bg-gray-3'>
                <th className='p-4 text-left text-gray-12 font-semibold border-b border-gray-5'>의뢰 제목</th>
                <th className='p-4 text-left text-gray-12 font-semibold border-b border-gray-5'>채무자</th>
                <th className='p-4 text-left text-gray-12 font-semibold border-b border-gray-5'>원금액</th>
                <th className='p-4 text-left text-gray-12 font-semibold border-b border-gray-5'>회수액</th>
                <th className='p-4 text-left text-gray-12 font-semibold border-b border-gray-5'>회수율</th>
                <th className='p-4 text-left text-gray-12 font-semibold border-b border-gray-5'>상태</th>
                <th className='p-4 text-left text-gray-12 font-semibold border-b border-gray-5'>액션</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((assignment) => (
                <tr key={assignment.id} className='hover:bg-gray-2 transition-colors'>
                  <td className='p-4 border-b border-gray-4 text-gray-12 font-medium'>{assignment.title}</td>
                  <td className='p-4 border-b border-gray-4 text-gray-12'>{assignment.debtor_name}</td>
                  <td className='p-4 border-b border-gray-4 text-gray-12'>
                    {formatAmount(assignment.bonds.original_amount)}
                  </td>
                  <td className='p-4 border-b border-gray-4 text-gray-12'>
                    {formatAmount(assignment.bonds.recovered_amount)}
                  </td>
                  <td className='p-4 border-b border-gray-4'>
                    <div className='flex items-center gap-2'>
                      <div className='w-16 bg-gray-4 rounded-full h-1.5'>
                        <div
                          className={`h-1.5 rounded-full ${
                            parseFloat(assignment.bonds.recovery_rate) > 80
                              ? 'bg-green-9'
                              : parseFloat(assignment.bonds.recovery_rate) > 50
                              ? 'bg-blue-9'
                              : parseFloat(assignment.bonds.recovery_rate) > 20
                              ? 'bg-orange-9'
                              : 'bg-red-9'
                          }`}
                          style={{ width: `${assignment.bonds.recovery_rate}%` }}
                        ></div>
                      </div>
                      <span className='text-gray-12'>{assignment.bonds.recovery_rate}%</span>
                    </div>
                  </td>
                  <td className='p-4 border-b border-gray-4'>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        assignment.status === '회수 완료'
                          ? 'bg-green-3 text-green-11'
                          : assignment.status === '일부 회수'
                          ? 'bg-blue-3 text-blue-11'
                          : assignment.status === '회수 불가'
                          ? 'bg-red-3 text-red-11'
                          : 'bg-gray-3 text-gray-11'
                      }`}
                    >
                      {assignment.status}
                    </span>
                  </td>
                  <td className='p-4 border-b border-gray-4'>
                    <Button
                      size='1'
                      variant='soft'
                      className='bg-blue-3 text-blue-11 hover:bg-blue-4'
                      onClick={() => router.push(`/test/my-bonds/${assignment.id}`)}
                    >
                      상세보기
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Box>
  );
};

export default MyBondsMockPage;
