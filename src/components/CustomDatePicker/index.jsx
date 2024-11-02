// src/components/CustomDatePicker/index.jsx

"use client";

import React from "react";
import DatePicker from "react-datepicker";
import { ko } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";

const CustomDatePicker = ({
  selectedDate,
  onDateChange,
  title,
  openDate,
  showTimeSelect = false, // 기본값을 false로 설정
  timeIntervals = 30, // 기본 시간 간격 설정
  timeFormat = "HH:mm", // 기본 시간 형식 설정
  dateFormat = "yyyy-MM-dd", // 기본 날짜 형식 설정
}) => {
  const parsedOpenDate = openDate ? new Date(openDate) : new Date();

  return (
    <DatePicker
      selected={selectedDate}
      onChange={onDateChange}
      dateFormat={dateFormat}
      placeholderText={title}
      showYearDropdown
      showMonthDropdown
      showTimeSelect={showTimeSelect} // 시간 선택 옵션
      timeFormat={timeFormat}
      timeIntervals={timeIntervals}
      dropdownMode="select"
      openToDate={parsedOpenDate}
      locale={ko}
      customInput={
        <input
          style={{
            backgroundColor: "var(--gray-1)",
            width: "100%",
            padding: "0.5rem",
            border: "1px solid var(--gray-6)",
            borderRadius: "var(--radius-2)",
          }}
        />
      }
    />
  );
};

export default CustomDatePicker;
