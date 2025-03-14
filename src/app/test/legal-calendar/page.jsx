'use client';

import React, { useState, useEffect } from 'react';
import {
  BellIcon,
  CalendarIcon,
  CheckCircledIcon,
  Cross2Icon,
  ExclamationTriangleIcon,
  InfoCircledIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ArrowRightIcon,
  DownloadIcon,
  ClockIcon,
  EnvelopeClosedIcon,
  FileTextIcon,
  GearIcon,
  PersonIcon,
  ExitIcon,
  StarIcon,
  StarFilledIcon,
} from '@radix-ui/react-icons';
import {
  Box,
  Badge,
  Button,
  Card,
  Flex,
  Avatar,
  Text,
  DropdownMenu,
  Separator,
  Tabs,
  Dialog,
  TextField,
  ScrollArea,
  Select,
  Table,
  Tooltip,
  IconButton,
} from '@radix-ui/themes';

const LegalCalendarPage = () => {
  // 상태 관리
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('month'); // 'month', 'week', 'day'
  const [notifications, setNotifications] = useState([]);
  const [legalCases, setLegalCases] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showAddEventDialog, setShowAddEventDialog] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [showEventDetails, setShowEventDetails] = useState(false);

  // 새 이벤트 폼 데이터
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: formatDateForInput(new Date()),
    time: '10:00',
    caseId: '',
    type: 'hearing',
    notes: '',
    reminderDays: 3,
  });

  // 날짜 형식 변환 함수
  function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 날짜 표시 형식
  function formatDate(date) {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  // 시간 표시 형식
  function formatTime(time) {
    if (!time) return '';
    return time;
  }

  // 남은 날짜 계산
  function getDaysRemaining(eventDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(eventDate);
    targetDate.setHours(0, 0, 0, 0);

    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  // 타입별 이벤트 색상
  function getEventColor(type) {
    switch (type) {
      case 'hearing':
        return 'blue';
      case 'filing':
        return 'green';
      case 'deadline':
        return 'red';
      case 'meeting':
        return 'violet';
      case 'ruling':
        return 'orange';
      case 'enforcement':
        return 'tomato';
      default:
        return 'gray';
    }
  }

  // 타입별 이벤트 아이콘
  function getEventIcon(type) {
    switch (type) {
      case 'hearing':
        return <FileTextIcon />;
      case 'filing':
        return <EnvelopeClosedIcon />;
      case 'deadline':
        return <ExclamationTriangleIcon />;
      case 'meeting':
        return <PersonIcon />;
      case 'ruling':
        return <CheckCircledIcon />;
      case 'enforcement':
        return <ArrowRightIcon />;
      default:
        return <CalendarIcon />;
    }
  }

  // 이벤트 타입을 한글로 변환
  function getEventTypeInKorean(type) {
    switch (type) {
      case 'hearing':
        return '변론기일';
      case 'filing':
        return '서류제출';
      case 'deadline':
        return '마감기한';
      case 'meeting':
        return '미팅';
      case 'ruling':
        return '판결선고';
      case 'enforcement':
        return '강제집행';
      default:
        return '기타';
    }
  }

  // 달력 날짜 생성
  function generateCalendarDays() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const daysInMonth = lastDayOfMonth.getDate();
    const firstDayOfWeek = firstDayOfMonth.getDay();

    // 이전 달의 날짜
    const prevMonthDays = [];
    if (firstDayOfWeek > 0) {
      const prevMonth = new Date(year, month, 0);
      const prevMonthDaysCount = prevMonth.getDate();

      for (let i = prevMonthDaysCount - firstDayOfWeek + 1; i <= prevMonthDaysCount; i++) {
        prevMonthDays.push({
          date: new Date(year, month - 1, i),
          isCurrentMonth: false,
        });
      }
    }

    // 현재 달의 날짜
    const currentMonthDays = [];
    for (let i = 1; i <= daysInMonth; i++) {
      currentMonthDays.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // 다음 달의 날짜
    const nextMonthDays = [];
    const totalDaysSoFar = prevMonthDays.length + currentMonthDays.length;
    const remainingCells = 42 - totalDaysSoFar; // 6주(42일) 표시

    for (let i = 1; i <= remainingCells; i++) {
      nextMonthDays.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  }

  // 날짜에 해당하는 이벤트 가져오기
  function getEventsForDate(date) {
    return events.filter((event) => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  }

  // 주요 기능 구현
  useEffect(() => {
    // 목업 데이터 생성
    const generateMockData = () => {
      // 소송 케이스 목업 데이터
      const cases = [
        {
          id: 'case-1',
          caseNumber: '2023가합12345',
          title: '부동산 임대차 계약 분쟁',
          plaintiff: '김철수',
          defendant: '주식회사 대한부동산',
          court: '서울중앙지방법원',
          status: '진행 중',
          type: '민사',
          startDate: '2023-06-15',
          assignedTo: '이변호사',
        },
        {
          id: 'case-2',
          caseNumber: '2023나56789',
          title: '교통사고 손해배상',
          plaintiff: '박지영',
          defendant: '이만수',
          court: '서울서부지방법원',
          status: '항소심',
          type: '민사',
          startDate: '2023-08-10',
          assignedTo: '김변호사',
        },
        {
          id: 'case-3',
          caseNumber: '2023다98765',
          title: '지적재산권 침해 소송',
          plaintiff: '테크놀로지 주식회사',
          defendant: '소프트웨어 개발 주식회사',
          court: '서울고등법원',
          status: '상고심',
          type: '민사',
          startDate: '2023-02-28',
          assignedTo: '박변호사',
        },
        {
          id: 'case-4',
          caseNumber: '2023머87654',
          title: '근로계약 위반 소송',
          plaintiff: '조현우',
          defendant: '한국기업 주식회사',
          court: '서울남부지방법원',
          status: '1심',
          type: '민사',
          startDate: '2023-09-22',
          assignedTo: '이변호사',
        },
        {
          id: 'case-5',
          caseNumber: '2023구12345',
          title: '건축 허가 취소 소송',
          plaintiff: '김건축 주식회사',
          defendant: '서울시',
          court: '서울행정법원',
          status: '진행 중',
          type: '행정',
          startDate: '2023-07-05',
          assignedTo: '정변호사',
        },
      ];

      // 오늘 날짜 기준으로 이벤트 생성
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      const nextMonth = new Date(today);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      // 이벤트 목업 데이터
      const mockEvents = [
        {
          id: 'event-1',
          title: '1차 변론기일',
          date: formatDateForInput(tomorrow),
          time: '14:00',
          type: 'hearing',
          caseId: 'case-1',
          location: '서울중앙지방법원 제304호 법정',
          notes: '입증자료 모두 지참 필요',
          reminderDays: 1,
          isComplete: false,
          isPriority: true,
        },
        {
          id: 'event-2',
          title: '항소장 제출 마감',
          date: formatDateForInput(nextWeek),
          time: '17:00',
          type: 'filing',
          caseId: 'case-2',
          location: '서울서부지방법원',
          notes: '항소 이유서 함께 제출 필요',
          reminderDays: 3,
          isComplete: false,
          isPriority: true,
        },
        {
          id: 'event-3',
          title: '판결 선고일',
          date: formatDateForInput(nextMonth),
          time: '10:30',
          type: 'ruling',
          caseId: 'case-3',
          location: '서울고등법원 제201호 법정',
          notes: '선고 후 상고 여부 즉시 결정 필요',
          reminderDays: 7,
          isComplete: false,
          isPriority: false,
        },
        {
          id: 'event-4',
          title: '강제집행 신청',
          date: formatDateForInput(today),
          time: '11:00',
          type: 'enforcement',
          caseId: 'case-4',
          location: '서울남부지방법원',
          notes: '채무자 재산 관련 증빙 지참',
          reminderDays: 2,
          isComplete: false,
          isPriority: true,
        },
        {
          id: 'event-5',
          title: '의뢰인 미팅',
          date: formatDateForInput(today),
          time: '16:00',
          type: 'meeting',
          caseId: 'case-5',
          location: '사무실 회의실',
          notes: '소송 진행 상황 설명 및 향후 전략 논의',
          reminderDays: 1,
          isComplete: false,
          isPriority: false,
        },
        // 추가 이벤트들
        {
          id: 'event-6',
          title: '2차 변론기일',
          date: formatDateForInput(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 21)),
          time: '13:30',
          type: 'hearing',
          caseId: 'case-1',
          location: '서울중앙지방법원 제304호 법정',
          notes: '전문가 증인 출석 예정',
          reminderDays: 3,
          isComplete: false,
          isPriority: false,
        },
        {
          id: 'event-7',
          title: '증거자료 제출 마감',
          date: formatDateForInput(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 14)),
          time: '17:00',
          type: 'deadline',
          caseId: 'case-3',
          location: '서울고등법원',
          notes: '추가 증거자료 모두 준비',
          reminderDays: 5,
          isComplete: false,
          isPriority: true,
        },
        {
          id: 'event-8',
          title: '감정인 의견서 제출',
          date: formatDateForInput(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 9)),
          time: '12:00',
          type: 'filing',
          caseId: 'case-5',
          location: '서울행정법원',
          notes: '건축 전문가 의견서 함께 제출',
          reminderDays: 2,
          isComplete: false,
          isPriority: false,
        },
      ];

      // 알림 생성
      const now = new Date();
      const mockNotifications = mockEvents
        .filter((event) => {
          const eventDate = new Date(event.date);
          const daysUntilEvent = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
          return daysUntilEvent <= event.reminderDays && daysUntilEvent >= 0;
        })
        .map((event) => {
          const daysRemaining = getDaysRemaining(event.date);
          const caseInfo = cases.find((c) => c.id === event.caseId) || {};

          return {
            id: `notif-${event.id}`,
            eventId: event.id,
            title: `${event.title} 알림`,
            message: `${formatDate(event.date)} ${event.time}에 ${getEventTypeInKorean(event.type)} "${
              event.title
            }"이(가) 예정되어 있습니다.`,
            caseNumber: caseInfo.caseNumber,
            caseTitle: caseInfo.title,
            type: event.type,
            date: new Date(),
            isRead: false,
            daysRemaining,
          };
        });

      return { cases, events: mockEvents, notifications: mockNotifications };
    };

    // 목업 데이터 로드
    const loadMockData = () => {
      setLoading(true);
      setTimeout(() => {
        const { cases, events, notifications } = generateMockData();
        setLegalCases(cases);
        setEvents(events);
        setNotifications(notifications);
        setNotificationCount(notifications.filter((n) => !n.isRead).length);
        setLoading(false);
      }, 1000);
    };

    loadMockData();
  }, []);

  // 이벤트 필터링
  useEffect(() => {
    let filtered = events;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(query) ||
          (legalCases.find((c) => c.id === event.caseId)?.title || '').toLowerCase().includes(query)
      );
    }

    setFilteredEvents(filtered);
  }, [events, searchQuery, legalCases]);

  // 알림 읽음 처리
  const markNotificationAsRead = (notificationId) => {
    setNotifications((prevNotifications) =>
      prevNotifications.map((notif) => (notif.id === notificationId ? { ...notif, isRead: true } : notif))
    );

    setNotificationCount((prevCount) => Math.max(0, prevCount - 1));
  };

  // 모든 알림 읽음 처리
  const markAllNotificationsAsRead = () => {
    setNotifications((prevNotifications) => prevNotifications.map((notif) => ({ ...notif, isRead: true })));

    setNotificationCount(0);
  };

  // 새 이벤트 추가
  const handleAddEvent = () => {
    const eventId = `event-${events.length + 1}`;
    const newEventData = {
      ...newEvent,
      id: eventId,
      isComplete: false,
      isPriority: false,
    };

    setEvents((prevEvents) => [...prevEvents, newEventData]);
    setFilteredEvents((prevFiltered) => [...prevFiltered, newEventData]);

    // 알림 생성 (당일 포함 3일 이내의 이벤트인 경우)
    const daysUntilEvent = getDaysRemaining(newEvent.date);
    if (daysUntilEvent <= newEvent.reminderDays && daysUntilEvent >= 0) {
      const caseInfo = legalCases.find((c) => c.id === newEvent.caseId) || {};
      const notification = {
        id: `notif-${eventId}`,
        eventId,
        title: `${newEvent.title} 알림`,
        message: `${formatDate(newEvent.date)} ${newEvent.time}에 ${getEventTypeInKorean(newEvent.type)} "${
          newEvent.title
        }"이(가) 예정되어 있습니다.`,
        caseNumber: caseInfo.caseNumber,
        caseTitle: caseInfo.title,
        type: newEvent.type,
        date: new Date(),
        isRead: false,
        daysRemaining: daysUntilEvent,
      };

      setNotifications((prevNotifications) => [...prevNotifications, notification]);
      setNotificationCount((prevCount) => prevCount + 1);
    }

    // 폼 초기화
    setNewEvent({
      title: '',
      date: formatDateForInput(new Date()),
      time: '10:00',
      caseId: '',
      type: 'hearing',
      notes: '',
      reminderDays: 3,
    });

    setShowAddEventDialog(false);
  };

  // 이벤트 상태 토글
  const toggleEventComplete = (eventId) => {
    setEvents((prevEvents) =>
      prevEvents.map((event) => (event.id === eventId ? { ...event, isComplete: !event.isComplete } : event))
    );
  };

  // 우선 순위 토글
  const toggleEventPriority = (eventId) => {
    setEvents((prevEvents) =>
      prevEvents.map((event) => (event.id === eventId ? { ...event, isPriority: !event.isPriority } : event))
    );
  };

  // 이벤트 삭제
  const deleteEvent = (eventId) => {
    setEvents((prevEvents) => prevEvents.filter((event) => event.id !== eventId));
    setFilteredEvents((prevFiltered) => prevFiltered.filter((event) => event.id !== eventId));
    setNotifications((prevNotifications) => prevNotifications.filter((notif) => notif.eventId !== eventId));
  };

  // 달력 이동 (이전/다음 달)
  const navigateMonth = (direction) => {
    setCurrentDate((prevDate) => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  // 오늘 날짜로 이동
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // 날짜 선택 처리
  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  // 이벤트 선택 처리
  const handleEventSelect = (event) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };

  if (loading) {
    return (
      <div className='h-screen flex items-center justify-center bg-gray-2'>
        <div className='text-center'>
          <div className='animate-spin h-12 w-12 border-4 border-blue-8 border-t-transparent rounded-full mx-auto mb-4'></div>
          <p className='text-gray-11'>소송 캘린더 로딩 중...</p>
        </div>
      </div>
    );
  }

  // 달력 날짜 생성
  const calendarDays = generateCalendarDays();
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

  // 오늘 날짜 기준 예정된 이벤트 정렬
  const upcomingEvents = [...events]
    .filter((event) => {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return eventDate >= today;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  // 선택된 날짜의 이벤트
  const eventsForSelectedDate = getEventsForDate(selectedDate);

  // 이번 달 표시
  const monthYear = currentDate.toLocaleString('ko-KR', { year: 'numeric', month: 'long' });

  return (
    <div className='max-w-[1600px] mx-auto p-4 bg-gray-2'>
      {/* 헤더 */}
      <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-6'>
        <div>
          <h1 className='text-3xl font-bold text-gray-12 flex items-center'>
            <CalendarIcon className='mr-2 w-6 h-6' /> 소송 캘린더
          </h1>
          <p className='text-gray-11 mt-1'>소송 일정 및 중요 일자를 관리하세요</p>
        </div>

        <div className='flex items-center mt-4 md:mt-0 space-x-2'>
          <Button color='gray' variant='soft' onClick={goToToday}>
            오늘
          </Button>

          <Button color='indigo' onClick={() => setShowAddEventDialog(true)}>
            <PlusIcon /> 일정 추가
          </Button>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <Button variant='soft' color='gray' className='relative'>
                <BellIcon />
                {notificationCount > 0 && (
                  <Badge color='red' size='1' className='absolute -top-1 -right-1'>
                    {notificationCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Content align='end' className='w-[350px]'>
              <DropdownMenu.Label>
                <Flex justify='between' align='center'>
                  <Text>알림</Text>
                  {notificationCount > 0 && (
                    <Button size='1' variant='ghost' onClick={markAllNotificationsAsRead}>
                      모두 읽음 표시
                    </Button>
                  )}
                </Flex>
              </DropdownMenu.Label>

              <ScrollArea style={{ height: 'auto', maxHeight: '400px' }}>
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <DropdownMenu.Item
                      key={notification.id}
                      className='p-2'
                      onClick={() => markNotificationAsRead(notification.id)}
                    >
                      <div className={`p-2 rounded-md ${notification.isRead ? 'bg-gray-3' : 'bg-blue-3'}`}>
                        <Flex gap='2' align='start'>
                          <div className={`p-2 rounded-full bg-${getEventColor(notification.type)}-3`}>
                            {getEventIcon(notification.type)}
                          </div>
                          <div>
                            <Flex justify='between' align='baseline'>
                              <Text weight='bold' size='2'>
                                {notification.title}
                              </Text>
                              <Badge color={notification.daysRemaining === 0 ? 'red' : 'amber'} size='1'>
                                {notification.daysRemaining === 0 ? '오늘' : `D-${notification.daysRemaining}`}
                              </Badge>
                            </Flex>
                            <Text size='1' color='gray'>
                              {notification.caseNumber} | {notification.caseTitle}
                            </Text>
                            <Text size='2'>{notification.message}</Text>
                          </div>
                        </Flex>
                      </div>
                    </DropdownMenu.Item>
                  ))
                ) : (
                  <div className='p-4 text-center text-gray-9'>알림이 없습니다</div>
                )}
              </ScrollArea>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
      </div>

      {/* 검색 바 */}
      <div className='flex mb-6'>
        <div className='relative flex-grow'>
          <MagnifyingGlassIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-9' />
          <input
            type='text'
            placeholder='일정 또는 소송 사건 검색'
            className='pl-10 pr-4 py-2 w-full border border-gray-6 rounded-lg bg-gray-1 text-gray-12'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className='ml-4 flex space-x-2'>
          <Button
            variant={currentView === 'month' ? 'solid' : 'soft'}
            color='gray'
            onClick={() => setCurrentView('month')}
          >
            월
          </Button>
          <Button
            variant={currentView === 'week' ? 'solid' : 'soft'}
            color='gray'
            onClick={() => setCurrentView('week')}
          >
            주
          </Button>
          <Button variant={currentView === 'day' ? 'solid' : 'soft'} color='gray' onClick={() => setCurrentView('day')}>
            일
          </Button>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
        {/* 왼쪽 사이드 바 */}
        <div className='lg:col-span-1 space-y-6'>
          {/* 다가오는 일정 */}
          <Card className='bg-gray-1 border-gray-6'>
            <Box p='4'>
              <Text weight='bold' size='4' mb='2'>
                다가오는 일정
              </Text>
              <Separator size='4' mb='3' />

              {upcomingEvents.length > 0 ? (
                <div className='space-y-3'>
                  {upcomingEvents.map((event) => {
                    const caseInfo = legalCases.find((c) => c.id === event.caseId) || {};
                    const daysRemaining = getDaysRemaining(event.date);

                    return (
                      <button key={event.id} className='w-full text-left' onClick={() => handleEventSelect(event)}>
                        <Card
                          className={`p-3 hover:border-blue-8 transition-colors ${
                            event.isPriority ? 'border-red-6 bg-red-2' : 'bg-gray-1 border-gray-6'
                          }`}
                        >
                          <Flex justify='between' mb='1'>
                            <Flex gap='1' align='center'>
                              <Box className={`p-1 rounded-md bg-${getEventColor(event.type)}-3`}>
                                {getEventIcon(event.type)}
                              </Box>
                              <Text weight='bold' size='2'>
                                {event.title}
                              </Text>
                            </Flex>
                            <Badge color={daysRemaining === 0 ? 'red' : daysRemaining <= 3 ? 'amber' : 'gray'} size='1'>
                              {daysRemaining === 0 ? '오늘' : `D-${daysRemaining}`}
                            </Badge>
                          </Flex>

                          <Text size='1' color='gray'>
                            {caseInfo.caseNumber} | {caseInfo.title}
                          </Text>

                          <Flex align='center' gap='2' mt='1'>
                            <Text size='1' color='gray'>
                              <CalendarIcon className='inline mr-1' />
                              {formatDate(event.date)}
                            </Text>
                            {event.time && (
                              <Text size='1' color='gray'>
                                <ClockIcon className='inline mr-1' />
                                {formatTime(event.time)}
                              </Text>
                            )}
                          </Flex>
                        </Card>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className='text-center p-4 text-gray-9'>예정된 일정이 없습니다</div>
              )}
            </Box>
          </Card>

          {/* 소송 사건 목록 */}
          <Card className='bg-gray-1 border-gray-6'>
            <Box p='4'>
              <Text weight='bold' size='4' mb='2'>
                소송 사건 목록
              </Text>
              <Separator size='4' mb='3' />

              <ScrollArea style={{ height: '300px' }}>
                <div className='space-y-2'>
                  {legalCases.map((legalCase) => (
                    <button key={legalCase.id} className='w-full text-left' onClick={() => setSelectedCase(legalCase)}>
                      <Card
                        className={`p-3 hover:bg-gray-3 transition-colors ${
                          selectedCase?.id === legalCase.id ? 'border-blue-8 bg-blue-2' : 'border-gray-6 bg-gray-1'
                        }`}
                      >
                        <Text weight='bold' size='2'>
                          {legalCase.caseNumber}
                        </Text>
                        <Text size='2'>{legalCase.title}</Text>
                        <Flex justify='between' align='center' mt='1'>
                          <Text size='1' color='gray'>
                            {legalCase.court}
                          </Text>
                          <Badge
                            color={
                              legalCase.status === '진행 중'
                                ? 'blue'
                                : legalCase.status === '항소심'
                                ? 'amber'
                                : legalCase.status === '상고심'
                                ? 'orange'
                                : 'green'
                            }
                            size='1'
                          >
                            {legalCase.status}
                          </Badge>
                        </Flex>
                      </Card>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </Box>
          </Card>
        </div>

        {/* 메인 캘린더 영역 */}
        <div className='lg:col-span-3'>
          <Card className='mb-6 bg-gray-1 border-gray-6'>
            <Box p='4'>
              {/* 캘린더 헤더 */}
              <Flex justify='between' align='center' mb='4'>
                <Flex gap='2' align='center'>
                  <Button variant='soft' color='gray' onClick={() => navigateMonth(-1)}>
                    <ArrowRightIcon className='rotate-180' />
                  </Button>
                  <Text weight='bold' size='5'>
                    {monthYear}
                  </Text>
                  <Button variant='soft' color='gray' onClick={() => navigateMonth(1)}>
                    <ArrowRightIcon />
                  </Button>
                </Flex>
              </Flex>

              {/* 달력 */}
              <div className='grid grid-cols-7 gap-1'>
                {/* 요일 헤더 */}
                {weekdays.map((weekday, index) => (
                  <div
                    key={weekday}
                    className={`text-center p-2 font-medium ${
                      index === 0 ? 'text-red-9' : index === 6 ? 'text-blue-9' : 'text-gray-11'
                    }`}
                  >
                    {weekday}
                  </div>
                ))}

                {/* 날짜 셀 */}
                {calendarDays.map((dayObj, index) => {
                  const isToday =
                    dayObj.date.getDate() === new Date().getDate() &&
                    dayObj.date.getMonth() === new Date().getMonth() &&
                    dayObj.date.getFullYear() === new Date().getFullYear();

                  const isSelected =
                    dayObj.date.getDate() === selectedDate.getDate() &&
                    dayObj.date.getMonth() === selectedDate.getMonth() &&
                    dayObj.date.getFullYear() === selectedDate.getFullYear();

                  const dayEvents = getEventsForDate(dayObj.date);
                  const hasEvents = dayEvents.length > 0;
                  const hasPriorityEvents = dayEvents.some((e) => e.isPriority);

                  return (
                    <div
                      key={index}
                      onClick={() => handleDateSelect(dayObj.date)}
                      className={`min-h-[100px] border rounded-md ${isSelected ? 'border-blue-8' : 'border-gray-6'} ${
                        dayObj.isCurrentMonth ? 'bg-gray-1' : 'bg-gray-3'
                      } transition-colors hover:border-blue-8 hover:bg-blue-2 cursor-pointer`}
                    >
                      <div className='p-1'>
                        {/* 날짜 헤더 부분 */}
                        <div className={`flex justify-between items-center ${isToday ? 'bg-blue-4 rounded-t-sm' : ''}`}>
                          <span
                            className={`
                              text-sm px-1 py-0.5 rounded-full w-6 h-6 flex items-center justify-center
                              ${isToday ? 'bg-blue-9 text-gray-1 font-bold' : ''}
                              ${!dayObj.isCurrentMonth ? 'text-gray-8' : 'text-gray-12'}
                            `}
                          >
                            {dayObj.date.getDate()}
                          </span>
                          {hasPriorityEvents && (
                            <span className='text-red-10'>
                              <StarFilledIcon className='w-3 h-3' />
                            </span>
                          )}
                        </div>

                        {/* 이벤트 목록 */}
                        <div className='mt-1 space-y-1 max-h-[70px] overflow-y-auto'>
                          {hasEvents &&
                            dayEvents.map((event) => (
                              <div
                                key={event.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEventSelect(event);
                                }}
                                className={`
                                text-xs p-1 rounded truncate
                                bg-${getEventColor(event.type)}-3 
                                text-${getEventColor(event.type)}-11
                                border-l-2 border-${getEventColor(event.type)}-9
                                ${event.isPriority ? 'font-bold' : ''}
                                ${event.isComplete ? 'opacity-60 line-through' : ''}
                              `}
                              >
                                {event.time && <span className='mr-1'>{event.time}</span>}
                                {event.title}
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Box>
          </Card>

          {/* 선택된 날짜의 이벤트 목록 */}
          {eventsForSelectedDate.length > 0 && (
            <Card className='bg-gray-1 border-gray-6'>
              <Box p='4'>
                <Flex justify='between' align='center' mb='3'>
                  <Text weight='bold' size='4'>
                    {formatDate(selectedDate)} 일정
                  </Text>
                  <Button size='1' variant='soft' color='gray' onClick={() => handleDateSelect(new Date())}>
                    오늘로
                  </Button>
                </Flex>

                <div className='space-y-2'>
                  {eventsForSelectedDate.map((event) => {
                    const caseInfo = legalCases.find((c) => c.id === event.caseId) || {};

                    return (
                      <Card
                        key={event.id}
                        className={`p-3 ${event.isPriority ? 'border-red-6 bg-red-2' : 'bg-gray-1 border-gray-6'} ${
                          event.isComplete ? 'opacity-70' : ''
                        }`}
                      >
                        <Flex justify='between' mb='1'>
                          <Flex gap='2' align='center'>
                            <Box className={`p-1 rounded-md bg-${getEventColor(event.type)}-3`}>
                              {getEventIcon(event.type)}
                            </Box>
                            <Text weight='bold' size='3' className={event.isComplete ? 'line-through' : ''}>
                              {event.title}
                            </Text>
                          </Flex>
                          <Flex gap='1'>
                            {event.isPriority && (
                              <IconButton
                                size='1'
                                variant='ghost'
                                color='red'
                                onClick={() => toggleEventPriority(event.id)}
                              >
                                <StarFilledIcon />
                              </IconButton>
                            )}
                            <IconButton size='1' variant='ghost' color='gray' onClick={() => handleEventSelect(event)}>
                              <InfoCircledIcon />
                            </IconButton>
                          </Flex>
                        </Flex>

                        <Text size='1' color='gray'>
                          {caseInfo.caseNumber} | {caseInfo.title}
                        </Text>

                        <Flex align='center' gap='2' mt='2'>
                          <Text size='1' color='gray'>
                            <ClockIcon className='inline mr-1' />
                            {formatTime(event.time)}
                          </Text>
                          <Text size='1' color='gray'>
                            <Badge color={getEventColor(event.type)} size='1'>
                              {getEventTypeInKorean(event.type)}
                            </Badge>
                          </Text>
                          {event.location && (
                            <Text size='1' color='gray' className='truncate'>
                              {event.location}
                            </Text>
                          )}
                        </Flex>
                      </Card>
                    );
                  })}
                </div>
              </Box>
            </Card>
          )}
        </div>
      </div>

      {/* 이벤트 상세 대화상자 */}
      <Dialog.Root open={showEventDetails} onOpenChange={setShowEventDetails}>
        <Dialog.Content style={{ maxWidth: 500 }}>
          {selectedEvent && (
            <>
              <Dialog.Title>
                <Flex align='center' gap='2'>
                  <Box className={`p-1 rounded-md bg-${getEventColor(selectedEvent.type)}-3`}>
                    {getEventIcon(selectedEvent.type)}
                  </Box>
                  {selectedEvent.title}
                </Flex>
              </Dialog.Title>

              <Flex gap='3' direction='column' mt='4'>
                <Badge color={getEventColor(selectedEvent.type)} size='1' className='w-fit'>
                  {getEventTypeInKorean(selectedEvent.type)}
                </Badge>

                <div className='bg-gray-3 p-3 rounded-md'>
                  <Flex direction='column' gap='2'>
                    <Flex justify='between'>
                      <Text size='2' color='gray'>
                        사건번호
                      </Text>
                      <Text size='2' weight='bold'>
                        {legalCases.find((c) => c.id === selectedEvent.caseId)?.caseNumber || '-'}
                      </Text>
                    </Flex>
                    <Flex justify='between'>
                      <Text size='2' color='gray'>
                        사건명
                      </Text>
                      <Text size='2' weight='bold'>
                        {legalCases.find((c) => c.id === selectedEvent.caseId)?.title || '-'}
                      </Text>
                    </Flex>
                    <Flex justify='between'>
                      <Text size='2' color='gray'>
                        일시
                      </Text>
                      <Text size='2' weight='bold'>
                        {formatDate(selectedEvent.date)} {selectedEvent.time}
                      </Text>
                    </Flex>
                    <Flex justify='between'>
                      <Text size='2' color='gray'>
                        장소
                      </Text>
                      <Text size='2' weight='bold'>
                        {selectedEvent.location || '-'}
                      </Text>
                    </Flex>
                  </Flex>
                </div>

                {selectedEvent.notes && (
                  <div>
                    <Text size='2' weight='bold' mb='1'>
                      메모
                    </Text>
                    <div className='bg-gray-3 p-3 rounded-md'>
                      <Text size='2'>{selectedEvent.notes}</Text>
                    </div>
                  </div>
                )}

                <Flex gap='3' mt='2'>
                  <Button
                    color={selectedEvent.isPriority ? 'red' : 'gray'}
                    variant='soft'
                    onClick={() => toggleEventPriority(selectedEvent.id)}
                  >
                    {selectedEvent.isPriority ? <StarFilledIcon /> : <StarIcon />}
                    {selectedEvent.isPriority ? '중요 표시 해제' : '중요 표시'}
                  </Button>
                  <Button
                    color={selectedEvent.isComplete ? 'green' : 'gray'}
                    variant='soft'
                    onClick={() => toggleEventComplete(selectedEvent.id)}
                  >
                    <CheckCircledIcon />
                    {selectedEvent.isComplete ? '완료 표시 해제' : '완료 표시'}
                  </Button>
                </Flex>
              </Flex>

              <Flex gap='3' mt='4' justify='between'>
                <Button
                  color='red'
                  variant='soft'
                  onClick={() => {
                    deleteEvent(selectedEvent.id);
                    setShowEventDetails(false);
                  }}
                >
                  <Cross2Icon />
                  삭제
                </Button>
                <Dialog.Close>
                  <Button color='gray'>닫기</Button>
                </Dialog.Close>
              </Flex>
            </>
          )}
        </Dialog.Content>
      </Dialog.Root>

      {/* 새 이벤트 추가 대화상자 */}
      <Dialog.Root open={showAddEventDialog} onOpenChange={setShowAddEventDialog}>
        <Dialog.Content style={{ maxWidth: 500 }}>
          <Dialog.Title>일정 추가</Dialog.Title>

          <Flex direction='column' gap='3' mt='4'>
            <label>
              <Text as='div' size='2' weight='bold' mb='1'>
                제목
              </Text>
              <TextField.Root
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder='예: 1차 변론기일'
              />
            </label>

            <Flex gap='3'>
              <Box grow='1'>
                <Text as='div' size='2' weight='bold' mb='1'>
                  날짜
                </Text>
                <TextField.Root
                  type='date'
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                />
              </Box>
              <Box grow='1'>
                <Text as='div' size='2' weight='bold' mb='1'>
                  시간
                </Text>
                <TextField.Root
                  type='time'
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                />
              </Box>
            </Flex>

            <label>
              <Text as='div' size='2' weight='bold' mb='1'>
                사건
              </Text>
              <Select.Root
                value={newEvent.caseId}
                onValueChange={(value) => setNewEvent({ ...newEvent, caseId: value })}
              >
                <Select.Trigger placeholder='사건을 선택하세요' />
                <Select.Content>
                  {legalCases.map((legalCase) => (
                    <Select.Item key={legalCase.id} value={legalCase.id}>
                      {legalCase.caseNumber} - {legalCase.title}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </label>

            <label>
              <Text as='div' size='2' weight='bold' mb='1'>
                일정 유형
              </Text>
              <Select.Root value={newEvent.type} onValueChange={(value) => setNewEvent({ ...newEvent, type: value })}>
                <Select.Trigger />
                <Select.Content>
                  <Select.Item value='hearing'>변론기일</Select.Item>
                  <Select.Item value='filing'>서류제출</Select.Item>
                  <Select.Item value='deadline'>마감기한</Select.Item>
                  <Select.Item value='meeting'>미팅</Select.Item>
                  <Select.Item value='ruling'>판결선고</Select.Item>
                  <Select.Item value='enforcement'>강제집행</Select.Item>
                </Select.Content>
              </Select.Root>
            </label>

            <label>
              <Text as='div' size='2' weight='bold' mb='1'>
                장소
              </Text>
              <TextField.Root
                value={newEvent.location || ''}
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                placeholder='예: 서울중앙지방법원 제304호 법정'
              />
            </label>

            <label>
              <Text as='div' size='2' weight='bold' mb='1'>
                메모
              </Text>
              <TextField.Root
                value={newEvent.notes}
                onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                placeholder='추가 정보를 입력하세요'
              />
            </label>

            <label>
              <Text as='div' size='2' weight='bold' mb='1'>
                알림 사전 설정 (일)
              </Text>
              <Select.Root
                value={String(newEvent.reminderDays)}
                onValueChange={(value) => setNewEvent({ ...newEvent, reminderDays: Number(value) })}
              >
                <Select.Trigger />
                <Select.Content>
                  <Select.Item value='0'>당일</Select.Item>
                  <Select.Item value='1'>1일 전</Select.Item>
                  <Select.Item value='3'>3일 전</Select.Item>
                  <Select.Item value='7'>7일 전</Select.Item>
                  <Select.Item value='14'>14일 전</Select.Item>
                </Select.Content>
              </Select.Root>
            </label>
          </Flex>

          <Flex gap='3' mt='4' justify='end'>
            <Dialog.Close>
              <Button variant='soft' color='gray'>
                취소
              </Button>
            </Dialog.Close>
            <Button color='blue' onClick={handleAddEvent}>
              일정 추가
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </div>
  );
};

export default LegalCalendarPage;
