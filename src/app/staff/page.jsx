'use client';

import { Tabs } from '@radix-ui/themes';
import StaffAssignmentsPage from './StaffAssignmentsPage';
import FavoriteAssignmentsPage from './FavoriteAssignmentsPage';

export default function StaffPage() {
  return (
    <div className='w-full px-4 sm:px-6 md:px-12 py-4'>
      <Tabs.Root defaultValue='assigned' className='w-full'>
        <Tabs.List className='flex border-b'>
          <Tabs.Trigger
            value='assigned'
            className='px-4 py-2 border-b-2 data-[state=active]:border-blue-500 data-[state=active]:font-bold text-gray-500'
          >
            담당 사건
          </Tabs.Trigger>
          <Tabs.Trigger
            value='favorites'
            className='px-4 py-2 border-b-2 data-[state=active]:border-blue-500 data-[state=active]:font-bold text-gray-500'
          >
            즐겨찾기
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value='assigned'>
          <StaffAssignmentsPage />
        </Tabs.Content>
        <Tabs.Content value='favorites'>
          <FavoriteAssignmentsPage />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
