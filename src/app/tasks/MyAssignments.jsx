'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import AssignmentsTable from '@/components/Assignment/AssignmentsTable';
import { Loader2 } from 'lucide-react';

const MyAssignments = ({ user, preview = false }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('assignment_assignees')
        .select(
          `
          assignment_id,
          assignments (
            id, 
            description, 
            created_at, 
            status,
            type,
            civil_litigation_status,
            asset_declaration_status,
            creditor_attachment_status,
            assignment_creditors!left (name),
            assignment_debtors!left (name),
            assignment_assignees!left (user_id, users(name)),
            assignment_timelines (description),
            bonds (
              id, principal, interest_1_rate, interest_1_start_date, interest_1_end_date,
              interest_2_rate, interest_2_start_date, interest_2_end_date, expenses
            ),
            enforcements (id, status, amount, type)
          )
        `
        )
        .eq('user_id', user.id);

      if (error) {
        console.error('담당 사건 조회 오류:', error);
        return;
      }

      const validAssignments = (data || []).map((item) => item.assignments).filter(Boolean);

      // 미리보기 모드일 경우 최대 4개만 표시
      setAssignments(preview ? validAssignments.slice(0, 4) : validAssignments);
    } catch (err) {
      console.error('담당 사건 조회 중 예상치 못한 오류 발생:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchAssignments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 size={24} className='animate-spin text-blue-9 mr-2' />
        <span className='text-gray-11'>담당 사건을 불러오는 중...</span>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className='p-6 bg-blue-2 border border-blue-6 rounded-lg text-blue-11 text-center'>
        담당하고 계신 사건이 없습니다.
      </div>
    );
  }

  return <AssignmentsTable assignments={assignments} />;
};

export default MyAssignments;
