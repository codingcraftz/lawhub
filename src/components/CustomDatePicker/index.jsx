"use client";

import React from "react";
import DatePicker from "react-datepicker";
import { ko } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";

const CustomDatePicker = ({ selectedDate, onDateChange, title }) => {
  return (
    <DatePicker
      selected={selectedDate}
      onChange={onDateChange}
      dateFormat="yyyy-MM-dd"
      placeholderText={title}
      showYearDropdown
      showMonthDropdown
      dropdownMode="select"
      maxDate={new Date()}
      openToDate={new Date(1990, 0, 1)} // 1990년 1월 1일로 설정
      locale={ko} // 한국어 로케일 설정
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
