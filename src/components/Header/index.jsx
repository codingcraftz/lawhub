'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/hooks/useUser';
import { supabase } from '@/utils/supabase';
import { MoonIcon, SunIcon, HamburgerMenuIcon, Cross2Icon } from '@radix-ui/react-icons';
import { Flex, Button, Text, Box, Separator } from '@radix-ui/themes';
import { useTheme } from 'next-themes';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import NotificationDropdown from './NotificationDropdown';
import LoginDialog from './LoginDialog';
import { useRouter } from 'next/navigation';
import Hero from '../Hero';

const Header = () => {
  const { user, setUser } = useUser();
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setTheme('dark');
  }, []);

  const NAV_LIST = [
    {
      title: '의뢰 관리',
      path: `/clients`,
      roles: ['admin', 'staff'],
      employeeTypes: ['internal'],
    },
    {
      title: '업무 관리',
      path: `/tasks`,
      roles: ['admin', 'staff'],
      employeeTypes: [],
    },
    {
      title: '나의 의뢰',
      path: '/my-assignments',
      roles: ['client'],
      employeeTypes: [],
    },
    {
      title: '나의 채권 현황',
      path: '/my-bonds',
      roles: ['client', 'admin'],
      employeeTypes: [],
    },
    {
      title: '공지사항',
      path: '/news',
      roles: ['admin', 'staff', 'client'],
      employeeTypes: [],
    },
    {
      title: '채권현황(Beta)',
      path: '/test/my-bonds',
      roles: ['admin'],
      employeeTypes: [],
    },
    {
      title: '회수 사례(Beta)',
      path: '/test/case-studies',
      roles: ['admin'],
      employeeTypes: [],
    },
    {
      title: '법률 캘린더(Beta)',
      path: '/test/legal-calendar',
      roles: ['admin'],
      employeeTypes: [],
    },
    {
      title: '서류 요약(Beta)',
      path: '/test',
      roles: ['admin'],
      employeeTypes: [],
    },
  ];

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout failed:', error.message);
    } else {
      setUser(null);
    }
    router.push('/');
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <Box className='border-b border-b-gray-9 px-4 py-3 md:px-12 md:py-5 flex justify-between items-center w-full'>
      <Flex className='items-center gap-4'>
        <Link href='/'>
          <Text className='font-bold text-xl md:text-2xl'>LawHub</Text>
        </Link>
        <Flex className='hidden md:flex gap-4 items-center'>
          {NAV_LIST.filter(
            (nav) =>
              nav.roles.includes(user?.role) &&
              (nav.employeeTypes.length === 0 || nav.employeeTypes.includes(user?.employee_type))
          ).map((nav) => (
            <Link href={nav.path} key={nav.path}>
              <Button
                variant='ghost'
                color='gray'
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
              >
                {nav.title}
              </Button>
            </Link>
          ))}
          {user && (user.role === 'staff' || user.role === 'admin') && user.employee_type === 'internal' && (
            <Link href='/group'>
              <Button
                variant='ghost'
                color='red'
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
              >
                그룹 관리
              </Button>
            </Link>
          )}

          {user && user.role === 'admin' && user.employee_type === 'internal' && (
            <Link href='/admin'>
              <Button
                variant='ghost'
                color='red'
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
              >
                관리자
              </Button>
            </Link>
          )}
        </Flex>

        {/* Mobile Menu */}
        <DropdownMenu.Root open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenu.Trigger asChild>
            <Button className='md:hidden'>
              <HamburgerMenuIcon />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content
            className='bg-gray-3 p-4 rounded-lg shadow-md flex flex-col flex-start z-[9999]'
            sideOffset={5}
            style={{ minWidth: '200px' }}
          >
            {NAV_LIST.filter(
              (nav) =>
                nav.roles.includes(user?.role) &&
                (nav.employeeTypes.length === 0 || nav.employeeTypes.includes(user?.employee_type))
            ).map((nav) => (
              <DropdownMenu.Item key={nav.path}>
                <Link href={nav.path} onClick={() => setMenuOpen(false)}>
                  <Text size='2' style={{ display: 'block', padding: '0.5rem 0' }}>
                    {nav.title}
                  </Text>
                </Link>
              </DropdownMenu.Item>
            ))}
            <Separator className='my-2' />
            {user && (user.role === 'staff' || user.role === 'admin') && user.employee_type === 'internal' && (
              <DropdownMenu.Item>
                <Link href='/group' onClick={() => setMenuOpen(false)}>
                  <Text size='2' color='red' style={{ display: 'block', padding: '0.5rem 0' }}>
                    그룹 관리
                  </Text>
                </Link>
              </DropdownMenu.Item>
            )}
            {user && user.role === 'admin' && user.employee_type === 'internal' && (
              <DropdownMenu.Item>
                <Link href='/admin' onClick={() => setMenuOpen(false)}>
                  <Text size='2' color='red' style={{ display: 'block', padding: '0.5rem 0' }}>
                    관리자
                  </Text>
                </Link>
              </DropdownMenu.Item>
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </Flex>

      {/* Right Actions */}
      <Flex align='center' gap='4'>
        <Button className='focus:outline-none' variant='ghost' color='gray' onClick={toggleTheme}>
          {theme === 'light' ? <MoonIcon width={20} height={20} /> : <SunIcon width={20} height={20} />}
        </Button>
        {user && <NotificationDropdown user={user} />}
        {user ? (
          <Hero user={user} onLogout={handleLogout} />
        ) : (
          <>
            <LoginDialog open={false} onOpenChange={() => {}} />
            <Button
              variant='solid'
              color='blue'
              onClick={() => {
                const loginDialog = document.querySelector('[role="dialog"]');
                if (!loginDialog) {
                  const event = new CustomEvent('openLoginDialog');
                  window.dispatchEvent(event);
                }
              }}
            >
              로그인
            </Button>
          </>
        )}
      </Flex>
    </Box>
  );
};

export default Header;
