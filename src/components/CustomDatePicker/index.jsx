"use client";

import React from "react";
import DatePicker from "react-datepicker";

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
