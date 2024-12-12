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
  showTimeSelect = false,
  timeIntervals = 30,
  timeFormat = "HH:mm",
  dateFormat = "yyyy-MM-dd",
  disabled,
}) => {
  const parsedOpenDate = openDate ? new Date(openDate) : new Date();

  return (
    <div style={{ width: "100%" }}>
      {disabled ? (
        <input
          placeholder={title}
          disabled
          style={{
            backgroundColor: "var(--gray-1)",
            width: "100%",
            padding: "0.5rem",
            border: "1px solid var(--gray-6)",
            borderRadius: "var(--radius-2)",
          }}
        />
      ) : (
        <DatePicker
          selected={selectedDate}
          onChange={onDateChange}
          dateFormat={dateFormat}
          placeholderText={title}
          showYearDropdown
          showMonthDropdown
          showTimeSelect={showTimeSelect}
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
      )}
    </div>
  );
};

export default CustomDatePicker;
