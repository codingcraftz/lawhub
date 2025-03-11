import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Search } from 'lucide-react';
import { Button, TextField } from '@radix-ui/themes';
import { supabase } from '@/utils/supabase';

export default function TaskRequestModal({ isOpen, onClose, receiverId }) {
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  // 의뢰 검색
  useEffect(() => {
    const searchAssignments = async () => {
      if (!searchTerm.trim()) {
        setAssignments([]);
        return;
      }

      setLoading(true);

      try {
        // 채권자, 채무자 테이블에서 이름으로 검색
        const [creditorsResult, debtorsResult] = await Promise.all([
          supabase.from('assignment_creditors').select('assignment_id, name').ilike('name', `%${searchTerm}%`),
          supabase.from('assignment_debtors').select('assignment_id, name').ilike('name', `%${searchTerm}%`),
        ]);

        console.log('Creditors Result:', creditorsResult);
        console.log('Debtors Result:', debtorsResult);

        if (creditorsResult.error) {
          console.error('Error fetching creditors:', creditorsResult.error);
        }
        if (debtorsResult.error) {
          console.error('Error fetching debtors:', debtorsResult.error);
        }

        // 찾은 assignment_id들 모으기
        const assignmentIds = new Set([
          ...(creditorsResult.data || []).map((c) => c.assignment_id),
          ...(debtorsResult.data || []).map((d) => d.assignment_id),
        ]);

        console.log('Assignment IDs:', Array.from(assignmentIds));

        if (assignmentIds.size > 0) {
          // 그룹 정보 가져오기
          const { data: groupsData, error: groupsError } = await supabase
            .from('assignment_groups')
            .select(
              `
              assignment_id,
              groups (
                name
              )
            `
            )
            .in('assignment_id', Array.from(assignmentIds));

          if (groupsError) {
            console.error('Error fetching groups:', groupsError);
          }

          console.log('Groups Data:', groupsData);

          // 결과 데이터 구성
          const assignmentsData = Array.from(assignmentIds).map((id) => {
            const creditor = creditorsResult.data?.find((c) => c.assignment_id === id);
            const debtor = debtorsResult.data?.find((d) => d.assignment_id === id);
            const group = groupsData?.find((g) => g.assignment_id === id);

            const result = {
              id: id,
              creditorName: creditor?.name || '',
              debtorName: debtor?.name || '',
              groupName: group?.groups?.name || '',
            };

            console.log('Assignment Data:', result);
            return result;
          });

          setAssignments(assignmentsData);
        } else {
          setAssignments([]);
        }
      } catch (error) {
        console.error('Search error:', error);
      }

      setLoading(false);
    };

    searchAssignments();
  }, [searchTerm]);

  // 업무요청 생성
  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    const { error } = await supabase.from('assignment_tasks').insert({
      assignment_id: selectedAssignment?.id || null,
      title: title.trim(),
      content: content.trim(),
      status: 'pending',
      type: 'request',
      requester_id: supabase.auth.user()?.id,
      receiver_id: receiverId,
    });

    if (error) {
      console.error('Error creating task:', error);
      alert('업무요청 생성 중 오류가 발생했습니다.');
      return;
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className='bg-gray-2 rounded-lg w-full max-w-lg p-6 relative'
      >
        {/* 헤더 */}
        <div className='flex justify-between items-center mb-6'>
          <h2 className='text-lg font-semibold text-gray-12'>
            업무 요청 {step === 1 ? '- 의뢰 선택' : '- 요청 내용 작성'}
          </h2>
          <button onClick={onClose} className='text-gray-11 hover:text-gray-12'>
            <X size={20} />
          </button>
        </div>

        {/* 스텝 1: 의뢰 선택 */}
        {step === 1 && (
          <div className='space-y-4'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-11' size={16} />
              <input
                type='text'
                placeholder='의뢰인/채무자 이름으로 검색...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full pl-9 pr-4 py-2 bg-gray-3 border border-gray-6 rounded-lg text-gray-12 placeholder-gray-11'
              />
            </div>

            <div className='max-h-60 overflow-y-auto space-y-2'>
              {loading ? (
                <div className='text-center text-gray-11'>검색 중...</div>
              ) : assignments.length > 0 ? (
                assignments.map((assignment) => (
                  <button
                    key={assignment.id}
                    onClick={() => {
                      setSelectedAssignment(assignment);
                      setStep(2);
                    }}
                    className='w-full p-3 bg-gray-3 hover:bg-gray-4 rounded-lg text-left transition-colors'
                  >
                    <div className='font-medium text-gray-12'>{assignment.groupName}</div>
                    <div className='text-sm text-gray-11'>
                      의뢰인: {assignment.creditorName} / 채무자: {assignment.debtorName}
                    </div>
                  </button>
                ))
              ) : searchTerm ? (
                <div className='text-center text-gray-11'>검색 결과가 없습니다.</div>
              ) : null}
            </div>

            <div className='pt-4 border-t border-gray-6'>
              <Button onClick={() => setStep(2)} className='w-full' variant='soft'>
                의뢰 없이 진행하기
              </Button>
            </div>
          </div>
        )}

        {/* 스텝 2: 요청 내용 작성 */}
        {step === 2 && (
          <div className='space-y-4'>
            {selectedAssignment && (
              <div className='p-3 bg-gray-3 rounded-lg'>
                <div className='font-medium text-gray-12'>{selectedAssignment.groupName}</div>
                <div className='text-sm text-gray-11'>
                  의뢰인: {selectedAssignment.creditorName} / 채무자: {selectedAssignment.debtorName}
                </div>
              </div>
            )}

            <div>
              <label className='block text-sm font-medium text-gray-12 mb-1'>제목</label>
              <input
                type='text'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className='w-full px-4 py-2 bg-gray-3 border border-gray-6 rounded-lg text-gray-12 placeholder-gray-11'
                placeholder='업무 요청 제목을 입력하세요'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-12 mb-1'>요청 내용</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className='w-full h-32 px-4 py-2 bg-gray-3 border border-gray-6 rounded-lg text-gray-12 placeholder-gray-11 resize-none'
                placeholder='업무 요청 내용을 상세히 입력해주세요'
              />
            </div>

            <div className='flex gap-2 pt-4'>
              <Button onClick={() => setStep(1)} variant='soft' color='gray' className='flex-1'>
                이전
              </Button>
              <Button onClick={handleSubmit} variant='solid' className='flex-1'>
                요청하기
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
