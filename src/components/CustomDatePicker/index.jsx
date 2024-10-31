"use client";

import React from "react";
import DatePicker from "react-datepicker";
import { ko } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";

const CustomDatePicker = ({ selectedDate, onDateChange, title, openDate }) => {
  const parsedOpenDate = openDate ? new Date(openDate) : new Date();

  return (
    <DatePicker
      selected={selectedDate}
      onChange={onDateChange}
      dateFormat="yyyy-MM-dd"
      placeholderText={title}
      showYearDropdown
      showMonthDropdown
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
