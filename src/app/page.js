'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Box } from '@radix-ui/themes'; // Radix UI 컨테이너
import { motion, animate } from 'framer-motion';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { FileIcon, ChatBubbleIcon } from '@radix-ui/react-icons';
import LoginDialog from '@/components/Header/LoginDialog';

/** 0 ~ to까지 부드럽게 증가하는 숫자 카운터 */
function Counter({ from = 0, to = 0, duration = 4 }) {
  const [count, setCount] = useState(from);

  useEffect(() => {
    const controls = animate(from, to, {
      duration,
      onUpdate(value) {
        setCount(Math.floor(value));
      },
    });
    return () => controls.stop();
  }, [from, to, duration]);

  return <>{count}</>;
}

const HomePage = () => {
  const { user } = useUser();
  const router = useRouter();
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  // 로그인 체크
  const handleActionClick = (path) => {
    if (!user) {
      setShowLoginDialog(true);
      return;
    }
    router.push(path);
  };

  // 통계 데이터
  const stats = [
    { label: '민사 (소송)', value: 106 },
    { label: '민사 (지급명령)', value: 64 },
    { label: '민사 집행', value: 221 },
  ];

  return (
    <Box
      className='
        w-screen
        min-h-screen
        flex
        flex-col
        items-center
        justify-center
        overflow-hidden
        bg-gray-2
      '
    >
      {/* Hero 섹션 */}
      <section className='min-h-screen flex flex-col justify-center'>
        {/* 로고 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className='w-full text-center mb-8'
        >
          <h1
            className='
              text-6xl
              font-extrabold
              tracking-wide
              bg-gradient-to-r
              from-blue-10
              via-violet-10
              to-blue-10
              text-transparent
              bg-clip-text
            '
          >
            LawHub
          </h1>
        </motion.div>

        {/* 소개 텍스트 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className='flex flex-col items-center justify-center text-center mt-4 px-4'
        >
          <h2
            className='
              text-3xl
              md:text-4xl
              font-bold
              text-slate-12
              mb-4
            '
          >
            민사·채권 전문 법률 서비스
          </h2>
          <p
            className='
              text-slate-11
              text-base
              md:text-lg
              max-w-2xl
              leading-relaxed
              mb-12
            '
          >
            복잡한 민사 소송, 지급명령, 강제집행 문제도
            <br className='hidden sm:block' />
            이제 혼자가 아닙니다.
            <br className='hidden sm:block' />
            <span className='text-slate-12 font-medium mt-4 inline-block'>
              LawHub과 함께 빠르고 안전하게 해결하세요.
            </span>
          </p>

          {/* 액션 버튼들 */}
          <motion.div
            className='flex flex-col sm:flex-row gap-4 w-full max-w-md'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleActionClick('/chat')}
              className='
                w-full
                rounded-lg
                bg-blue-9
                text-white
                font-semibold
                py-3
                flex
                items-center
                justify-center
                gap-2
                shadow-md
                hover:bg-blue-10
                hover:shadow-lg
                transition-all
              '
            >
              <FileIcon width='20' height='20' />
              상담 바로 시작
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleActionClick('/my-assignments')}
              className='
                w-full
                rounded-lg
                bg-violet-9
                text-white
                font-semibold
                py-3
                flex
                items-center
                justify-center
                gap-2
                shadow-md
                hover:bg-violet-10
                hover:shadow-lg
                transition-all
              '
            >
              <ChatBubbleIcon width='20' height='20' />
              나의 의뢰
            </motion.button>
          </motion.div>

          {/* 24시간 안내 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className='
              mt-16
              flex
              flex-col
              items-center
              gap-2
            '
          ></motion.div>
          {/* 24시간 상담 가능 & 법률 전문가 네트워크 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
            className='
    flex flex-col sm:flex-row items-center justify-center 
    gap-6 mt-4 px-6 py-4 
    bg-white/10 backdrop-blur-md border border-white/20 
    rounded-lg shadow-lg w-full max-w-3xl text-center
  '
          >
            {/* 24시간 상담 가능 */}
            <div className='flex items-center gap-3'>
              <div className='w-12 h-12 flex items-center justify-center rounded-full bg-blue-10 text-xl font-bold'>
                <Counter to={24} duration={2} />
              </div>
              <div className='text-white'>
                <p className='text-lg font-semibold'>365일 24시간</p>
                <p className='text-sm opacity-80'>상담 가능합니다</p>
              </div>
            </div>

            {/* 구분선 */}
            <div className='w-px h-10 bg-white/30 hidden sm:block'></div>

            {/* 10년 이상 법률 전문가 */}
            <div className='flex items-center gap-3'>
              <div className='w-12 h-12 flex items-center justify-center rounded-full bg-amber-10 text-white text-xl font-bold'>
                <Counter to={10} duration={2} />+
              </div>
              <div className='text-white'>
                <p className='text-lg font-semibold'>10년 이상 경력</p>
                <p className='text-sm opacity-80'>법률 전문가 네트워크</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* 계약 이미지 + 통계 섹션 */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
        viewport={{ once: true }}
        className='relative w-full min-h-[70vh] mb-48'
      >
        <Image src='/contract.jpg' alt='Contract Background' fill className='object-cover' priority />
        {/* 검정 오버레이 */}
        <div className='absolute inset-0 bg-black bg-opacity-50' />

        {/* 반투명(Glass) 배경 박스 */}
        <div
          className='
            relative
            z-10
            h-full
            w-full
            flex
            flex-col
            items-center
            justify-center
            px-4
            py-6
          '
        >
          {/* 글래스모피즘 컨테이너 */}
          <div
            className='
              bg-white
              bg-opacity-10
              backdrop-blur-sm
              rounded-xl
              max-w-4xl
              mx-auto
              w-full
              p-6
              flex
              flex-col
              items-center
              shadow-xl
              border
              border-white/20
            '
          >
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className='
                text-2xl
                md:text-3xl
                font-bold
                mb-2
                text-center
              '
            >
              현재 진행 중인 사건
            </motion.h3>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              viewport={{ once: true }}
              className='
                text-lg
                italic
                opacity-90
                mb-4
                text-center
                px-2
              '
            >
              &ldquo;지금도 수많은 의뢰인들이 <span className='text-amber-10 font-semibold'>LawHub</span>와 함께하고
              있습니다.&rdquo;
            </motion.div>

            {/* 구분선 */}
            <hr className='border-slate-7 opacity-50 w-full mb-6' />

            {/* 기준 날짜 */}
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.2 }}
              viewport={{ once: true }}
              className='text-xs text-slate-12 opacity-80 mb-6'
            >
              2025년 3월 6일 기준 (진행 중인 사건)
            </motion.p>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-6 w-full'>
              {stats.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.05 }}
                  className='
                    flex
                    flex-col
                    items-center
                    justify-center
                    p-4
                    bg-white
                    bg-opacity-0
                    rounded-lg
                    transition-transform
                    cursor-default
                  '
                >
                  <p className='text-4xl font-extrabold text-amber-10'>
                    <Counter to={item.value} duration={2} />
                    <span className='text-base ml-1'>건</span>
                  </p>
                  <p className='mt-2 text-sm md:text-base text-white'>{item.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* 로그인 다이얼로그 */}
      {showLoginDialog && <LoginDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} />}
    </Box>
  );
};

export default HomePage;
