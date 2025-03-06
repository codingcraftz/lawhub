// src/app/client/assignment/[id]/page.jsx

'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@radix-ui/react-icons';
import { useUser } from '@/hooks/useUser';
import Inquiry from './Inquiry';
import AssignmentTimelines from './AssignmentTiemlines';
import CreditorInfo from './CreditorInfo';
import DebtorInfo from './DebtorInfo';
import BondDetails from './BondDetails';
import CaseList from './CaseList';
import EnforcementList from './EnforcementList';
import AssignmentTasks from './AssignmentTasks';
import FileList from './FileList';
import ClientInfoModal from '../_components/ClientInfoModal';
import GroupInfoModal from '../_components/GroupInfoModal';
import AssignmentAssigneeForm from '../_components/dialogs/AssignmentAssigneeForm';
import AssignmentEditForm from '../_components/dialogs/AssignmentEditFrom';
import { Button } from '@radix-ui/themes';
import useRoleRedirect from '@/hooks/userRoleRedirect';

const AssignmentPage = () => {
  useRoleRedirect(['staff', 'admin', 'client'], [], '/');
  const { id: assignmentId } = useParams();
  const { user } = useUser();
  const [assignment, setAssignment] = useState(null);
  const [assignmentType, setAssignmentType] = useState(null);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [assigneeModalOpen, setAssigneeModalOpen] = useState(false);
  const router = useRouter();
  const isAdmin = user?.role === 'staff' || user?.role === 'admin';

  console.log('User:', user);
  console.log('Is Admin:', isAdmin);
  console.log('User Role:', user?.role);

  const fetchAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select(
          `
          id,
					type,
          description,
          created_at,
          status,
          assignment_assignees (
            user_id,
            users (
              id,
              name,
              position,
              employee_type
            )
          ),
          assignment_clients (
            id,
            client_id,
            type,
            client:users (
              id,
              name,
              phone_number
            )
          ),
          assignment_groups (
            id,
            group_id,
            type,
            group:groups (
              id,
              name
            )
          )
        `
        )
        .eq('id', assignmentId)
        .single();

      if (error || !data) {
        console.error('Error fetching assignment:', error);
        return;
      }

      if (data.assignment_clients?.length > 0) {
        setAssignmentType('client');
      } else if (data.assignment_groups?.length > 0) {
        setAssignmentType('group');
      }
      setAssignment(data);
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [assignmentId]);

  const handleDeleteAssignment = async () => {
    if (!window.confirm('정말로 이 의뢰를 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase.from('assignments').delete().eq('id', assignmentId);

      if (error) {
        throw new Error('의뢰 삭제 중 오류가 발생했습니다.');
      }
      alert('의뢰가 삭제되었습니다.');
      router.back();
    } catch (err) {
      console.error(err);
      alert('의뢰 삭제 실패');
    }
  };

  const handleCloseAssignment = async () => {
    if (!window.confirm('이 의뢰를 종결 처리하시겠습니까?')) return;

    try {
      const { error } = await supabase.from('assignments').update({ status: 'closed' }).eq('id', assignmentId);

      if (error) {
        throw new Error('종결 처리 중 오류가 발생했습니다.');
      }

      alert('의뢰 상태가 종결 처리되었습니다.');
      fetchAssignments();
    } catch (err) {
      console.error(err);
      alert('종결 처리 실패');
    }
  };

  const assignees = assignment?.assignment_assignees?.map((a) => a.users.name);

  return (
    <div className='p-4 mx-auto flex flex-col w-full text-gray-12 max-w-screen-2xl sm:px-2 md:px-4 lg:px-24'>
      <div className='flex justify-between mb-4 flex-wrap gap-4'>
        <div className='flex items-center gap-2 flex-wrap'>
          <ArrowLeftIcon className='w-8 h-8 cursor-pointer' onClick={() => router.back()} />
          <h1 className='text-lg md:text-2xl font-bold'>의뢰 상세 페이지</h1>
          {assignmentType === 'client' && isAdmin && (
            <>
              <Button onClick={() => setClientModalOpen(true)}>의뢰인 정보보기</Button>
              <ClientInfoModal
                open={clientModalOpen}
                onOpenChange={setClientModalOpen}
                clientId={assignment?.assignment_clients?.[0]?.client_id}
                type={assignment?.assignment_clients?.[0]?.type}
              />
            </>
          )}
          {assignmentType === 'group' && isAdmin && (
            <>
              <Button color='green' onClick={() => setGroupModalOpen(true)}>
                그룹 정보보기
              </Button>
              <GroupInfoModal
                open={groupModalOpen}
                onOpenChange={setGroupModalOpen}
                groupId={assignment?.assignment_groups?.[0]?.group_id}
                type={assignment?.assignment_groups?.[0]?.type}
              />
            </>
          )}
        </div>
        {isAdmin && assignment && (
          <div className='flex gap-2 flex-wrap'>
            {user?.employee_type === 'internal' && (
              <Button variant='soft' onClick={() => setAssigneeModalOpen(true)}>
                담당자 배정
              </Button>
            )}
            <Button variant='soft' onClick={() => setEditModalOpen(true)}>
              의뢰 수정
            </Button>
            {user?.employee_type === 'internal' && (
              <Button variant='soft' color='red' onClick={handleDeleteAssignment}>
                의뢰 삭제
              </Button>
            )}
            {assignment?.status === 'ongoing' && (
              <Button variant='soft' color='green' onClick={handleCloseAssignment}>
                의뢰 종결
              </Button>
            )}
          </div>
        )}
      </div>
      <div className='p-2 text-gray-11 bg-gray-2 rounded'>
        <p>{assignment?.description}</p>
      </div>
      <div className='p-2 text-gray-11 mb-6 bg-gray-2 rounded'>
        <p>{assignees?.length > 0 ? `담당자: ${assignees?.join(', ')}` : '담당자: 미배정'}</p>
      </div>
      <AssignmentTimelines
        assignmentId={assignmentId}
        user={user}
        assignmentType={assignmentType}
        isSosong={assignment?.type === '소송'}
      />
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
        <CreditorInfo assignmentId={assignmentId} user={user} assignmentType={assignment?.type} />
        <DebtorInfo assignmentId={assignmentId} user={user} assignmentType={assignment?.type} />
        {assignment?.type === '채권' && <BondDetails assignmentId={assignmentId} user={user} />}
        <CaseList assignmentId={assignmentId} user={user} />
        {assignment?.type === '채권' && <EnforcementList assignmentId={assignmentId} user={user} />}
        <FileList assignmentId={assignmentId} user={user} />
        <Inquiry assignmentId={assignmentId} user={user} />
        <AssignmentTasks
          assignmentId={assignmentId}
          user={user}
          assignmentAssignees={assignment?.assignment_assignees || []}
        />
      </div>
      {assignment && (
        <AssignmentEditForm
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          assignment={assignment}
          onAssignmentUpdated={fetchAssignments}
        />
      )}
      {assignment && (
        <AssignmentAssigneeForm
          open={assigneeModalOpen}
          onOpenChange={setAssigneeModalOpen}
          assignmentId={assignmentId}
          existingAssignees={assignment.assignment_assignees || []}
          onAssigneesUpdated={fetchAssignments}
        />
      )}
    </div>
  );
};

export default AssignmentPage;
