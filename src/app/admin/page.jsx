"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Box, Text } from "@radix-ui/themes";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@radix-ui/react-tabs";

// 기존 탭
import StaffManagementTab from "./StaffManagementTab";
import ClientManagementTab from "./ClientManagementTab";

// 새로 추가할 탭
import InquiryManagementTab from "./InquiryManagementTab";
import RequestManagementTab from "./RequestManagementTab";
import useRoleRedirect from "@/hooks/userRoleRedirect";
import ChatbotManager from "./ChatbotManagement";

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 추가: 문의/의뢰 데이터 상태
  const [inquiries, setInquiries] = useState([]);
  const [requests, setRequests] = useState([]);

  useRoleRedirect(["admin"], [], "/");

  const fetchAllData = async () => {
    setIsLoading(true);

    // 1) users
    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select("*");
    if (usersError) {
      console.error("Error fetching users:", usersError);
    }

    // 2) assignments
    const { data: assignmentsData, error: assignmentsError } = await supabase
      .from("assignments")
      .select("*");
    if (assignmentsError) {
      console.error("Error fetching assignments:", assignmentsError);
    }

    // 3) inquiries
    const { data: inquiriesData, error: inquiriesError } = await supabase
      .from("inquiries")
      .select("*")
      .order("created_at", { ascending: false });
    if (inquiriesError) {
      console.error("Error fetching inquiries:", inquiriesError);
    }

    // 4) requests
    const { data: requestsData, error: requestsError } = await supabase
      .from("requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (requestsError) {
      console.error("Error fetching requests:", requestsError);
    }

    setUsers(usersData || []);
    setAssignments(assignmentsData || []);
    setInquiries(inquiriesData || []);
    setRequests(requestsData || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  if (isLoading) return <Text>로딩 중...</Text>;

  return (
    <Box className="flex w-full p-4 max-w-screen-lg mx-auto">
      <Tabs className="w-full" defaultValue="staffManagement">
        <TabsList className="flex mb-4 border-b border-gray-6">
          <TabsTrigger
            value="staffManagement"
            className="
              px-4 py-2 
              hover:bg-gray-3 
              text-sm 
              transition-colors 
              [data-state='active']:border-b-2 
              [data-state='active']:border-blue-9 
              [data-state='active']:text-blue-11 
              [data-state='active']:font-semibold
            "
          >
            직원 관리
          </TabsTrigger>
          <TabsTrigger
            value="clientManagement"
            className="
              px-4 py-2 
              hover:bg-gray-3 
              text-sm 
              transition-colors 
              [data-state='active']:border-b-2 
              [data-state='active']:border-blue-9 
              [data-state='active']:text-blue-11 
              [data-state='active']:font-semibold
            "
          >
            고객 관리
          </TabsTrigger>
          {/* 추가: 문의 / 의뢰 탭 */}
          <TabsTrigger
            value="inquiryManagement"
            className="
              px-4 py-2 
              hover:bg-gray-3 
              text-sm 
              transition-colors 
              [data-state='active']:border-b-2 
              [data-state='active']:border-blue-9 
              [data-state='active']:text-blue-11 
              [data-state='active']:font-semibold
            "
          >
            문의 내역
          </TabsTrigger>
          <TabsTrigger
            value="requestManagement"
            className="
              px-4 py-2 
              hover:bg-gray-3 
              text-sm 
              transition-colors 
              [data-state='active']:border-b-2 
              [data-state='active']:border-blue-9 
              [data-state='active']:text-blue-11 
              [data-state='active']:font-semibold
            "
          >
            의뢰 내역
          </TabsTrigger>
          <TabsTrigger
            value="chatbotManagement"
            className="
              px-4 py-2 
              hover:bg-gray-3 
              text-sm 
              transition-colors 
              [data-state='active']:border-b-2 
              [data-state='active']:border-blue-9 
              [data-state='active']:text-blue-11 
              [data-state='active']:font-semibold
            "
          >
            챗봇관리
          </TabsTrigger>
        </TabsList>

        <TabsContent value="staffManagement" className="animate-fadeIn w-full">
          <StaffManagementTab users={users} onRefresh={fetchAllData} />
        </TabsContent>

        <TabsContent value="clientManagement" className="animate-fadeIn w-full">
          <ClientManagementTab users={users} onRefresh={fetchAllData} />
        </TabsContent>

        {/* 추가: 문의 / 의뢰 탭 콘텐츠 */}
        <TabsContent
          value="inquiryManagement"
          className="animate-fadeIn w-full"
        >
          <InquiryManagementTab
            inquiries={inquiries}
            onRefresh={fetchAllData}
          />
        </TabsContent>

        <TabsContent
          value="requestManagement"
          className="animate-fadeIn w-full"
        >
          <RequestManagementTab requests={requests} onRefresh={fetchAllData} />
        </TabsContent>
        <TabsContent
          value="chatbotManagement"
          className="animate-fadeIn w-full"
        >
          <ChatbotManager />
        </TabsContent>
      </Tabs>
    </Box>
  );
}
