"use client";

import React, { useEffect, useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "moment/locale/ko"; // 한글 로케일
import "react-big-calendar/lib/css/react-big-calendar.css";
import { supabase } from "@/utils/supabase";
import { useUser } from "@/hooks/useUser";
import DeadlineDetailCard from "./DeadlineDetailCard";
import DeadlineSidebar from "./DeadlineSidebar";
import CustomToolbar from "./CustomToolbar";

moment.locale("ko"); // 로케일 적용
const localizer = momentLocalizer(moment);

const DeadlineCalendar = () => {
  const { user } = useUser();
  const [events, setEvents] = useState([]);

  // 모달 및 사이드바 상태
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedDateEvents, setSelectedDateEvents] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 이미 어떤 패널이 열려있을 때 사용자가 달력 클릭 시 우선 닫고 다시 시도해야 열리도록 하는 로직
  const [lastClickType, setLastClickType] = useState(null);

  // Supabase에서 기일 데이터 가져오기
  const fetchDeadlines = async () => {
    try {
      const { data, error } = await supabase.rpc("get_case_deadlines", {
        user_id: user.id,
        user_role: user.role,
      });

      if (error) {
        console.error("기일 데이터를 가져오는 중 오류:", error);
        return;
      }

      const formattedEvents = data.map((deadline) => ({
        id: deadline.deadline_id,
        title: `${deadline.client_name} ${deadline.deadline_type}`,
        type: deadline.deadline_type,
        start: new Date(deadline.deadline_date),
        end: new Date(deadline.deadline_date),
        caseId: deadline.case_id,
        location: deadline.location,
        clientName: deadline.client_name,
        caseTitle: deadline.case_title,
        caseDescription: deadline.case_description,
      }));

      setEvents(formattedEvents);
    } catch (error) {
      console.error("기일 데이터를 가져오는 중 오류:", error);
    }
  };

  useEffect(() => {
    if (user) fetchDeadlines();
  }, [user]);

  const closeAll = () => {
    setIsModalOpen(false);
    setIsSidebarOpen(false);
    setSelectedEvent(null);
    setSelectedDateEvents([]);
  };

  const handleSelectEvent = (event) => {
    if (isModalOpen || isSidebarOpen) {
      closeAll();
      setLastClickType("event");
    } else {
      setSelectedEvent(event);
      setIsModalOpen(true);
      setLastClickType(null);
    }
  };

  const handleSelectDate = (date) => {
    // 이미 모달 또는 사이드바가 열려있다면 우선 닫는다.
    if (isModalOpen || isSidebarOpen) {
      closeAll();
      setLastClickType("date");
    } else {
      // 닫힌 상태라면 사이드바 열기
      const dateEvents = events.filter(
        (event) => event.start.toDateString() === date.toDateString(),
      );
      setSelectedDateEvents(dateEvents);
      setIsSidebarOpen(true);
      setLastClickType(null);
    }
  };

  return (
    <div
      style={{
        height: "80vh",
        maxWidth: "1200px",
        position: "relative",
      }}
    >
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        selectable
        onSelectEvent={handleSelectEvent}
        onSelectSlot={(slotInfo) => handleSelectDate(slotInfo.start)}
        style={{
          height: "100%",
        }}
        views={["month"]}
        defaultView="month"
        messages={{
          next: "다음",
          previous: "이전",
          today: "오늘",
          month: "월",
          noEventsInRange: "이 기간에 기일이 없습니다.",
          showMore: (count) => `+${count} more`,
        }}
        components={{
          toolbar: CustomToolbar,
        }}
      />

      {/* 상세 카드 모달 */}
      {isModalOpen && selectedEvent && (
        <DeadlineDetailCard
          event={selectedEvent}
          onClose={() => setIsModalOpen(false)}
          onUpdate={() => {
            fetchDeadlines();
            setIsModalOpen(false);
          }}
        />
      )}

      {/* Sidebar */}
      {isSidebarOpen && (
        <DeadlineSidebar
          events={selectedDateEvents}
          onClose={() => setIsSidebarOpen(false)}
          onEventSelect={(event) => {
            // sidebar에서 이벤트 선택시 detailCard 오픈
            setIsSidebarOpen(false);
            setSelectedEvent(event);
            setIsModalOpen(true);
          }}
          onDeadlineAdded={() => {
            fetchDeadlines();
          }}
        />
      )}
    </div>
  );
};

export default DeadlineCalendar;
