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
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "1rem",
      }}
    >
      <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
        <select
          className="text-lg border border-gray-400 rounded-lg"
          onChange={handleYearChange}
          value={currentYear}
          style={{
            marginRight: "8px",
            padding: "4px 8px",
            background: "var(--gray-2)",
          }}
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}년
            </option>
          ))}
        </select>
        <select
          className="text-lg border border-gray-400 rounded-lg"
          onChange={handleMonthChange}
          value={currentMonth}
          style={{ padding: "4px 8px", background: "var(--gray-2)" }}
        >
          {months.map((month) => (
            <option key={month} value={month}>
              {month + 1}월
            </option>
          ))}
        </select>
      </div>
      <div className="flex w-full justify-end gap-1">
        <button
          className="hover:opacity-30 border border-gray-400 rounded-md"
          onClick={() => onNavigate("PREV")}
          style={{ padding: "4px 8px" }}
        >
          이전
        </button>
        <button
          className="hover:opacity-30 border border-gray-400 rounded-md"
          onClick={() => onNavigate("TODAY")}
          style={{ padding: "4px 8px" }}
        >
          오늘
        </button>
        <button
          className="hover:opacity-30 border border-gray-400 rounded-md"
          onClick={() => onNavigate("NEXT")}
          style={{ padding: "4px 8px" }}
        >
          다음
        </button>
      </div>
    </div>
  );
};

export default CustomToolbar;
