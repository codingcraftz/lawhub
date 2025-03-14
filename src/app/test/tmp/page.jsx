'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaChartLine } from "react-icons/fa6";
import {
  ArrowLeftIcon,
  SliderIcon,
  CalendarIcon,
  ReloadIcon,
  BarChartIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  InfoCircledIcon,
  DashboardIcon,
  DownloadIcon,
  PlusCircledIcon,
  LineChartIcon,
  CheckCircledIcon,
  MixerVerticalIcon,
} from '@radix-ui/react-icons';
import { Box, Button, Tabs, Slider, Select, Badge } from '@radix-ui/themes';
import { Line, Bar } from 'react-chartjs-2';
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
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const BondSimulatorPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('value');
  const [recoveryRate, setRecoveryRate] = useState(65);
  const [timeframe, setTimeframe] = useState(12);
  const [legalStrategy, setLegalStrategy] = useState('aggressive');
  const [marketCondition, setMarketCondition] = useState('stable');
  const [interestRate, setInterestRate] = useState(5);
  const [inflationRate, setInflationRate] = useState(2.5);
  const [selectedBond, setSelectedBond] = useState(null);
  const [bondsList, setBondsList] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResults, setSimulationResults] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [marketTrends, setMarketTrends] = useState([]);

  useEffect(() => {
    const mockBonds = Array(7)
      .fill()
      .map((_, i) => ({
        id: `bond-${i + 1}`,
        title: `${['회생채권', '공사대금', '매매대금', '임대차보증금', '대여금'][i % 5]} ${i + 1}`,
        debtor: `${['주식회사', '유한회사'][i % 2]} ${['대한', '서울', '미래', '한국', '글로벌'][i % 5]}${
          ['산업', '건설', '전자', '물류', '기업'][i % 5]
        }`,
        originalAmount: Math.floor(Math.random() * 500000000) + 50000000,
        currentValue: Math.floor(Math.random() * 400000000) + 30000000,
        recoveryRate: Math.floor(Math.random() * 40) + 40,
        riskLevel: ['낮음', '중간', '높음'][i % 3],
        expectedTimeframe: Math.floor(Math.random() * 18) + 6,
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        hasCourtOrder: i % 3 === 0,
        industry: ['건설업', 'IT', '제조업', '서비스업', '도소매업'][i % 5],
        lastUpdated: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        marketValue: Math.floor(Math.random() * 350000000) + 20000000,
      }));

    setBondsList(mockBonds);
    setSelectedBond(mockBonds[0]);

    const generateTrendData = () => {
      const today = new Date();
      const data = [];
      for (let i = 180; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);

        let baseValue = 100;
        const monthOscillation = Math.sin(i / 30) * 8;
        const randomFactor = (Math.random() - 0.5) * 5;
        const trendValue = baseValue + monthOscillation + randomFactor + (i > 90 ? -15 : 0);

        data.push({
          date: formatDate(date),
          value: Math.max(70, Math.min(130, trendValue)),
        });
      }
      return data;
    };

    setMarketTrends(generateTrendData());
  }, []);

  const runSimulation = () => {
    if (!selectedBond) return;

    setIsSimulating(true);

    setTimeout(() => {
      const baseRecoveryAmount = selectedBond.originalAmount * (recoveryRate / 100);

      const monthlyValues = [];
      const npvValues = [];
      const marketValues = [];

      const strategyFactor = legalStrategy === 'aggressive' ? 1.2 : legalStrategy === 'balanced' ? 1.0 : 0.8;

      const marketFactor = marketCondition === 'favorable' ? 1.15 : marketCondition === 'stable' ? 1.0 : 0.85;

      for (let month = 0; month <= timeframe; month++) {
        const progressFactor = month / timeframe;
        const recoveryProgress = (0.2 + progressFactor * 0.8) * strategyFactor * marketFactor;
        let monthlyValue = baseRecoveryAmount * recoveryProgress;

        if (progressFactor < 0.3) {
          monthlyValue *= progressFactor * 2;
        } else if (progressFactor > 0.7) {
          monthlyValue *= 1 + (progressFactor - 0.7) * 0.6;
        }

        const monthlyInterestFactor = 1 + interestRate / 100 / 12;
        const npvValue = monthlyValue / Math.pow(monthlyInterestFactor, month);

        const marketPriceFactor = 0.6 + progressFactor * 0.3 + Math.random() * 0.1;
        const marketValue = npvValue * marketPriceFactor;

        monthlyValues.push({
          month,
          value: monthlyValue,
        });

        npvValues.push({
          month,
          value: npvValue,
        });

        marketValues.push({
          month,
          value: marketValue,
        });
      }

      const riskFactors = [];

      if (!selectedBond.hasCourtOrder) {
        riskFactors.push({
          factor: '집행권원 부재',
          impact: 'high',
          description: '법적 집행 수단 제한으로 회수 지연 가능성 증가',
        });
      }

      if (selectedBond.industry === '건설업' && marketCondition === 'unfavorable') {
        riskFactors.push({
          factor: '건설업 경기 침체',
          impact: 'high',
          description: '현재 건설업 불황으로 회수 어려움 예상',
        });
      }

      if (recoveryRate > 80) {
        riskFactors.push({
          factor: '과도한 기대치',
          impact: 'medium',
          description: '목표 회수율이 현실적인 수준을 초과함',
        });
      }

      if (timeframe < 8) {
        riskFactors.push({
          factor: '단기 회수 계획',
          impact: 'medium',
          description: '짧은 기간 내 회수는 압박 전략 필요',
        });
      }

      const scenarios = [
        {
          name: '낙관적',
          recoveryRate: Math.min(100, recoveryRate + 15),
          timeframe: Math.max(1, Math.floor(timeframe * 0.7)),
          totalValue: baseRecoveryAmount * 1.15,
          probability: 20,
        },
        {
          name: '기본',
          recoveryRate: recoveryRate,
          timeframe: timeframe,
          totalValue: baseRecoveryAmount,
          probability: 60,
        },
        {
          name: '비관적',
          recoveryRate: Math.max(10, recoveryRate - 20),
          timeframe: Math.floor(timeframe * 1.3),
          totalValue: baseRecoveryAmount * 0.8,
          probability: 20,
        },
      ];

      const simulationData = {
        bond: selectedBond,
        recoveryRate,
        timeframe,
        originalAmount: selectedBond.originalAmount,
        expectedRecovery: baseRecoveryAmount,
        monthlyValues,
        npvValues,
        marketValues,
        riskFactors,
        scenarios,
        roi: (((baseRecoveryAmount - selectedBond.currentValue) / selectedBond.currentValue) * 100).toFixed(1),
        sellRecommendation: baseRecoveryAmount < selectedBond.marketValue * 1.2,
        marketLiquidity: Math.random() * 60 + 20,
        optimalSellTime: Math.floor(timeframe * 0.6),
      };

      setSimulationResults(simulationData);
      setIsSimulating(false);
    }, 1800);
  };

  const formatAmount = (amount) => {
    if (!amount || amount < 1000) return '0원';
    return Math.round(amount).toLocaleString('ko-KR') + '원';
  };

  const formatDate = (date) => {
    if (!date) return '';
    return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
  };

  const formatMonth = (month) => {
    return month > 0 ? `${month}개월 후` : '현재';
  };

  const getValueChartData = () => {
    if (!simulationResults) return { labels: [], datasets: [] };

    return {
      labels: simulationResults.monthlyValues.map((item) => formatMonth(item.month)),
      datasets: [
        {
          label: '회수 예상액',
          data: simulationResults.monthlyValues.map((item) => item.value),
          borderColor: 'rgb(42, 122, 221)',
          backgroundColor: 'rgba(42, 122, 221, 0.1)',
          tension: 0.4,
          fill: true,
        },
        {
          label: '현재 가치 (NPV)',
          data: simulationResults.npvValues.map((item) => item.value),
          borderColor: 'rgb(76, 175, 80)',
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          tension: 0.4,
        },
        {
          label: '시장 매각가',
          data: simulationResults.marketValues.map((item) => item.value),
          borderColor: 'rgb(255, 152, 0)',
          backgroundColor: 'transparent',
          borderDash: [2, 2],
          tension: 0.4,
        },
      ],
    };
  };

  const getScenarioChartData = () => {
    if (!simulationResults) return { labels: [], datasets: [] };

    return {
      labels: simulationResults.scenarios.map((scenario) => scenario.name),
      datasets: [
        {
          label: '예상 회수액',
          data: simulationResults.scenarios.map((scenario) => scenario.totalValue),
          backgroundColor: ['rgba(76, 175, 80, 0.7)', 'rgba(42, 122, 221, 0.7)', 'rgba(255, 152, 0, 0.7)'],
          borderColor: ['rgb(76, 175, 80)', 'rgb(42, 122, 221)', 'rgb(255, 152, 0)'],
          borderWidth: 1,
        },
      ],
    };
  };

  const getMarketTrendChartData = () => {
    return {
      labels: marketTrends.map((item) => item.date).filter((_, i) => i % 10 === 0),
      datasets: [
        {
          label: '채권 시장 트렌드',
          data: marketTrends.map((item) => item.value),
          borderColor: 'rgb(156, 39, 176)',
          backgroundColor: 'rgba(156, 39, 176, 0.1)',
          tension: 0.4,
          fill: true,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => {
            return `${context.dataset.label}: ${formatAmount(context.raw)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => formatAmount(value),
        },
      },
    },
  };

  const scenarioChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => {
            const scenario = simulationResults.scenarios[context.dataIndex];
            return [
              `${context.dataset.label}: ${formatAmount(context.raw)}`,
              `회수율: ${scenario.recoveryRate}%`,
              `소요기간: ${scenario.timeframe}개월`,
              `확률: ${scenario.probability}%`,
            ];
          },
        },
      },
    },
  };

  const trendChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => `시장 상대가치: ${context.raw}%`,
        },
      },
    },
    scales: {
      y: {
        suggestedMin: 60,
        suggestedMax: 140,
        ticks: {
          callback: (value) => `${value}%`,
        },
      },
    },
  };

  return (
    <Box className='p-4 mx-auto w-full sm:px-6 md:px-8 lg:px-12 max-w-[1600px] bg-gray-2 min-h-screen'>
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-2'>
          <ArrowLeftIcon
            className='w-8 h-8 cursor-pointer hover:text-blue-10 transition-colors'
            onClick={() => router.back()}
          />
          <div>
            <h1 className='text-3xl font-bold text-gray-12'>채권 가치 시뮬레이터</h1>
            <p className='text-gray-11 mt-1'>
              채권의 현재 가치와 미래 가치를 분석하고 최적의 투자 전략을 시뮬레이션합니다.
            </p>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <Badge color='orange' variant='soft' radius='full' className='px-3 py-1'>
            <FaChartLine className='mr-1' /> 실시간 데이터
          </Badge>
          <Button size='2' variant='soft' color='gray' className='gap-1 ml-2'>
            <DownloadIcon /> 보고서 다운로드
          </Button>
          <Button size='2' variant='soft' color='gray' className='gap-1'>
            <DashboardIcon /> 대시보드
          </Button>
        </div>
      </div>

      <div className='flex gap-6'>
        <div
          className={`${
            sidebarOpen ? 'w-[320px]' : 'w-[40px]'
          } transition-all bg-gray-1 rounded-lg shadow-sm border border-gray-5 flex flex-col`}
        >
          <div className='flex items-center justify-between p-3 border-b border-gray-5'>
            <h2 className={`font-medium text-gray-12 ${!sidebarOpen && 'hidden'}`}>시뮬레이션 설정</h2>
            <Button size='1' variant='ghost' color='gray' onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </Button>
          </div>

          {sidebarOpen && (
            <div className='p-4 overflow-y-auto flex-grow'>
              <div className='mb-6'>
                <label className='block text-sm font-medium text-gray-11 mb-2'>채권 선택</label>
                <Select.Root
                  defaultValue={selectedBond?.id}
                  onValueChange={(value) => setSelectedBond(bondsList.find((bond) => bond.id === value))}
                >
                  <Select.Trigger className='w-full' />
                  <Select.Content>
                    {bondsList.map((bond) => (
                      <Select.Item key={bond.id} value={bond.id}>
                        {bond.title} - {formatAmount(bond.originalAmount)}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>

                {selectedBond && (
                  <div className='mt-3 space-y-2 text-sm'>
                    <div className='flex justify-between'>
                      <span className='text-gray-11'>채무자:</span>
                      <span className='font-medium text-gray-12'>{selectedBond.debtor}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-11'>원금액:</span>
                      <span className='font-medium text-gray-12'>{formatAmount(selectedBond.originalAmount)}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-11'>현재가치:</span>
                      <span className='font-medium text-gray-12'>{formatAmount(selectedBond.currentValue)}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-11'>현재 회수율:</span>
                      <span className='font-medium text-gray-12'>{selectedBond.recoveryRate}%</span>
                    </div>
                  </div>
                )}
              </div>

              <div className='mb-6'>
                <div className='flex justify-between items-center mb-2'>
                  <label className='block text-sm font-medium text-gray-11'>목표 회수율 (%)</label>
                  <span className='text-blue-11 font-medium'>{recoveryRate}%</span>
                </div>
                <Slider
                  value={[recoveryRate]}
                  onValueChange={(values) => setRecoveryRate(values[0])}
                  min={10}
                  max={100}
                  step={5}
                  className='w-full'
                />
                <div className='flex justify-between mt-1 text-xs text-gray-9'>
                  <span>낮음 (10%)</span>
                  <span>높음 (100%)</span>
                </div>
              </div>

              <div className='mb-6'>
                <div className='flex justify-between items-center mb-2'>
                  <label className='block text-sm font-medium text-gray-11'>예상 회수 기간 (개월)</label>
                  <span className='text-blue-11 font-medium'>{timeframe}개월</span>
                </div>
                <Slider
                  value={[timeframe]}
                  onValueChange={(values) => setTimeframe(values[0])}
                  min={1}
                  max={36}
                  step={1}
                  className='w-full'
                />
                <div className='flex justify-between mt-1 text-xs text-gray-9'>
                  <span>단기 (1개월)</span>
                  <span>장기 (36개월)</span>
                </div>
              </div>

              <div className='mb-6'>
                <label className='block text-sm font-medium text-gray-11 mb-2'>법적 전략</label>
                <Select.Root value={legalStrategy} onValueChange={setLegalStrategy}>
                  <Select.Trigger className='w-full' />
                  <Select.Content>
                    <Select.Item value='aggressive'>적극적 (높은 위험/높은 수익)</Select.Item>
                    <Select.Item value='balanced'>균형적 (중간 위험/중간 수익)</Select.Item>
                    <Select.Item value='conservative'>보수적 (낮은 위험/낮은 수익)</Select.Item>
                  </Select.Content>
                </Select.Root>
              </div>

              <div className='mb-6'>
                <label className='block text-sm font-medium text-gray-11 mb-2'>시장 상황</label>
                <Select.Root value={marketCondition} onValueChange={setMarketCondition}>
                  <Select.Trigger className='w-full' />
                  <Select.Content>
                    <Select.Item value='favorable'>우호적</Select.Item>
                    <Select.Item value='stable'>안정적</Select.Item>
                    <Select.Item value='unfavorable'>불리함</Select.Item>
                  </Select.Content>
                </Select.Root>
              </div>

              <div className='mb-6'>
                <div className='flex justify-between items-center mb-2'>
                  <label className='block text-sm font-medium text-gray-11'>금리 (%)</label>
                  <span className='text-gray-12 font-medium'>{interestRate}%</span>
                </div>
                <Slider
                  value={[interestRate]}
                  onValueChange={(values) => setInterestRate(values[0])}
                  min={1}
                  max={10}
                  step={0.5}
                  className='w-full'
                />
              </div>

              <div className='mb-6'>
                <div className='flex justify-between items-center mb-2'>
                  <label className='block text-sm font-medium text-gray-11'>물가상승률 (%)</label>
                  <span className='text-gray-12 font-medium'>{inflationRate}%</span>
                </div>
                <Slider
                  value={[inflationRate]}
                  onValueChange={(values) => setInflationRate(values[0])}
                  min={0}
                  max={8}
                  step={0.5}
                  className='w-full'
                />
              </div>

              <Button
                size='3'
                variant='solid'
                color='blue'
                className='w-full gap-2 mt-2'
                disabled={isSimulating || !selectedBond}
                onClick={runSimulation}
              >
                {isSimulating ? (
                  <>
                    <ReloadIcon className='animate-spin' /> 시뮬레이션 중...
                  </>
                ) : (
                  <>
                    <BarChartIcon /> 시뮬레이션 실행
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        <div className='flex-grow bg-gray-1 rounded-lg shadow-md border border-gray-5'>
          {!simulationResults ? (
            <div className='flex flex-col items-center justify-center h-full p-8 text-center'>
              <SliderIcon className='w-12 h-12 text-gray-9 mb-4' />
              <h2 className='text-xl font-medium text-gray-12 mb-2'>채권 시뮬레이션을 실행하세요</h2>
              <p className='text-gray-11 max-w-md'>
                좌측에서 채권을 선택하고 회수율, 기간 등 원하는 조건을 설정한 후 시뮬레이션 버튼을 클릭하면 다양한 분석
                결과를 확인할 수 있습니다.
              </p>
            </div>
          ) : (
            <>
              <div className='border-b border-gray-5'>
                <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
                  <Tabs.List className='px-4'>
                    <Tabs.Trigger value='value'>가치 분석</Tabs.Trigger>
                    <Tabs.Trigger value='scenarios'>시나리오 분석</Tabs.Trigger>
                    <Tabs.Trigger value='market'>시장 분석</Tabs.Trigger>
                    <Tabs.Trigger value='recommendations'>투자 추천</Tabs.Trigger>
                  </Tabs.List>
                </Tabs.Root>
              </div>

              <div className='p-6'>
                {activeTab === 'value' && (
                  <div>
                    <div className='flex justify-between items-center mb-6'>
                      <h2 className='text-xl font-semibold text-gray-12'>채권 가치 분석</h2>
                      <div className='flex items-center gap-1 text-sm text-gray-11'>
                        <CalendarIcon className='w-4 h-4' />
                        마지막 업데이트: {formatDate(new Date())}
                      </div>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
                      <div className='bg-blue-2 border border-blue-6 rounded-lg p-4'>
                        <p className='text-gray-11 text-sm mb-1'>현재 가치</p>
                        <p className='text-2xl font-bold text-blue-11'>{formatAmount(selectedBond.currentValue)}</p>
                        <div className='flex items-center mt-1'>
                          <span className='text-xs text-gray-11'>원금 대비:</span>
                          <div className='w-full bg-gray-4 rounded-full h-1.5 mx-2'>
                            <div
                              className='bg-blue-9 h-1.5 rounded-full'
                              style={{ width: `${(selectedBond.currentValue / selectedBond.originalAmount) * 100}%` }}
                            ></div>
                          </div>
                          <span className='text-xs font-medium text-blue-11'>
                            {((selectedBond.currentValue / selectedBond.originalAmount) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      <div className='bg-green-2 border border-green-6 rounded-lg p-4'>
                        <p className='text-gray-11 text-sm mb-1'>예상 회수액</p>
                        <p className='text-2xl font-bold text-green-11'>
                          {formatAmount(simulationResults.expectedRecovery)}
                        </p>
                        <div className='flex items-center mt-1'>
                          <span className='text-xs text-gray-11'>원금 대비:</span>
                          <div className='w-full bg-gray-4 rounded-full h-1.5 mx-2'>
                            <div className='bg-green-9 h-1.5 rounded-full' style={{ width: `${recoveryRate}%` }}></div>
                          </div>
                          <span className='text-xs font-medium text-green-11'>{recoveryRate}%</span>
                        </div>
                      </div>

                      <div className='bg-orange-2 border border-orange-6 rounded-lg p-4'>
                        <p className='text-gray-11 text-sm mb-1'>투자 수익률</p>
                        <p className='text-2xl font-bold text-orange-11'>{simulationResults.roi}%</p>
                        <p className='text-xs text-gray-11 mt-1'>
                          투자 기간: {timeframe}개월 (월 {(simulationResults.roi / timeframe).toFixed(1)}%)
                        </p>
                      </div>
                    </div>

                    <div className='mb-8'>
                      <h3 className='text-lg font-medium mb-4 text-gray-12'>채권 가치 추이</h3>
                      <div className='h-[350px]'>
                        <Line data={getValueChartData()} options={chartOptions} />
                      </div>
                    </div>

                    <div className='bg-gray-2 border border-gray-6 rounded-lg p-4 mb-6'>
                      <h3 className='text-base font-medium mb-3 text-gray-12 flex items-center'>
                        <InfoCircledIcon className='mr-2' /> 가치 분석 인사이트
                      </h3>
                      <div className='space-y-2 text-sm text-gray-11'>
                        <p>
                          <span className='font-medium text-blue-11'>현재 가치 평가:</span> 이 채권의 현재 가치는 원금의{' '}
                          {((selectedBond.currentValue / selectedBond.originalAmount) * 100).toFixed(1)}%입니다. 설정한
                          조건에 따라 {timeframe}개월 후 원금의 {recoveryRate}%를 회수할 것으로 예상됩니다.
                        </p>
                        <p>
                          <span className='font-medium text-blue-11'>최적 회수 시점:</span> 시뮬레이션 결과, 약{' '}
                          {simulationResults.optimalSellTime}개월 후가 채권의 현재가치 대비 최적 회수 시점으로
                          분석됩니다.
                        </p>
                        <p>
                          <span className='font-medium text-blue-11'>NPV 분석:</span> 현재 금리와 물가상승률을 고려할
                          때, {timeframe}개월 후 회수 금액의 순현재가치(NPV)는{' '}
                          {formatAmount(simulationResults.npvValues[simulationResults.npvValues.length - 1].value)}로
                          예상됩니다.
                        </p>
                      </div>
                    </div>

                    {simulationResults.riskFactors.length > 0 && (
                      <div>
                        <h3 className='text-base font-medium mb-3 text-gray-12'>주요 리스크 요인</h3>
                        <div className='space-y-2'>
                          {simulationResults.riskFactors.map((risk, index) => (
                            <div
                              key={index}
                              className={`p-3 rounded-lg text-sm border ${
                                risk.impact === 'high' ? 'border-red-6 bg-red-2' : 'border-amber-6 bg-amber-2'
                              }`}
                            >
                              <div className='flex justify-between items-center mb-1'>
                                <span className='font-medium'>{risk.factor}</span>
                                <Badge color={risk.impact === 'high' ? 'red' : 'amber'} variant='soft'>
                                  {risk.impact === 'high' ? '높은 영향' : '중간 영향'}
                                </Badge>
                              </div>
                              <p className='text-gray-11'>{risk.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'scenarios' && (
                  <div>
                    <div className='flex justify-between items-center mb-6'>
                      <h2 className='text-xl font-semibold text-gray-12'>시나리오 분석</h2>
                      <div className='flex items-center gap-1 text-sm text-gray-11'>
                        <CalendarIcon className='w-4 h-4' />
                        마지막 업데이트: {formatDate(new Date())}
                      </div>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
                      {simulationResults.scenarios.map((scenario, index) => (
                        <div
                          key={index}
                          className={`rounded-lg p-4 border ${
                            scenario.name === '낙관적'
                              ? 'bg-green-2 border-green-6'
                              : scenario.name === '기본'
                              ? 'bg-blue-2 border-blue-6'
                              : 'bg-amber-2 border-amber-6'
                          }`}
                        >
                          <div className='flex justify-between items-center mb-2'>
                            <h3 className='font-medium'>{scenario.name} 시나리오</h3>
                            <Badge
                              variant='soft'
                              color={scenario.name === '낙관적' ? 'green' : scenario.name === '기본' ? 'blue' : 'amber'}
                            >
                              {scenario.probability}% 확률
                            </Badge>
                          </div>
                          <p className='text-2xl font-bold mb-2'>{formatAmount(scenario.totalValue)}</p>
                          <div className='space-y-2 text-sm'>
                            <div className='flex justify-between'>
                              <span className='text-gray-11'>예상 회수율:</span>
                              <span className='font-medium'>{scenario.recoveryRate}%</span>
                            </div>
                            <div className='flex justify-between'>
                              <span className='text-gray-11'>소요 기간:</span>
                              <span className='font-medium'>{scenario.timeframe}개월</span>
                            </div>
                            <div className='flex justify-between'>
                              <span className='text-gray-11'>원금 대비:</span>
                              <span className='font-medium'>
                                {((scenario.totalValue / selectedBond.originalAmount) * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className='mb-8'>
                      <h3 className='text-lg font-medium mb-4 text-gray-12'>시나리오 비교</h3>
                      <div className='h-[350px]'>
                        <Bar data={getScenarioChartData()} options={scenarioChartOptions} />
                      </div>
                    </div>

                    <div className='bg-gray-2 border border-gray-6 rounded-lg p-4'>
                      <h3 className='text-base font-medium mb-3 text-gray-12 flex items-center'>
                        <InfoCircledIcon className='mr-2' /> 시나리오 분석 인사이트
                      </h3>
                      <div className='space-y-2 text-sm text-gray-11'>
                        <p>
                          <span className='font-medium text-blue-11'>시나리오 해석:</span>
                          기본 시나리오에서는 {timeframe}개월 내 {recoveryRate}%의 회수율로{' '}
                          {formatAmount(simulationResults.expectedRecovery)}를 회수할 것으로 예상됩니다.
                        </p>
                        <p>
                          <span className='font-medium text-blue-11'>낙관적 시나리오:</span>
                          법적 진행이 순조롭고 채무자의 지급 능력이 향상되는 경우,{' '}
                          {simulationResults.scenarios[0].timeframe}개월 내{' '}
                          {simulationResults.scenarios[0].recoveryRate}%의 회수율을 달성할 수 있습니다.
                        </p>
                        <p>
                          <span className='font-medium text-blue-11'>비관적 시나리오:</span>
                          법적 절차 지연이나 채무자의 재정 악화 시, 회수율은{' '}
                          {simulationResults.scenarios[2].recoveryRate}%로 낮아지며 소요 기간이{' '}
                          {simulationResults.scenarios[2].timeframe}개월로 연장될 수 있습니다.
                        </p>
                        <p>
                          <span className='font-medium text-blue-11'>확률 분석:</span>
                          현재 상황에서는 기본 시나리오의 확률이 {simulationResults.scenarios[1].probability}%로 가장
                          높게 평가됩니다.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'market' && (
                  <div>
                    <div className='flex justify-between items-center mb-6'>
                      <h2 className='text-xl font-semibold text-gray-12'>채권 시장 분석</h2>
                      <div className='flex items-center gap-1 text-sm text-gray-11'>
                        <CalendarIcon className='w-4 h-4' />
                        마지막 업데이트: {formatDate(new Date())}
                      </div>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
                      <div className='bg-purple-2 border border-purple-6 rounded-lg p-4'>
                        <p className='text-gray-11 text-sm mb-1'>현재 시장 매각가</p>
                        <p className='text-2xl font-bold text-purple-11'>{formatAmount(selectedBond.marketValue)}</p>
                        <div className='flex items-center mt-1'>
                          <span className='text-xs text-gray-11'>현재 가치 대비:</span>
                          <div className='w-full bg-gray-4 rounded-full h-1.5 mx-2'>
                            <div
                              className='bg-purple-9 h-1.5 rounded-full'
                              style={{ width: `${(selectedBond.marketValue / selectedBond.currentValue) * 100}%` }}
                            ></div>
                          </div>
                          <span className='text-xs font-medium text-purple-11'>
                            {((selectedBond.marketValue / selectedBond.currentValue) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      <div className='bg-indigo-2 border border-indigo-6 rounded-lg p-4'>
                        <p className='text-gray-11 text-sm mb-1'>시장 유동성</p>
                        <p className='text-2xl font-bold text-indigo-11'>
                          {simulationResults.marketLiquidity.toFixed(1)}%
                        </p>
                        <p className='text-xs text-gray-11 mt-1'>
                          {simulationResults.marketLiquidity < 30
                            ? '유동성 낮음 (매각 어려움)'
                            : simulationResults.marketLiquidity < 60
                            ? '유동성 중간 (매각 가능)'
                            : '유동성 높음 (매각 용이)'}
                        </p>
                      </div>

                      <div className='bg-teal-2 border border-teal-6 rounded-lg p-4'>
                        <p className='text-gray-11 text-sm mb-1'>판매 수익 비교</p>
                        <p className='text-2xl font-bold text-teal-11'>
                          {formatAmount(selectedBond.marketValue - selectedBond.currentValue)}
                        </p>
                        <p className='text-xs text-gray-11 mt-1'>
                          즉시 매각 시 현재 가치 대비{' '}
                          {((selectedBond.marketValue / selectedBond.currentValue - 1) * 100).toFixed(1)}%
                          {selectedBond.marketValue > selectedBond.currentValue ? '이익' : '손실'}
                        </p>
                      </div>
                    </div>

                    <div className='mb-8'>
                      <h3 className='text-lg font-medium mb-4 text-gray-12'>채권 시장 트렌드</h3>
                      <div className='h-[350px]'>
                        <Line data={getMarketTrendChartData()} options={trendChartOptions} />
                      </div>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
                      <div className='bg-gray-2 border border-gray-6 rounded-lg p-4'>
                        <h3 className='text-base font-medium mb-3 text-gray-12 flex items-center'>
                          <InfoCircledIcon className='mr-2' /> 시장 인사이트
                        </h3>
                        <div className='space-y-2 text-sm text-gray-11'>
                          <p>
                            <span className='font-medium text-purple-11'>시장 상황:</span>
                            현재 채권 시장은{' '}
                            {marketCondition === 'favorable'
                              ? '우호적'
                              : marketCondition === 'stable'
                              ? '안정적'
                              : '불리한'}{' '}
                            상황입니다.
                          </p>
                          <p>
                            {marketCondition === 'favorable'
                              ? ' 투자자들의 리스크 선호도가 높아 채권 매각 가격이 상승 중입니다.'
                              : marketCondition === 'stable'
                              ? ' 안정적인 시장 상황에서 적정한 가격에 채권 매각이 가능합니다.'
                              : ' 투자자들의 위험 회피 성향이 강해 채권 매각 가격이 하락 중입니다.'}
                          </p>
                          <p>
                            <span className='font-medium text-purple-11'>매각 기회:</span>
                            {simulationResults.sellRecommendation
                              ? '현재 시장 상황에서는 채권 보유보다 즉시 매각하는 것이 더 유리할 수 있습니다.'
                              : '시뮬레이션 결과, 채권을 보유하며 회수 절차를 진행하는 것이 매각보다 더 높은 수익을 기대할 수 있습니다.'}
                          </p>
                          <p>
                            <span className='font-medium text-purple-11'>유동성 평가:</span>이 채권의 시장 유동성은{' '}
                            {simulationResults.marketLiquidity.toFixed(1)}%로,
                            {simulationResults.marketLiquidity < 30
                              ? ' 구매자를 찾기 어려운 상황입니다.'
                              : simulationResults.marketLiquidity < 60
                              ? ' 적정 가격에 매각 가능한 상황입니다.'
                              : ' 다수의 구매자가 있어 빠른 매각이 가능합니다.'}
                          </p>
                        </div>

                        <div className='bg-gray-2 border border-gray-6 rounded-lg p-4'>
                          <h3 className='text-base font-medium mb-3 text-gray-12 flex items-center'>
                            <InfoCircledIcon className='mr-2' /> 시장 영향 요인
                          </h3>
                          <div className='space-y-2 text-sm text-gray-11'>
                            <p>
                              <span className='font-medium text-purple-11'>법률적 요인:</span>
                              {selectedBond.hasCourtOrder
                                ? '집행권원이 확보되어 있어 채권의 시장 가치에 긍정적 영향을 미칩니다.'
                                : '집행권원이 없어 채권의 시장 가치가 할인되어 거래됩니다.'}
                            </p>
                            <p>
                              <span className='font-medium text-purple-11'>산업 동향:</span>
                              {selectedBond.industry} 산업은 현재
                              {marketCondition === 'favorable'
                                ? '호황을 누리고 있어 관련 채권의 가치가 상승하는 추세입니다.'
                                : marketCondition === 'stable'
                                ? '안정적인 상황으로 채권 가치가 유지되고 있습니다.'
                                : '어려움을 겪고 있어 관련 채권의 가치가 하락하는 추세입니다.'}
                            </p>
                            <p>
                              <span className='font-medium text-purple-11'>금리 영향:</span>
                              현재 {interestRate}%의 금리는 채권의 현재가치 평가에
                              {interestRate > 5 ? '부정적인' : '긍정적인'} 영향을 미치며, 금리가{' '}
                              {interestRate > 5 ? '하락' : '상승'}할 경우 채권 가치는{' '}
                              {interestRate > 5 ? '상승' : '하락'}할 수 있습니다.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'recommendations' && (
                  <div>
                    <div className='flex justify-between items-center mb-6'>
                      <h2 className='text-xl font-semibold text-gray-12'>투자 전략 추천</h2>
                      <div className='flex items-center gap-1 text-sm text-gray-11'>
                        <CalendarIcon className='w-4 h-4' />
                        마지막 업데이트: {formatDate(new Date())}
                      </div>
                    </div>

                    <div className='bg-blue-2 border border-blue-6 rounded-lg p-5 mb-8'>
                      <h3 className='text-lg font-medium mb-4 text-blue-12 flex items-center'>
                        <CheckCircledIcon className='mr-2 text-blue-11' /> 종합 투자 분석
                      </h3>

                      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <div>
                          <h4 className='font-medium mb-2 text-gray-12'>주요 결론</h4>
                          <div className='space-y-2 text-sm text-gray-11 mb-4'>
                            <p>
                              {simulationResults.sellRecommendation
                                ? '현재 시장 상황을 고려할 때, 이 채권은 즉시 매각하는 것이 추천됩니다.'
                                : '이 채권은 보유하며 회수 절차를 진행하는 것이 더 높은 수익을 기대할 수 있습니다.'}
                            </p>
                            <p>
                              설정한 회수 전략에 따라 {timeframe}개월 내 {recoveryRate}%의 회수율로
                              {formatAmount(simulationResults.expectedRecovery)}를 회수할 수 있을 것으로 예상됩니다.
                            </p>
                            <p>
                              예상 투자 수익률은 {simulationResults.roi}%로, 월 평균{' '}
                              {(simulationResults.roi / timeframe).toFixed(1)}%의 수익을 기대할 수 있습니다.
                            </p>
                          </div>
                        </div>

                        <div>
                          <h4 className='font-medium mb-2 text-gray-12'>권장 행동</h4>
                          <div className='space-y-3'>
                            <div className='flex items-start gap-2'>
                              <div className='bg-blue-5 text-blue-11 rounded-full p-1 mt-0.5'>
                                <PlusCircledIcon className='w-4 h-4' />
                              </div>
                              <div className='text-sm text-gray-11'>
                                {!simulationResults.sellRecommendation && (
                                  <>
                                    <p className='font-medium text-gray-12 mb-1'>
                                      {legalStrategy === 'aggressive'
                                        ? '적극적인 법적 절차 진행'
                                        : legalStrategy === 'balanced'
                                        ? '균형적인 회수 전략 실행'
                                        : '안정적인 회수 계획 수립'}
                                    </p>
                                    <p>
                                      {legalStrategy === 'aggressive'
                                        ? '신속한 강제집행 신청 및 재산 추적 조사를 통해 회수율을 높이세요.'
                                        : legalStrategy === 'balanced'
                                        ? '법적 절차와 협상을 병행하여 효율적인 회수를 진행하세요.'
                                        : '채무자와의 협상을 통한 분할 상환 계획을 수립하세요.'}
                                    </p>
                                  </>
                                )}
                                {simulationResults.sellRecommendation && (
                                  <>
                                    <p className='font-medium text-gray-12 mb-1'>채권 매각 진행</p>
                                    <p>
                                      현재 시장가 {formatAmount(selectedBond.marketValue)}에 채권을 매각하는 것이 회수
                                      절차를 진행하는 것보다 효율적입니다.
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className='flex items-start gap-2'>
                              <div className='bg-blue-5 text-blue-11 rounded-full p-1 mt-0.5'>
                                <PlusCircledIcon className='w-4 h-4' />
                              </div>
                              <div className='text-sm text-gray-11'>
                                <p className='font-medium text-gray-12 mb-1'>
                                  {!simulationResults.sellRecommendation && simulationResults.optimalSellTime > 0
                                    ? `${simulationResults.optimalSellTime}개월 후 재평가`
                                    : '추가 담보 확보'}
                                </p>
                                <p>
                                  {!simulationResults.sellRecommendation && simulationResults.optimalSellTime > 0
                                    ? `약 ${simulationResults.optimalSellTime}개월 후 채권 가치가 최고점에 도달할 것으로 예상됩니다. 이 시점에서 시장 상황을 재평가하여 매각 여부를 결정하세요.`
                                    : '가능하다면 추가 담보를 확보하여 채권의 회수 가능성을 높이세요.'}
                                </p>
                              </div>
                            </div>

                            <div className='flex items-start gap-2'>
                              <div className='bg-blue-5 text-blue-11 rounded-full p-1 mt-0.5'>
                                <PlusCircledIcon className='w-4 h-4' />
                              </div>
                              <div className='text-sm text-gray-11'>
                                <p className='font-medium text-gray-12 mb-1'>리스크 관리</p>
                                <p>
                                  {simulationResults.riskFactors.length > 0
                                    ? `주요 리스크 요인인 "${simulationResults.riskFactors[0].factor}"에 대한 대응 전략을 마련하세요.`
                                    : '채무자의 상황을 정기적으로 모니터링하여 지급 능력 변화에 대응하세요.'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </Box>
  );
};

export default BondSimulatorPage;
