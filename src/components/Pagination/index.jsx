// components/Pagination.js

"use client";

import React from "react";
import { Flex, Button, Text } from "@radix-ui/themes";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const handlePrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  const handlePageClick = (page) => {
    if (page !== currentPage) onPageChange(page);
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5; // 표시할 최대 페이지 수
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = start + maxVisible - 1;

    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <Button
          key={i}
          variant={i === currentPage ? "solid" : "outline"}
          onClick={() => handlePageClick(i)}
          style={{ margin: "0 4px" }}
        >
          {i}
        </Button>,
      );
    }

    return pages;
  };

  return (
    <Flex align="center" justify="center" gap="2" mt="4">
      <Button
        variant="outline"
        onClick={handlePrev}
        disabled={currentPage === 1}
      >
        이전
      </Button>
      {renderPageNumbers()}
      <Button
        variant="outline"
        onClick={handleNext}
        disabled={currentPage === totalPages}
      >
        다음
      </Button>
    </Flex>
  );
};

export default Pagination;
