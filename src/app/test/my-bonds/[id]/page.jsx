'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeftIcon,
  CheckCircledIcon,
  CrossCircledIcon,
  ClockIcon,
  InfoCircledIcon,
  CalendarIcon,
  FileTextIcon,
  QuestionMarkCircledIcon,
  ExclamationTriangleIcon,
  EnterIcon,
  ExitIcon,
  ChatBubbleIcon,
  PersonIcon,
  PlusIcon,
} from '@radix-ui/react-icons';
import { Box, Button } from '@radix-ui/themes';
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
  ArcElement,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

const BondDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const bondId = params.id;
  const [bondDetail, setBondDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  // 가짜 데이터 생성 함수를 확장하여 모든 탭에 필요한 데이터 추가
  const generateMockBondDetail = (id) => {
    const bondTypes = ['회생채권', '공사대금', '매매대금', '임대차보증금', '대여금'];
    const bondTypeIndex = parseInt(id.split('-')[1]) % bondTypes.length;
    const bondType = bondTypes[bondTypeIndex];

    const originalAmount = Math.floor(Math.random() * 500000000) + 50000000;
    const recoveredAmount = Math.floor(Math.random() * originalAmount);
    const recoveryRate = ((recoveredAmount / originalAmount) * 100).toFixed(1);

    const statuses = ['진행 중', '회수 완료', '일부 회수', '회수 불가'];
    const statusIndex = parseInt(id.split('-')[1]) % statuses.length;
    const status = statuses[statusIndex];

    // 채권 발생일 (1~3년 전)
    const createdDate = new Date();
    createdDate.setFullYear(createdDate.getFullYear() - (Math.floor(Math.random() * 3) + 1));

    // 채무자 정보
    const debtorName = `${['주식회사', '유한회사'][Math.floor(Math.random() * 2)]} ${
      ['대한', '서울', '미래', '한국', '글로벌'][Math.floor(Math.random() * 5)]
    }${['산업', '건설', '전자', '물류', '기업'][Math.floor(Math.random() * 5)]}`;

    // 회수 내역
    const recoveryCount = Math.floor(Math.random() * 5) + 1;
    const recoveryHistory = [];
    let recoveredTotal = 0;

    for (let i = 0; i < recoveryCount; i++) {
      const recoveryDate = new Date(createdDate);
      recoveryDate.setMonth(recoveryDate.getMonth() + Math.floor(Math.random() * 12) + 1);

      const amount =
        i === recoveryCount - 1 ? recoveredAmount - recoveredTotal : Math.floor(Math.random() * (recoveredAmount / 2));

      recoveredTotal += amount;

      recoveryHistory.push({
        id: `recovery-${i}`,
        date: recoveryDate,
        amount: amount,
        method: ['법원 강제집행', '임의변제', '경매 배당', '약식 기일'][Math.floor(Math.random() * 4)],
        note: ['채무자가 일부 변제함', '강제집행으로 회수', '채무자 재산 추심', '합의 후 변제'][
          Math.floor(Math.random() * 4)
        ],
      });
    }

    // 정렬: 최신 날짜순
    recoveryHistory.sort((a, b) => b.date - a.date);

    // 주요 이벤트 타임라인
    const timeline = [
      {
        id: 'event-1',
        date: new Date(createdDate),
        title: '채권 발생',
        description: `${bondType} 채권 ${formatAmount(originalAmount)} 발생`,
        type: 'start',
      },
    ];

    // 법적 조치 추가
    if (Math.random() > 0.3) {
      const legalActionDate = new Date(createdDate);
      legalActionDate.setMonth(legalActionDate.getMonth() + Math.floor(Math.random() * 3) + 1);

      timeline.push({
        id: 'event-2',
        date: legalActionDate,
        title: '법적 조치 진행',
        description: ['소송 제기', '가압류 신청', '가처분 신청', '지급명령 신청'][Math.floor(Math.random() * 4)],
        type: 'legal',
      });
    }

    // 판결/결정 추가
    if (Math.random() > 0.4) {
      const judgmentDate = new Date(createdDate);
      judgmentDate.setMonth(judgmentDate.getMonth() + Math.floor(Math.random() * 6) + 3);

      timeline.push({
        id: 'event-3',
        date: judgmentDate,
        title: '판결/결정',
        description: ['승소 판결', '화해 권고 결정', '조정 성립', '이행권고결정'][Math.floor(Math.random() * 4)],
        type: 'judgment',
      });
    }

    // 회수 내역 이벤트 추가
    recoveryHistory.forEach((recovery, index) => {
      timeline.push({
        id: `event-recovery-${index}`,
        date: recovery.date,
        title: `회수 ${index + 1}차`,
        description: `${formatAmount(recovery.amount)} ${recovery.method}`,
        type: 'recovery',
      });
    });

    // 시간순 정렬
    timeline.sort((a, b) => a.date - b.date);

    // 관련 문서
    const documents = [
      {
        id: 'doc-1',
        title: '채권양도 계약서',
        type: 'pdf',
        date: new Date(createdDate),
        size: '1.2MB',
      },
      {
        id: 'doc-2',
        title: '채무 확인서',
        type: 'pdf',
        date: new Date(createdDate),
        size: '0.8MB',
      },
    ];

    // 판결문이 있는 경우 추가
    const judgmentEvent = timeline.find((t) => t.type === 'judgment');
    if (judgmentEvent) {
      documents.push({
        id: 'doc-3',
        title: '판결문',
        type: 'pdf',
        date: judgmentEvent.date,
        size: '2.5MB',
      });
    }

    // 메모
    const memos = [
      {
        id: 'memo-1',
        date: new Date(createdDate.getTime() + 1000 * 60 * 60 * 24 * 5),
        writer: '김담당',
        content: '채무자 최초 접촉. 변제 의사 확인 중.',
      },
    ];

    // 추가 메모
    if (timeline.find((t) => t.type === 'legal')) {
      memos.push({
        id: 'memo-2',
        date: new Date(timeline.find((t) => t.type === 'legal').date),
        writer: '박변호사',
        content: '채무자 연락 두절. 법적 조치 검토 중.',
      });
    }

    return {
      id,
      title: `${bondType} 채권`,
      debtor: {
        name: debtorName,
        representative: `${['김', '이', '박', '최', '정'][Math.floor(Math.random() * 5)]}${
          ['대표', '사장', '이사', '회장'][Math.floor(Math.random() * 4)]
        }`,
        address: `서울시 ${['강남구', '서초구', '종로구', '마포구', '영등포구'][Math.floor(Math.random() * 5)]}`,
        contact: `010-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
        businessNumber: `${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 90) + 10}-${
          Math.floor(Math.random() * 90000) + 10000
        }`,
      },
      bonds: {
        original_amount: originalAmount,
        recovered_amount: recoveredAmount,
        recovery_rate: recoveryRate,
        bond_type: bondType,
        created_at: createdDate,
        status: status,
      },
      recovery_history: recoveryHistory,
      timeline: timeline,
      documents: documents,
      memos: memos,
    };
  };

  // 날짜 포맷 함수
  const formatDate = (date) => {
    if (!date) return '';
    return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
  };

  // 금액 포맷 함수
  const formatAmount = (amount) => {
    if (!amount || amount < 1000) return '0원';
    return Math.round(amount).toLocaleString('ko-KR') + '원';
  };

  // 상태에 따른 스타일 및 아이콘
  const getStatusStyle = (status) => {
    switch (status) {
      case '회수 완료':
        return {
          bgColor: 'bg-green-3',
          textColor: 'text-green-11',
          icon: <CheckCircledIcon className='w-4 h-4 text-green-11' />,
        };
      case '일부 회수':
        return {
          bgColor: 'bg-blue-3',
          textColor: 'text-blue-11',
          icon: <InfoCircledIcon className='w-4 h-4 text-blue-11' />,
        };
      case '회수 불가':
        return {
          bgColor: 'bg-red-3',
          textColor: 'text-red-11',
          icon: <CrossCircledIcon className='w-4 h-4 text-red-11' />,
        };
      default:
        return {
          bgColor: 'bg-orange-3',
          textColor: 'text-orange-11',
          icon: <ClockIcon className='w-4 h-4 text-orange-11' />,
        };
    }
  };

  // 이벤트 타입에 따른 스타일 지정 함수
  const getEventStyle = (type) => {
    switch (type) {
      case 'start':
        return {
          bgColor: 'bg-blue-9',
          icon: <CalendarIcon className='w-4 h-4 text-white' />,
        };
      case 'legal':
        return {
          bgColor: 'bg-orange-9',
          icon: <FileTextIcon className='w-4 h-4 text-white' />,
        };
      case 'judgment':
        return {
          bgColor: 'bg-violet-9',
          icon: <InfoCircledIcon className='w-4 h-4 text-white' />,
        };
      case 'recovery':
        return {
          bgColor: 'bg-green-9',
          icon: <CheckCircledIcon className='w-4 h-4 text-white' />,
        };
      default:
        return {
          bgColor: 'bg-gray-9',
          icon: <QuestionMarkCircledIcon className='w-4 h-4 text-white' />,
        };
    }
  };

  // 데이터 로드
  useEffect(() => {
    setLoading(true);

    // 가짜 데이터 로드 (실제로는 API 호출)
    setTimeout(() => {
      const mockData = generateMockBondDetail(bondId);
      setBondDetail(mockData);
      setLoading(false);
    }, 500);
  }, [bondId]);

  if (loading) {
    return (
      <Box className='flex items-center justify-center h-screen bg-gray-2'>
        <div className='text-xl text-gray-11'>로딩 중...</div>
      </Box>
    );
  }

  if (!bondDetail) {
    return (
      <Box className='flex items-center justify-center h-screen bg-gray-2'>
        <div className='text-xl text-red-11'>채권 정보를 찾을 수 없습니다.</div>
      </Box>
    );
  }

  const statusStyle = getStatusStyle(bondDetail.bonds.status);

  return (
    <Box className='p-4 mx-auto w-full sm:px-6 md:px-8 lg:px-12 max-w-[1600px] bg-gray-2 min-h-screen'>
      {/* 헤더 */}
      <div className='flex items-center justify-between mb-8'>
        <div className='flex items-center gap-2'>
          <ArrowLeftIcon
            className='w-8 h-8 cursor-pointer hover:text-blue-10 transition-colors'
            onClick={() => router.back()}
          />
          <h1 className='text-3xl font-bold text-gray-12'>{bondDetail.title}</h1>
          <div
            className={`ml-4 px-3 py-1 rounded-full flex items-center gap-1 ${statusStyle.bgColor} ${statusStyle.textColor}`}
          >
            {statusStyle.icon}
            <span>{bondDetail.bonds.status}</span>
          </div>
        </div>

        <div className='flex gap-2'>
          <Button size='3' variant='soft' color='gray'>
            수정
          </Button>
          <Button size='3' variant='solid' color='blue'>
            회수 내역 추가
          </Button>
        </div>
      </div>

      {/* 주요 정보 카드 */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
        <div className='bg-blue-2 border border-blue-6 rounded-lg p-6 shadow-sm'>
          <p className='text-gray-11 text-sm mb-2'>채권액</p>
          <p className='text-blue-11 text-2xl font-bold'>{formatAmount(bondDetail.bonds.original_amount)}</p>
          <p className='text-gray-11 text-sm mt-1'>발생일: {formatDate(bondDetail.bonds.created_at)}</p>
        </div>

        <div className='bg-green-2 border border-green-6 rounded-lg p-6 shadow-sm'>
          <p className='text-gray-11 text-sm mb-2'>회수액</p>
          <p className='text-green-11 text-2xl font-bold'>{formatAmount(bondDetail.bonds.recovered_amount)}</p>
          <div className='flex items-center mt-1'>
            <div className='w-full bg-gray-4 rounded-full h-2'>
              <div
                className='bg-green-9 h-2 rounded-full'
                style={{ width: `${bondDetail.bonds.recovery_rate}%` }}
              ></div>
            </div>
            <span className='text-gray-11 text-sm ml-2'>{bondDetail.bonds.recovery_rate}%</span>
          </div>
        </div>

        <div className='bg-orange-2 border border-orange-6 rounded-lg p-6 shadow-sm'>
          <p className='text-gray-11 text-sm mb-2'>미회수액</p>
          <p className='text-orange-11 text-2xl font-bold'>
            {formatAmount(bondDetail.bonds.original_amount - bondDetail.bonds.recovered_amount)}
          </p>
          <p className='text-gray-11 text-sm mt-1'>
            미회수율: {(100 - parseFloat(bondDetail.bonds.recovery_rate)).toFixed(1)}%
          </p>
        </div>

        <div className='bg-blue-2 border border-blue-6 rounded-lg p-6 shadow-sm'>
          <p className='text-gray-11 text-sm mb-2'>채무자</p>
          <p className='text-blue-11 text-xl font-bold'>{bondDetail.debtor.name}</p>
          <p className='text-gray-11 text-sm mt-1'>대표: {bondDetail.debtor.representative}</p>
        </div>
      </div>

      {/* 탭 메뉴 */}
      <div className='bg-gray-1 rounded-lg shadow-md border border-gray-5 mb-8'>
        <div className='border-b border-gray-4'>
          <div className='flex'>
            <button
              className={`px-6 py-4 font-medium text-sm border-b-2 ${
                activeTab === 'info'
                  ? 'border-blue-9 text-blue-11'
                  : 'border-transparent text-gray-11 hover:text-gray-12'
              }`}
              onClick={() => setActiveTab('info')}
            >
              기본 정보
            </button>
            <button
              className={`px-6 py-4 font-medium text-sm border-b-2 ${
                activeTab === 'timeline'
                  ? 'border-blue-9 text-blue-11'
                  : 'border-transparent text-gray-11 hover:text-gray-12'
              }`}
              onClick={() => setActiveTab('timeline')}
            >
              진행 내역
            </button>
            <button
              className={`px-6 py-4 font-medium text-sm border-b-2 ${
                activeTab === 'recovery'
                  ? 'border-blue-9 text-blue-11'
                  : 'border-transparent text-gray-11 hover:text-gray-12'
              }`}
              onClick={() => setActiveTab('recovery')}
            >
              회수 내역
            </button>
            <button
              className={`px-6 py-4 font-medium text-sm border-b-2 ${
                activeTab === 'docs'
                  ? 'border-blue-9 text-blue-11'
                  : 'border-transparent text-gray-11 hover:text-gray-12'
              }`}
              onClick={() => setActiveTab('docs')}
            >
              문서 및 메모
            </button>
          </div>
        </div>

        <div className='p-6'>
          {/* 기본 정보 탭 내용 */}
          {activeTab === 'info' && (
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
              <div>
                <h3 className='text-lg font-semibold mb-4 text-gray-12'>채무자 정보</h3>
                <div className='space-y-4'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='bg-gray-2 p-4 rounded-lg'>
                      <p className='text-sm text-gray-11 mb-1'>회사명</p>
                      <p className='font-medium text-gray-12'>{bondDetail.debtor.name}</p>
                    </div>
                    <div className='bg-gray-2 p-4 rounded-lg'>
                      <p className='text-sm text-gray-11 mb-1'>대표자</p>
                      <p className='font-medium text-gray-12'>{bondDetail.debtor.representative}</p>
                    </div>
                  </div>

                  <div className='bg-gray-2 p-4 rounded-lg'>
                    <p className='text-sm text-gray-11 mb-1'>사업자등록번호</p>
                    <p className='font-medium text-gray-12'>{bondDetail.debtor.businessNumber}</p>
                  </div>

                  <div className='bg-gray-2 p-4 rounded-lg'>
                    <p className='text-sm text-gray-11 mb-1'>주소</p>
                    <p className='font-medium text-gray-12'>{bondDetail.debtor.address}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className='text-lg font-semibold mb-4 text-gray-12'>채권 정보</h3>
                <div className='space-y-4'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='bg-gray-2 p-4 rounded-lg'>
                      <p className='text-sm text-gray-11 mb-1'>채권 종류</p>
                      <p className='font-medium text-gray-12'>{bondDetail.bonds.bond_type}</p>
                    </div>
                    <div className='bg-gray-2 p-4 rounded-lg'>
                      <p className='text-sm text-gray-11 mb-1'>채권 발생일</p>
                      <p className='font-medium text-gray-12'>{formatDate(bondDetail.bonds.created_at)}</p>
                    </div>
                  </div>

                  <div className='bg-gray-2 p-4 rounded-lg'>
                    <p className='text-sm text-gray-11 mb-1'>현재 상태</p>
                    <div className='flex items-center gap-2 mt-1'>
                      {statusStyle.icon}
                      <p className={`font-medium ${statusStyle.textColor}`}>{bondDetail.bonds.status}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 진행 내역 탭 */}
          {activeTab === 'timeline' && (
            <div>
              <h3 className='text-lg font-semibold mb-6 text-gray-12'>채권 회수 진행 내역</h3>

              <div className='relative pl-8 border-l-2 border-gray-4 space-y-8 py-2'>
                {bondDetail.timeline.map((event, index) => {
                  const eventStyle = getEventStyle(event.type);

                  return (
                    <div key={event.id} className='relative'>
                      <div
                        className={`absolute -left-10 ${eventStyle.bgColor} rounded-full p-2 shadow-md border-4 border-gray-1`}
                      >
                        {eventStyle.icon}
                      </div>

                      <div className='bg-gray-2 rounded-lg p-4 shadow-sm'>
                        <div className='flex items-center justify-between mb-2'>
                          <h4 className='font-medium text-gray-12'>{event.title}</h4>
                          <p className='text-sm text-gray-11'>{formatDate(event.date)}</p>
                        </div>
                        <p className='text-gray-12'>{event.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 타임라인 추가 버튼 */}
              <div className='mt-8 text-center'>
                <Button size='2' variant='soft' color='gray' className='gap-1'>
                  <PlusIcon /> 이벤트 추가
                </Button>
              </div>
            </div>
          )}

          {/* 회수 내역 탭 */}
          {activeTab === 'recovery' && (
            <div>
              <div className='flex justify-between items-center mb-6'>
                <h3 className='text-lg font-semibold text-gray-12'>회수 내역</h3>
                <Button size='2' variant='soft' color='blue' className='gap-1'>
                  <PlusIcon /> 회수 내역 추가
                </Button>
              </div>

              <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8'>
                <div className='bg-gray-2 p-6 rounded-lg'>
                  <h4 className='text-base font-medium mb-4 text-gray-12'>회수 현황</h4>

                  <div className='flex items-center justify-between mb-6'>
                    <div>
                      <p className='text-sm text-gray-11'>원금액</p>
                      <p className='text-lg font-semibold text-gray-12'>
                        {formatAmount(bondDetail.bonds.original_amount)}
                      </p>
                    </div>

                    <div className='flex items-center gap-4'>
                      <div className='w-20 h-20 relative'>
                        <div className='w-20 h-20 rounded-full bg-gray-3 flex items-center justify-center'>
                          <div className='w-16 h-16 rounded-full bg-gray-2 flex items-center justify-center'>
                            <p className='text-sm font-bold text-green-11'>{bondDetail.bonds.recovery_rate}%</p>
                          </div>
                        </div>
                        <div className='absolute top-0 left-0 w-20 h-20'>
                          <svg width='80' height='80' viewBox='0 0 80 80'>
                            <circle
                              cx='40'
                              cy='40'
                              r='36'
                              fill='none'
                              stroke='#4ca76a'
                              strokeWidth='8'
                              strokeDasharray={`${parseFloat(bondDetail.bonds.recovery_rate) * 2.26} 226`}
                              strokeDashoffset='0'
                              transform='rotate(-90 40 40)'
                            />
                          </svg>
                        </div>
                      </div>

                      <div>
                        <p className='text-sm text-gray-11'>회수액</p>
                        <p className='text-lg font-semibold text-green-11'>
                          {formatAmount(bondDetail.bonds.recovered_amount)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className='space-y-3'>
                    <div className='flex justify-between items-center text-sm'>
                      <span className='text-gray-11'>회수 횟수</span>
                      <span className='font-medium text-gray-12'>{bondDetail.recovery_history.length}회</span>
                    </div>

                    <div className='flex justify-between items-center text-sm'>
                      <span className='text-gray-11'>최근 회수일</span>
                      <span className='font-medium text-gray-12'>
                        {bondDetail.recovery_history.length > 0
                          ? formatDate(bondDetail.recovery_history[0].date)
                          : '없음'}
                      </span>
                    </div>

                    <div className='flex justify-between items-center text-sm'>
                      <span className='text-gray-11'>미회수액</span>
                      <span className='font-medium text-gray-12'>
                        {formatAmount(bondDetail.bonds.original_amount - bondDetail.bonds.recovered_amount)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className='bg-gray-2 p-6 rounded-lg'>
                  <h4 className='text-base font-medium mb-4 text-gray-12'>회수 방법 분석</h4>

                  <div className='h-[200px] mb-4'>
                    {/* 여기에 차트를 추가할 수 있습니다 */}
                    <div className='h-full flex items-center justify-center text-gray-11'>
                      간소화된 예시를 위해 차트는 생략합니다
                    </div>
                  </div>

                  <div className='space-y-3'>
                    {['법원 강제집행', '임의변제', '경매 배당', '약식 기일'].map((method, idx) => (
                      <div key={idx} className='flex justify-between items-center text-sm'>
                        <span className='text-gray-11'>{method}</span>
                        <span className='font-medium text-gray-12'>
                          {bondDetail.recovery_history.filter((r) => r.method === method).length}회
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 회수 내역 테이블 */}
              <div className='bg-gray-2 rounded-lg p-6'>
                <h4 className='text-base font-medium mb-4 text-gray-12'>상세 회수 내역</h4>

                {bondDetail.recovery_history.length > 0 ? (
                  <div className='overflow-x-auto'>
                    <table className='w-full min-w-[600px] border-collapse'>
                      <thead>
                        <tr className='border-b border-gray-4'>
                          <th className='p-3 text-left text-gray-11 font-medium'>회수일</th>
                          <th className='p-3 text-left text-gray-11 font-medium'>회수액</th>
                          <th className='p-3 text-left text-gray-11 font-medium'>회수 방법</th>
                          <th className='p-3 text-left text-gray-11 font-medium'>비고</th>
                          <th className='p-3 text-left text-gray-11 font-medium'>액션</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bondDetail.recovery_history.map((recovery) => (
                          <tr key={recovery.id} className='border-b border-gray-4 hover:bg-gray-3/50'>
                            <td className='p-3 text-gray-12'>{formatDate(recovery.date)}</td>
                            <td className='p-3 font-medium text-green-11'>{formatAmount(recovery.amount)}</td>
                            <td className='p-3 text-gray-12'>{recovery.method}</td>
                            <td className='p-3 text-gray-11'>{recovery.note}</td>
                            <td className='p-3'>
                              <div className='flex gap-2'>
                                <button className='p-1 hover:bg-gray-4 rounded-full text-gray-11'>
                                  <InfoCircledIcon className='w-4 h-4' />
                                </button>
                                <button className='p-1 hover:bg-gray-4 rounded-full text-gray-11'>
                                  <ChatBubbleIcon className='w-4 h-4' />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className='text-center py-8 text-gray-11'>회수 내역이 없습니다.</div>
                )}
              </div>
            </div>
          )}

          {/* 문서 및 메모 탭 */}
          {activeTab === 'docs' && (
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
              <div className='lg:col-span-2'>
                <div className='flex justify-between items-center mb-4'>
                  <h3 className='text-lg font-semibold text-gray-12'>관련 문서</h3>
                  <Button size='2' variant='soft' color='gray' className='gap-1'>
                    <PlusIcon /> 문서 추가
                  </Button>
                </div>

                <div className='bg-gray-2 rounded-lg p-6'>
                  {bondDetail.documents.length > 0 ? (
                    <div className='space-y-4'>
                      {bondDetail.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className='flex items-center p-3 border border-gray-4 rounded-lg hover:bg-gray-3/50 transition-colors cursor-pointer'
                        >
                          <div className='w-10 h-10 rounded bg-red-3 flex items-center justify-center mr-4'>
                            <span className='text-red-11 font-medium text-xs'>PDF</span>
                          </div>

                          <div className='flex-grow'>
                            <p className='font-medium text-gray-12'>{doc.title}</p>
                            <p className='text-xs text-gray-11'>
                              {formatDate(doc.date)} · {doc.size}
                            </p>
                          </div>

                          <div className='flex gap-2'>
                            <button className='p-1 hover:bg-gray-4 rounded-full text-gray-11'>
                              <EnterIcon className='w-4 h-4' />
                            </button>
                            <button className='p-1 hover:bg-gray-4 rounded-full text-gray-11'>
                              <ExitIcon className='w-4 h-4' />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className='text-center py-8 text-gray-11'>관련 문서가 없습니다.</div>
                  )}
                </div>
              </div>

              <div>
                <div className='flex justify-between items-center mb-4'>
                  <h3 className='text-lg font-semibold text-gray-12'>메모</h3>
                  <Button size='2' variant='soft' color='gray' className='gap-1'>
                    <PlusIcon /> 메모 추가
                  </Button>
                </div>

                <div className='bg-gray-2 rounded-lg p-6'>
                  {bondDetail.memos.length > 0 ? (
                    <div className='space-y-4'>
                      {bondDetail.memos.map((memo) => (
                        <div key={memo.id} className='p-3 border border-gray-4 rounded-lg'>
                          <div className='flex items-center justify-between mb-2'>
                            <div className='flex items-center gap-2'>
                              <div className='w-6 h-6 rounded-full bg-blue-3 flex items-center justify-center'>
                                <PersonIcon className='w-3 h-3 text-blue-11' />
                              </div>
                              <p className='font-medium text-gray-12'>{memo.writer}</p>
                            </div>
                            <p className='text-xs text-gray-11'>{formatDate(memo.date)}</p>
                          </div>

                          <p className='text-gray-12 text-sm'>{memo.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className='text-center py-8 text-gray-11'>메모가 없습니다.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Box>
  );
};

export default BondDetailPage;
