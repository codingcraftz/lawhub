'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';
import { Box, Flex, Text, Button, Switch } from '@radix-ui/themes';
import { useUser } from '@/hooks/useUser';
import Pagination from '@/components/Pagination';
import AssignmentForm from '@/components/AssignmentForm';
import useRoleRedirect from '@/hooks/userRoleRedirect';

const PAGE_SIZE = 12;

const ClientManagementPage = () => {
  useRoleRedirect(['staff', 'admin'], ['internal'], '/');

  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false);
  const [showOngoingOnly, setShowOngoingOnly] = useState(true);

  const router = useRouter();
  const { user } = useUser();

  const fetchClientsAndGroups = async () => {
    try {
      const { data: allClients, error: clientsError } = await supabase.from('users').select('id, name, role');

      if (clientsError) throw clientsError;

      const { data: allGroups, error: groupsError } = await supabase.from('groups').select('id, name');

      if (groupsError) throw groupsError;

      const { data: clientAssignments, error: clientAssignmentsError } = await supabase
        .from('assignment_clients')
        .select('client_id, assignments(status)');

      if (clientAssignmentsError) throw clientAssignmentsError;

      const { data: groupAssignments, error: groupAssignmentsError } = await supabase
        .from('assignment_groups')
        .select('group_id, assignments(status)');

      if (groupAssignmentsError) throw groupAssignmentsError;

      const clientCaseCounts = clientAssignments.reduce((acc, item) => {
        const assignmentStatus = item.assignments?.status;
        if (assignmentStatus === 'ongoing') {
          acc[item.client_id] = (acc[item.client_id] || 0) + 1;
        }
        return acc;
      }, {});

      const groupCaseCounts = groupAssignments.reduce((acc, item) => {
        const assignmentStatus = item.assignments?.status;
        if (assignmentStatus === 'ongoing') {
          acc[item.group_id] = (acc[item.group_id] || 0) + 1;
        }
        return acc;
      }, {});

      const clientsWithCounts = allClients.map((c) => ({
        id: c.id,
        name: c.name,
        type: 'client',
        ongoing_case_count: clientCaseCounts[c.id] || 0,
      }));

      const groupsWithCounts = allGroups.map((g) => ({
        id: g.id,
        name: g.name,
        type: 'group',
        ongoing_case_count: groupCaseCounts[g.id] || 0,
      }));

      const combinedData = [...clientsWithCounts, ...groupsWithCounts];
      setClients(combinedData);
    } catch (error) {
      console.error('Error fetching clients and groups:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchClientsAndGroups();
    }
  }, [user]);

  useEffect(() => {
    const ongoingFiltered = showOngoingOnly ? clients.filter((item) => item.ongoing_case_count > 0) : clients;

    const searchFiltered = ongoingFiltered.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;

    setFilteredClients(searchFiltered.slice(startIndex, endIndex));
    setTotalPages(Math.ceil(searchFiltered.length / PAGE_SIZE));
  }, [clients, currentPage, showOngoingOnly, searchQuery]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleCaseSuccess = () => {
    setIsNewCaseModalOpen(false);
    fetchClientsAndGroups();
  };

  return (
    <Box className='py-4 w-full px-4 sm:px-2 md:px-4 lg:px-24 max-w-screen-2xl'>
      <Flex direction='column' gap='4'>
        {/* Header */}
        <Flex className='flex-col md:flex-row justify-between items-start md:items-center gap-4'>
          <Text className='text-2xl font-bold'>의뢰인 목록</Text>
          <Button color='green' onClick={() => setIsNewCaseModalOpen(true)}>
            새 의뢰 등록
          </Button>
        </Flex>

        {/* Search + Toggle */}
        <Flex className='flex-col md:flex-row gap-4 items-start md:items-center justify-between'>
          <input
            className='rounded-lg w-full md:w-auto'
            type='text'
            placeholder='이름으로 검색'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid var(--gray-6)',
            }}
          />
          <Flex align='center' gap='2'>
            <Text size='3'>진행 중 사건만 보기</Text>
            <Switch
              checked={showOngoingOnly}
              onCheckedChange={(checked) => {
                setShowOngoingOnly(checked);
                setCurrentPage(1);
              }}
            />
          </Flex>
        </Flex>

        {/* List */}
        <Flex className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {filteredClients.map((item) => (
            <div
              key={item.id}
              className='
                cursor-pointer p-4 shadow-sm 
                flex flex-col border border-gray-6 rounded
              '
              onClick={() => router.push(item.type === 'client' ? `/client/${item.id}` : `/group/${item.id}`)}
            >
              <Flex gap='2'>
                <Text size='2' color={item.type === 'client' ? 'blue' : 'green'}>
                  {item.type === 'client' ? '[개인]' : '[단체]'}
                </Text>
                <Text className='mr-3' size='4' weight='bold'>
                  {item.name}
                </Text>
              </Flex>
              <Text size='3' color='gray'>
                진행 중 사건: {item.ongoing_case_count}건
              </Text>
            </div>
          ))}
        </Flex>

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
        )}
      </Flex>

      <AssignmentForm open={isNewCaseModalOpen} onOpenChange={setIsNewCaseModalOpen} onSuccess={handleCaseSuccess} />
    </Box>
  );
};

export default ClientManagementPage;
