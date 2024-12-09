"use client";
import React from "react";

const CustomToolbar = (props) => {
  const { date, onNavigate } = props;
  const currentYear = date.getFullYear();
  const currentMonth = date.getMonth();

  // 연도 목록 (현재 연도 기준 ±5년)
  const years = [];
  for (let year = currentYear - 5; year <= currentYear + 5; year++) {
    years.push(year);
  }

  // 월 목록 (0~11 -> 1~12월)
  const months = Array.from({ length: 12 }, (_, i) => i);

  const handleYearChange = (e) => {
    const newYear = parseInt(e.target.value, 10);
    onNavigate("date", new Date(newYear, currentMonth, 1));
  };

  const handleMonthChange = (e) => {
    const newMonth = parseInt(e.target.value, 10);
    onNavigate("date", new Date(currentYear, newMonth, 1));
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "1rem",
        alignItems: "center",
      }}
    >
      <div>
        <button onClick={() => onNavigate("PREV")}>이전</button>
        <button onClick={() => onNavigate("TODAY")}>오늘</button>
        <button onClick={() => onNavigate("NEXT")}>다음</button>
      </div>
      <div>
        <select onChange={handleYearChange} value={currentYear}>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}년
            </option>
          ))}
        </select>
        <select onChange={handleMonthChange} value={currentMonth}>
          {months.map((month) => (
            <option key={month} value={month}>
              {month + 1}월
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default CustomToolbar;
