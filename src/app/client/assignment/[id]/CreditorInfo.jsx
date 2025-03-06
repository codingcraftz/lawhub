"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { Button, Flex, Text, Box } from "@radix-ui/themes";
import { motion } from "framer-motion";
import CreditorForm from "../_components/dialogs/CreditorForm";

const CreditorInfo = ({ assignmentId, user, assignmentType }) => {
  const [creditors, setCreditors] = useState([]);
  const [isExpanded, setIsExpanded] = useState({}); // 상세보기 열림 여부를 creditorId별로 저장
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentCreditor, setCurrentCreditor] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSosong = assignmentType === "소송";

  const isAdmin = user?.role === "staff" || user?.role === "admin";

  // ================== 1) 채권자 목록 조회 ==================
  const fetchCreditors = async () => {
    const { data, error } = await supabase
      .from("assignment_creditors")
      .select(
        `
        id,
        name,
        phone_number,
        address,
        registration_number,
        workplace_name,
        workplace_address
      `,
      )
      .eq("assignment_id", assignmentId);

    if (error) {
      console.error("Failed to fetch creditors:", error);
      return;
    }
    setCreditors(data || []);
  };

  useEffect(() => {
    fetchCreditors();
  }, [assignmentId]);

  // ================== 2) 채권자 등록/수정 ==================
  const handleSaveCreditor = async (creditorData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      let response;
      if (currentCreditor) {
        // 수정
        response = await supabase
          .from("assignment_creditors")
          .update(creditorData)
          .eq("id", currentCreditor.id);
      } else {
        // 신규 등록
        response = await supabase.from("assignment_creditors").insert({
          ...creditorData,
          assignment_id: assignmentId,
        });
      }

      if (response.error) {
        throw response.error;
      }
      // 성공 시
      setIsFormOpen(false);
      setCurrentCreditor(null);
      fetchCreditors();
    } catch (error) {
      console.error("채권자 등록/수정 오류 발생:", error);
      alert("채권자 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ================== 3) 채권자 삭제 ==================
  const handleDeleteCreditor = async (creditorId) => {
    const { error } = await supabase
      .from("assignment_creditors")
      .delete()
      .eq("id", creditorId);

    if (error) {
      console.error("Failed to delete creditor:", error);
      alert("채권자 삭제 중 오류가 발생했습니다.");
    } else {
      fetchCreditors();
    }
  };

  // ================== 4) 상세보기 토글 ==================
  const toggleExpand = (creditorId) => {
    setIsExpanded((prev) => ({
      ...prev,
      [creditorId]: !prev[creditorId],
    }));
  };

  return (
    <section className="mb-6 p-4 rounded shadow-md shadow-gray-7 bg-gray-2 text-gray-12">
      <Flex justify="between" align="center" className="mb-3">
        <Text as="h2" className="font-semibold text-lg">
          {isSosong ? "원고 정보" : "채권자 정보"}
        </Text>
        {isAdmin && (
          <Button
            onClick={() => {
              setCurrentCreditor(null);
              setIsFormOpen(true);
            }}
          >
            등록
          </Button>
        )}
      </Flex>

      {creditors.length === 0 ? (
        <Text>
          {isSosong ? "등록된 원고가 없습니다." : "등록된 채권자가 없습니다."}
        </Text>
      ) : (
        creditors.map((creditor) => (
          <Box
            key={creditor.id}
            className="mb-4 p-3 bg-gray-3 border border-gray-6 rounded"
          >
            <Flex justify="between" align="center">
              <Text as="p" className="font-semibold mr-auto">
                이름: {creditor.name}
              </Text>
              <Flex gap="2" className="items-center">
                {isAdmin && (
                  <Flex className="items-center gap-2">
                    <Button
                      variant="soft"
                      size="2"
                      onClick={() => {
                        setCurrentCreditor(creditor);
                        setIsFormOpen(true);
                      }}
                    >
                      수정
                    </Button>
                    <Button
                      variant="soft"
                      color="red"
                      size="2"
                      onClick={() => handleDeleteCreditor(creditor.id)}
                    >
                      삭제
                    </Button>
                  </Flex>
                )}
                <Button
                  variant="ghost"
                  onClick={() => toggleExpand(creditor.id)}
                >
                  {isExpanded[creditor.id] ? "닫기" : "상세보기"}
                </Button>
              </Flex>
            </Flex>

            {/* 상세보기: 인적사항 (신용정보 없음) */}
            {isExpanded[creditor.id] && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden mt-3"
              >
                <Box className="p-3 border border-gray-6 rounded">
                  <Text weight="bold" size="2" mb="2">
                    인적사항
                  </Text>
                  <div className="space-y-1">
                    {creditor.registration_number && (
                      <Text as="p" size="2">
                        주민등록번호: {creditor.registration_number}
                      </Text>
                    )}
                    {creditor.phone_number && (
                      <Text size="2" as="p">
                        전화번호: {creditor.phone_number}
                      </Text>
                    )}
                    {creditor.address && (
                      <Text size="2" as="p">
                        주소: {creditor.address}
                      </Text>
                    )}
                    {creditor.workplace_name && (
                      <Text size="2" as="p">
                        직장: {creditor.workplace_name}
                      </Text>
                    )}
                    {creditor.workplace_address && (
                      <Text size="2" as="p">
                        직장주소: {creditor.workplace_address}
                      </Text>
                    )}
                  </div>
                </Box>
              </motion.div>
            )}
          </Box>
        ))
      )}

      {/* 채권자 등록/수정 모달 */}
      {isFormOpen && (
        <CreditorForm
          isSubmitting={isSubmitting}
          initialData={currentCreditor}
          onOpenChange={setIsFormOpen}
          onSubmit={handleSaveCreditor}
          isSosong={isSosong}
        />
      )}
    </section>
  );
};

export default CreditorInfo;
