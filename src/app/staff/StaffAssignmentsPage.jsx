'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { useUser } from '@/hooks/useUser';
import AssignmentsTable from '@/components/Assignment/AssignmentsTable';

const StaffAssignmentsPage = () => {
  const { user } = useUser();
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
            id, description, created_at, status,
            assignment_creditors!left (name),
            assignment_debtors!left (name),
            assignment_assignees!left (user_id, users(name))
          )
        `
        )
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching assignments:', error);
        return;
      }

      const validAssignments = (data || []).map((item) => item.assignments).filter(Boolean);
      setAssignments(validAssignments);
    } catch (err) {
      console.error('Unexpected error fetching assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchAssignments();
  }, [user]);

  return <AssignmentsTable assignments={assignments} isAdmin={false} loading={loading} />;
};

export default StaffAssignmentsPage;
