"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons";
import { Flex } from "@radix-ui/themes";

const Footer = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <footer className="p-4" style={{ background: "var(--gray-2)" }}>
      <div className="container mx-auto text-center">
        <div className="mb-4">
          <Link
            href="/term-of-service"
            className="mr-4 text-sm"
            style={{ color: "var(--gray-10)" }}
          >
            이용약관
          </Link>
          <Link
            href="/privacy-policy"
            className="mr-4 text-sm"
            style={{ color: "var(--gray-10)" }}
          >
            개인정보처리방침
          </Link>
          <Link
            href="/news"
            className="mr-4 text-sm"
            style={{ color: "var(--gray-10)" }}
          >
            고객센터
          </Link>
          <button onClick={() => setIsOpen(!isOpen)}>
            <Flex
              align="center"
              className="text-sm"
              style={{ color: "var(--gray-10)" }}
            >
              사업자 정보
              {isOpen ? (
                <ChevronUpIcon width="1rem" height="1rem" />
              ) : (
                <ChevronDownIcon width="1rem" height="1rem" />
              )}
            </Flex>
          </button>
        </div>

        {isOpen && (
          <div
            className="rounded-lg p-4 text-left mx-auto w-full max-w-lg"
            style={{ backgroundColor: "var(--gray-6)" }}
          >
            <p>대표이사: 황현기</p>
            <p>전화: 010 - 8315 - 9644 (대표전화)</p>
            <p>사업자등록번호: 855-96-01265</p>
            <p>
              주소: 서울 특별시 강서구 양천로65길 41-22, 220호(염창동, JK블라썸)
            </p>
            <p>이메일: Lawyeroffice29@naver.com</p>
          </div>
        )}
      </div>
    </footer>
  );
};

export default Footer;
