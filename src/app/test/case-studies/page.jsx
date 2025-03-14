'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  CaretSortIcon,
  MagnifyingGlassIcon,
  CheckCircledIcon,
  ClockIcon,
  InfoCircledIcon,
  TimerIcon,
  CalendarIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  Cross2Icon,
  PersonIcon,
  StarFilledIcon,
  BookmarkIcon,
  DownloadIcon,
  PieChartIcon,
  BarChartIcon,
  MixerVerticalIcon,
  CrossCircledIcon,
  DoubleArrowRightIcon,
  ExclamationTriangleIcon,
  LightningBoltIcon,
  LinkBreak2Icon,
} from '@radix-ui/react-icons';
import {
  Box,
  Badge,
  Button,
  Card,
  Flex,
  Avatar,
  Text,
  Heading,
  Separator,
  Tabs,
  Dialog,
  ScrollArea,
  Select,
  Table,
} from '@radix-ui/themes';

// 목 데이터 import
import { caseStudies, recoveryStatistics, legalReferences, recoveryKnowhow, legalInformation } from './mockData';

// 금액 형식화 함수
const formatAmount = (amount) => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(amount);
};

const CaseStudiesPage = () => {
  // 상태 관리
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCases, setFilteredCases] = useState([]);
  const [showCaseDetails, setShowCaseDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const modalRef = useRef(null);

  // 필터링된 사례 목록 계산
  useEffect(() => {
    let filtered = [...caseStudies];

    // 카테고리 필터
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    // 검색어 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query) ||
          item.debtorInfo.toLowerCase().includes(query) ||
          item.summary.toLowerCase().includes(query)
      );
    }

    setFilteredCases(filtered);
  }, [selectedCategory, searchQuery]);

  // 초기 데이터 로드
  useEffect(() => {
    setFilteredCases(caseStudies);
  }, []);

  // 사례 선택 핸들러
  const handleCaseSelect = (caseItem) => {
    setSelectedCase(caseItem);
    setShowCaseDetails(true);
    setActiveTab('overview');
  };

  // 카테고리 목록 추출
  const categories = [...new Set(caseStudies.map((item) => item.category))];

  // 별점 렌더링 컴포넌트
  const StarRating = ({ rating }) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<StarFilledIcon key={i} width='16' height='16' style={{ color: 'var(--amber-9)' }} />);
    }

    if (hasHalfStar) {
      stars.push(
        <StarFilledIcon key='half' width='16' height='16' style={{ color: 'var(--amber-9)', opacity: 0.5 }} />
      );
    }

    return <Flex gap='1'>{stars}</Flex>;
  };

  // 서로 다른 난이도에 따른 배지 색상
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case '매우 높음':
        return 'bg-red-3 text-red-11';
      case '높음':
        return 'bg-orange-3 text-orange-11';
      case '중간':
        return 'bg-yellow-3 text-yellow-11';
      default:
        return 'bg-green-3 text-green-11';
    }
  };

  // 회수율에 따른 배지 색상
  const getRecoveryRateColor = (rate) => {
    if (rate >= 90) return 'bg-green-3 text-green-11';
    if (rate >= 80) return 'bg-blue-3 text-blue-11';
    if (rate >= 70) return 'bg-yellow-3 text-yellow-11';
    return 'bg-orange-3 text-orange-11';
  };

  // 모달 닫기 핸들러
  const closeModal = () => {
    setShowCaseDetails(false);
  };

  // 모달 외부 클릭 시 닫기
  const handleModalClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      closeModal();
    }
  };

  return (
    <Box className='mx-auto max-w-[1200px] p-4 md:p-6'>
      {/* 헤더 섹션 */}
      <Box className='mb-8 text-center'>
        <Heading size='8' className='mb-2'>
          채권 회수 성공사례
        </Heading>
        <Text size='4' color='gray' className='max-w-3xl mx-auto'>
          실제 채권 회수 성공사례를 통해 우리의 전문성과 노하우를 확인하세요. 소송부터 집행까지 전 과정에서 최적의
          전략으로 고객의 권리를 찾아드립니다.
        </Text>
      </Box>

      {/* 통계 섹션 */}
      <Box className='mb-8 p-4 border rounded-lg bg-gray-2'>
        <Heading size='5' className='mb-4'>
          채권 회수 통계
        </Heading>
        <Flex wrap='wrap' gap='4' className='justify-between'>
          <Card className='p-4 flex-1 min-w-[200px]'>
            <Flex direction='column' align='center' gap='2'>
              <Text size='6' weight='bold' className='text-blue-11'>
                {recoveryStatistics.averageRecoveryRate}%
              </Text>
              <Text size='2'>평균 회수율</Text>
            </Flex>
          </Card>
          <Card className='p-4 flex-1 min-w-[200px]'>
            <Flex direction='column' align='center' gap='2'>
              <Text size='6' weight='bold' className='text-blue-11'>
                {recoveryStatistics.averageDuration}개월
              </Text>
              <Text size='2'>평균 소요기간</Text>
            </Flex>
          </Card>
          <Card className='p-4 flex-1 min-w-[200px]'>
            <Flex direction='column' align='center' gap='2'>
              <Text size='6' weight='bold' className='text-blue-11'>
                92%
              </Text>
              <Text size='2'>담보부 채권 회수율</Text>
            </Flex>
          </Card>
          <Card className='p-4 flex-1 min-w-[200px]'>
            <Flex direction='column' align='center' gap='2'>
              <Text size='6' weight='bold' className='text-blue-11'>
                95%
              </Text>
              <Text size='2'>법원 판결 성공률</Text>
            </Flex>
          </Card>
        </Flex>
      </Box>

      {/* 필터 및 검색 섹션 */}
      <Box className='mb-6'>
        <Flex gap='4' wrap='wrap' className='mb-4'>
          <Box className='flex-grow'>
            <input
              type='text'
              placeholder='사례 검색...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-10 pr-4 py-2 border border-gray-6 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-8'
            />
          </Box>
          <Box>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className='px-4 py-2 border border-gray-6 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-8'
            >
              <option value='all'>전체 카테고리</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </Box>
        </Flex>

        <Text size='2' color='gray'>
          {filteredCases.length}개의 성공사례가 있습니다
          {selectedCategory !== 'all' && ` (카테고리: ${selectedCategory})`}
          {searchQuery && ` | 검색어: "${searchQuery}"`}
        </Text>
      </Box>

      {/* 사례 목록 섹션 */}
      <Box className='mb-10'>
        <Flex direction='column' gap='4'>
          {filteredCases.map((caseItem) => (
            <Card
              key={caseItem.id}
              className='p-0 overflow-hidden transition-shadow hover:shadow-md cursor-pointer'
              onClick={() => handleCaseSelect(caseItem)}
            >
              <Flex direction={{ initial: 'column', sm: 'row' }}>
                <Box className='p-4 sm:p-6 flex-1'>
                  <Flex direction='column' gap='3'>
                    <Flex justify='between' align='center' gap='2'>
                      <Badge
                        color={
                          caseItem.recoveryRate >= 90
                            ? 'green'
                            : caseItem.recoveryRate >= 80
                            ? 'blue'
                            : caseItem.recoveryRate >= 70
                            ? 'yellow'
                            : 'orange'
                        }
                      >
                        회수율 {caseItem.recoveryRate}%
                      </Badge>
                      <Badge variant='outline'>{caseItem.category}</Badge>
                    </Flex>

                    <Heading size='4'>{caseItem.title}</Heading>

                    <Text size='2' color='gray' className='line-clamp-2'>
                      {caseItem.summary}
                    </Text>

                    <Separator size='4' />

                    <Flex gap='4' wrap='wrap'>
                      <Flex align='center' gap='1'>
                        <InfoCircledIcon />
                        <Text size='2'>
                          {formatAmount(caseItem.amount)} 중 {formatAmount(caseItem.recoveredAmount)} 회수
                        </Text>
                      </Flex>
                      <Flex align='center' gap='1'>
                        <ClockIcon />
                        <Text size='2'>{caseItem.duration} 소요</Text>
                      </Flex>
                      <Flex align='center' gap='1'>
                        <PersonIcon />
                        <Text size='2'>{caseItem.debtorType}</Text>
                      </Flex>
                    </Flex>
                  </Flex>
                </Box>

                <Box className='sm:w-[180px] bg-blue-3 p-4 flex flex-col justify-center items-center'>
                  <Heading size='7' className='text-blue-11 mb-2'>
                    {caseItem.recoveryRate}%
                  </Heading>
                  <Text size='2' color='gray' className='mb-1'>
                    회수율
                  </Text>
                  <Button size='1' variant='outline' className='mt-2'>
                    상세보기
                    <ChevronRightIcon />
                  </Button>
                </Box>
              </Flex>
            </Card>
          ))}
        </Flex>
      </Box>

      {/* 상세 보기 모달 */}
      {showCaseDetails && (
        <div
          className='fixed inset-0 bg-gray-12 bg-opacity-50 flex items-center justify-center z-50 p-4'
          onClick={handleModalClick}
        >
          <div ref={modalRef} className='bg-gray-1 rounded-lg max-w-[900px] max-h-[90vh] w-full overflow-hidden'>
            <div className='p-6'>
              <div className='flex justify-between items-start mb-2'>
                <h2 className='text-xl font-bold text-gray-12'>{selectedCase?.title}</h2>
                <button onClick={closeModal} className='text-gray-9 hover:text-gray-11'>
                  <Cross2Icon width={20} height={20} />
                </button>
              </div>

              <div className='flex flex-wrap items-center gap-2 mb-2'>
                <span className='px-2 py-1 rounded-full text-xs font-medium bg-gray-3 text-gray-11'>
                  {selectedCase?.category}
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(
                    selectedCase?.difficulty
                  )}`}
                >
                  난이도: {selectedCase?.difficulty}
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getRecoveryRateColor(
                    selectedCase?.recoveryRate
                  )}`}
                >
                  회수율 {selectedCase?.recoveryRate}%
                </span>
              </div>

              <hr className='my-4 border-gray-6' />

              {/* 탭 네비게이션 */}
              <div className='border-b border-gray-6'>
                <div className='flex space-x-2'>
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-2 ${
                      activeTab === 'overview' ? 'border-b-2 border-blue-9 font-medium text-blue-11' : 'text-gray-9'
                    }`}
                  >
                    개요
                  </button>
                  <button
                    onClick={() => setActiveTab('timeline')}
                    className={`px-4 py-2 ${
                      activeTab === 'timeline' ? 'border-b-2 border-blue-9 font-medium text-blue-11' : 'text-gray-9'
                    }`}
                  >
                    진행 과정
                  </button>
                  <button
                    onClick={() => setActiveTab('financials')}
                    className={`px-4 py-2 ${
                      activeTab === 'financials' ? 'border-b-2 border-blue-9 font-medium text-blue-11' : 'text-gray-9'
                    }`}
                  >
                    비용 및 수익
                  </button>
                  <button
                    onClick={() => setActiveTab('review')}
                    className={`px-4 py-2 ${
                      activeTab === 'review' ? 'border-b-2 border-blue-9 font-medium text-blue-11' : 'text-gray-9'
                    }`}
                  >
                    고객 후기
                  </button>
                </div>
              </div>

              {/* 탭 컨텐츠 */}
              <div className='py-4'>
                <div className='h-[400px] overflow-y-auto pr-2'>
                  {/* 개요 탭 */}
                  {activeTab === 'overview' && (
                    <div className='space-y-4'>
                      <div>
                        <h3 className='text-lg font-bold mb-2 text-gray-12'>사례 요약</h3>
                        <p className='text-gray-11'>{selectedCase?.summary}</p>
                      </div>

                      <div>
                        <h3 className='text-lg font-bold mb-2 text-gray-12'>주요 전략</h3>
                        <div className='space-y-2'>
                          {selectedCase?.strategy.map((strategy, index) => (
                            <div key={index} className='flex gap-2 items-start'>
                              <CheckCircledIcon className='mt-1 text-green-9' />
                              <p className='text-gray-11'>{strategy}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className='text-lg font-bold mb-2 text-gray-12'>채권 및 채무자 정보</h3>
                        <table className='w-full border-collapse'>
                          <tbody>
                            <tr className='border-b border-gray-6'>
                              <td className='py-2 font-semibold text-gray-11'>채권 금액</td>
                              <td className='text-gray-12'>{formatAmount(selectedCase?.amount)}</td>
                            </tr>
                            <tr className='border-b border-gray-6'>
                              <td className='py-2 font-semibold text-gray-11'>회수 금액</td>
                              <td className='text-gray-12'>{formatAmount(selectedCase?.recoveredAmount)}</td>
                            </tr>
                            <tr className='border-b border-gray-6'>
                              <td className='py-2 font-semibold text-gray-11'>채무자 유형</td>
                              <td className='text-gray-12'>{selectedCase?.debtorType}</td>
                            </tr>
                            <tr className='border-b border-gray-6'>
                              <td className='py-2 font-semibold text-gray-11'>채무자 정보</td>
                              <td className='text-gray-12'>{selectedCase?.debtorInfo}</td>
                            </tr>
                            <tr>
                              <td className='py-2 font-semibold text-gray-11'>소요 기간</td>
                              <td className='text-gray-12'>{selectedCase?.duration}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div>
                        <h3 className='text-lg font-bold mb-2 text-gray-12'>핵심 성공 요인</h3>
                        <div className='space-y-2'>
                          {selectedCase?.mainPoints.map((point, index) => (
                            <div key={index} className='flex gap-2 items-start'>
                              <div className='w-6 h-6 rounded-full bg-blue-3 text-blue-11 flex items-center justify-center flex-shrink-0'>
                                {index + 1}
                              </div>
                              <p className='text-gray-11'>{point}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className='text-lg font-bold mb-2 text-gray-12'>관련 문서</h3>
                        <div className='flex gap-2 flex-wrap'>
                          {selectedCase?.relatedDocuments.map((doc, index) => (
                            <span
                              key={index}
                              className='px-3 py-1 rounded-full bg-gray-3 border border-gray-6 text-sm flex items-center gap-1 text-gray-11'
                            >
                              <DownloadIcon className='text-gray-9' />
                              {doc}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 진행 과정 탭 */}
                  {activeTab === 'timeline' && (
                    <div className='relative pl-8 pb-1'>
                      <div className='absolute left-3 top-0 bottom-0 w-px bg-gray-6'></div>

                      {selectedCase?.timeline.map((item, index) => (
                        <div key={index} className='mb-6 relative'>
                          <div className='absolute left-[-28px] w-6 h-6 rounded-full bg-blue-3 flex items-center justify-center z-10 text-blue-11'>
                            {index + 1}
                          </div>

                          <div className='border border-gray-6 rounded-lg p-4'>
                            <div className='flex justify-between mb-2 flex-wrap'>
                              <span className='px-2 py-1 rounded-full text-xs font-medium bg-gray-3 text-gray-11'>
                                {item.phase}
                              </span>
                              <span className='text-sm text-gray-9'>{item.date}</span>
                            </div>

                            <h4 className='text-md font-bold mb-1 text-gray-12'>{item.title}</h4>
                            <p className='mb-3 text-gray-11'>{item.description}</p>

                            <div className='flex gap-4 flex-wrap text-sm'>
                              <div className='flex items-center gap-1 text-gray-11'>
                                <ClockIcon />
                                <span>소요 기간: {item.duration}</span>
                              </div>
                              <div className='flex items-center gap-1 text-gray-11'>
                                <PieChartIcon />
                                <span>비용: {formatAmount(item.cost)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 비용 및 수익 탭 */}
                  {activeTab === 'financials' && (
                    <div className='space-y-6'>
                      <div>
                        <h3 className='text-lg font-bold mb-2 text-gray-12'>비용 및 수익 요약</h3>
                        <table className='w-full border-collapse'>
                          <tbody>
                            <tr className='border-b border-gray-6'>
                              <td className='py-2 font-semibold text-gray-11'>원금</td>
                              <td className='text-gray-12'>{formatAmount(selectedCase?.amount)}</td>
                            </tr>
                            <tr className='border-b border-gray-6'>
                              <td className='py-2 font-semibold text-gray-11'>회수 금액</td>
                              <td className='text-gray-12'>{formatAmount(selectedCase?.recoveredAmount)}</td>
                            </tr>
                            <tr className='border-b border-gray-6'>
                              <td className='py-2 font-semibold text-gray-11'>총 비용</td>
                              <td className='text-gray-12'>{formatAmount(selectedCase?.totalCost)}</td>
                            </tr>
                            <tr className='border-b border-gray-6'>
                              <td className='py-2 font-semibold text-gray-11'>순수익</td>
                              <td className='text-green-11'>{formatAmount(selectedCase?.netReturn)}</td>
                            </tr>
                            <tr>
                              <td className='py-2 font-semibold text-gray-11'>비용 대비 수익률</td>
                              <td className='text-green-11'>{selectedCase?.rateOfReturn}%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div>
                        <h3 className='text-lg font-bold mb-2 text-gray-12'>단계별 비용 분석</h3>
                        <div className='p-4 border border-gray-6 rounded-lg'>
                          {selectedCase?.timeline.map((item, index) => (
                            <div key={index} className='mb-3'>
                              <div className='flex justify-between mb-1'>
                                <span className='font-medium text-gray-11'>{item.title}</span>
                                <span className='text-gray-12'>{formatAmount(item.cost)}</span>
                              </div>
                              <div className='w-full bg-gray-3 rounded-full h-2 overflow-hidden'>
                                <div
                                  className='bg-blue-9 h-full rounded-full'
                                  style={{
                                    width: `${(item.cost / selectedCase.totalCost) * 100}%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className='text-lg font-bold mb-2 text-gray-12'>투자 효율성</h3>
                        <div className='flex flex-wrap gap-4'>
                          <div className='p-4 border border-gray-6 rounded-lg shadow-sm flex-1 min-w-[200px]'>
                            <div className='flex flex-col items-center gap-2'>
                              <span className='text-2xl font-bold text-green-11'>{selectedCase?.recoveryRate}%</span>
                              <span className='text-sm text-gray-10'>회수율</span>
                            </div>
                          </div>

                          <div className='p-4 border border-gray-6 rounded-lg shadow-sm flex-1 min-w-[200px]'>
                            <div className='flex flex-col items-center gap-2'>
                              <span className='text-2xl font-bold text-green-11'>
                                {((selectedCase.totalCost / selectedCase.amount) * 100).toFixed(1)}%
                              </span>
                              <span className='text-sm text-gray-10'>비용/원금 비율</span>
                            </div>
                          </div>

                          <div className='p-4 border border-gray-6 rounded-lg shadow-sm flex-1 min-w-[200px]'>
                            <div className='flex flex-col items-center gap-2'>
                              <span className='text-2xl font-bold text-green-11'>{selectedCase?.rateOfReturn}%</span>
                              <span className='text-sm text-gray-10'>투자수익률</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 고객 후기 탭 */}
                  {activeTab === 'review' && (
                    <div className='space-y-6'>
                      <div>
                        <h3 className='text-lg font-bold mb-4 text-gray-12'>고객 후기</h3>
                        <div className='p-6 border border-gray-6 rounded-lg'>
                          <div className='flex flex-col gap-4'>
                            <div className='bg-gray-2 p-4 rounded-lg italic text-gray-11'>
                              &ldquo;{selectedCase?.clientReview.content}&rdquo;
                            </div>

                            <div className='flex justify-between items-end'>
                              <div className='flex flex-col gap-1'>
                                <div className='flex items-center gap-2'>
                                  <div className='w-10 h-10 rounded-full bg-blue-3 text-blue-11 flex items-center justify-center font-bold'>
                                    {selectedCase?.clientReview.name.charAt(0)}
                                  </div>
                                  <div>
                                    <p className='font-bold text-gray-12'>{selectedCase?.clientReview.name}</p>
                                    <p className='text-sm text-gray-9'>{selectedCase?.clientReview.company}</p>
                                  </div>
                                </div>
                              </div>

                              <div className='flex items-center gap-1'>
                                <StarRating rating={selectedCase?.clientReview.rating || 0} />
                                <span className='text-sm text-gray-9'>{selectedCase?.clientReview.rating}/5</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className='text-lg font-bold mb-2 text-gray-12'>유사 사례 후기</h3>
                        {caseStudies
                          .filter(
                            (caseItem) =>
                              caseItem.category === selectedCase?.category && caseItem.id !== selectedCase?.id
                          )
                          .slice(0, 2)
                          .map((caseItem) => (
                            <div key={caseItem.id} className='p-4 border border-gray-6 rounded-lg mb-3'>
                              <div className='flex flex-col gap-3'>
                                <p className='text-sm italic text-gray-11'>
                                  &ldquo;{caseItem.clientReview.content}&rdquo;
                                </p>

                                <div className='flex justify-between items-center'>
                                  <div className='flex items-center gap-2'>
                                    <div className='w-8 h-8 rounded-full bg-gray-3 flex items-center justify-center font-bold text-sm text-gray-11'>
                                      {caseItem.clientReview.name.charAt(0)}
                                    </div>
                                    <p className='text-sm font-medium text-gray-11'>
                                      {caseItem.clientReview.name}, {caseItem.clientReview.company}
                                    </p>
                                  </div>

                                  <StarRating rating={caseItem.clientReview.rating} />
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className='flex gap-3 mt-4 justify-end'>
                <button onClick={closeModal} className='px-4 py-2 bg-gray-3 hover:bg-gray-4 rounded-md text-gray-11'>
                  닫기
                </button>
                <button className='px-4 py-2 bg-blue-9 hover:bg-blue-10 text-white rounded-md'>
                  유사한 채권 회수 문의하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 법률 자료 섹션 */}
      <Box className='mb-10'>
        <Heading size='5' className='mb-4'>
          관련 법률 자료
        </Heading>
        <Table.Root variant='surface'>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>판례번호</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>카테고리</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>내용</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>활용 방안</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
        </Table.Root>
      </Box>

      {/* CTA 섹션 */}
      <Box className='rounded-lg p-6 bg-blue-3 text-center mb-10'>
        <Heading size='5' className='mb-2'>
          채권 회수에 어려움을 겪고 계신가요?
        </Heading>
        <Text className='mb-4 max-w-2xl mx-auto text-gray-11'>
          전문적인 채권 회수 노하우와 다양한 성공 경험을 바탕으로 최적의 해결책을 제시해 드립니다. 지금 바로 무료 상담을
          신청하세요.
        </Text>
        <Button size='3' className='px-6'>
          무료 상담 신청하기
        </Button>
      </Box>
    </Box>
  );
};

export default CaseStudiesPage;
