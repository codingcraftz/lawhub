'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import AssignmentsTable from '@/components/Assignment/AssignmentsTable';
import { useUser } from '@/hooks/useUser';

const FavoriteAssignmentsPage = () => {
  const { user } = useUser();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('assignment_favorites')
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
        console.error('Error fetching favorites:', error);
        return;
      }

      const validFavorites = (data || []).map((item) => item.assignments).filter(Boolean);
      setFavorites(validFavorites);
    } catch (err) {
      console.error('Unexpected error fetching favorites:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchFavorites();
  }, [user]);

  return <AssignmentsTable assignments={favorites} isAdmin={false} loading={loading} />;
};

export default FavoriteAssignmentsPage;
