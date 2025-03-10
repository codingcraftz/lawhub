// src/components/TimelineModal.jsx
'use client';
import React from 'react';
import Modal from './Modal';

// 예시: utils에 있는 헬퍼 함수
import { getCurrentDateFormatted } from './utils';

export default function TimelineModal({
  isOpen,
  onClose,
  mode, // 'edit' or 'add'
  timelineInput,
  setTimelineInput,
  onSubmitTimeline,
}) {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`진행 상황 ${mode === 'edit' ? '수정' : '등록'}`}>
      <div className='space-y-4'>
        <div>
          <label className='block text-sm font-medium'>내용</label>
          <textarea
            className='mt-1 w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:text-white'
            rows='4'
            value={timelineInput}
            onChange={(e) => setTimelineInput(e.target.value)}
          />
        </div>
        {/* 프리셋 버튼들 */}
        <div className='flex flex-col gap-2 mb-2'>
          <div className='flex gap-2'>
            <button
              type='button'
              className='bg-blue-500 text-white px-2 py-1 rounded text-sm'
              onClick={() => {
                const text = `변제 카톡 발송 - ${getCurrentDateFormatted()}`;
                setTimelineInput(text);
              }}
            >
              변제 카톡 발송
            </button>
            <button
              type='button'
              className='bg-blue-500 text-white px-2 py-1 rounded text-sm'
              onClick={() => {
                const text = `변제 문자 발송 - ${getCurrentDateFormatted()}`;
                setTimelineInput(text);
              }}
            >
              변제 문자 발송
            </button>
            <button
              type='button'
              className='bg-blue-500 text-white px-2 py-1 rounded text-sm'
              onClick={() => {
                const text = `변제 카톡 발송(이름 상이) - ${getCurrentDateFormatted()}`;
                setTimelineInput(text);
              }}
            >
              변제 카톡 발송(이름 상이)
            </button>
          </div>
          <div className='flex gap-2'>
            <button
              type='button'
              className='bg-blue-500 text-white px-2 py-1 rounded text-sm'
              onClick={() => {
                const text = `연락 불가(카톡 이름 상이) - ${getCurrentDateFormatted()}`;
                setTimelineInput(text);
              }}
            >
              연락 불가(카톡 이름 상이)
            </button>
            <button
              type='button'
              className='bg-blue-500 text-white px-2 py-1 rounded text-sm'
              onClick={() => {
                const text = `연락 불가(번호 없음) - ${getCurrentDateFormatted()}`;
                setTimelineInput(text);
              }}
            >
              연락 불가(번호 없음)
            </button>
          </div>
        </div>
        <div className='flex justify-end space-x-2'>
          <button className='bg-green-600 text-white px-4 py-2 rounded' onClick={onSubmitTimeline}>
            {mode === 'edit' ? '수정' : '등록'}
          </button>
          <button className='bg-gray-600 text-white px-4 py-2 rounded' onClick={onClose}>
            취소
          </button>
        </div>
      </div>
    </Modal>
  );
}
