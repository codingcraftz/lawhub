// src/app/client/assignment/[id]/EnforcementList.jsx

"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Button, Flex, Text, Box, Badge } from "@radix-ui/themes";
import { motion } from "framer-motion";

import EnforcementForm from "../_components/dialogs/EnforcementForm"; // 등록/수정 Form
import EnforcementDeadlines from "./EnforcementDeadlines"; // 기일 목록
import EnforcementTimelines from "./EnforcementTimelines"; // 타임라인 목록

export default function EnforcementList({ assignmentId, user }) {
  const [enforcements, setEnforcements] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentEnf, setCurrentEnf] = useState(null);

  const isAdmin = user?.role === "staff" || user?.role === "admin";

  const StatusBadge = ({ status }) => {
    if (status === "ongoing") {
      return <Badge color="green">진행</Badge>;
    }
    if (status === "closed") {
      return <Badge color="red">완료</Badge>;
    }
    return null;
  };

  // 1) fetch enforcements
  const fetchEnforcements = async () => {
    try {
      // enforcements 테이블 가져오기 (assignmentId 기준)
      const { data: rawList, error } = await supabase
        .from("enforcements")
        .select("*")
        .eq("assignment_id", assignmentId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!rawList) return;

      // forEach 반복문으로 latestTimeline, nextDeadline 조회
      const updated = [];
      for (const enf of rawList) {
        // 1. 최신 타임라인
        const { data: latestT } = await supabase
          .from("enforcement_timelines")
          .select("text, created_at")
          .eq("enforcement_id", enf.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        // 2. 다음 기일 (오늘 기준 이후)
        const { data: nextD } = await supabase
          .from("enforcement_deadlines")
          .select("type, deadline_date, location")
          .eq("enforcement_id", enf.id)
          .order("deadline_date", { ascending: true })
          .limit(1)
          .maybeSingle();

        updated.push({
          ...enf,
          latestTimeline: latestT ? latestT.text : "진행상황 없음",
          nextDeadline: nextD
            ? `${nextD.type} (${new Date(new Date(nextD.deadline_date).getTime() + -9 * 60 * 60 * 1000).toLocaleDateString("ko-KR", { year: "2-digit", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })} @ ${nextD.location || "위치 없음"})`
            : "예정된 기일 없음",
        });
      }
      setEnforcements(updated);
    } catch (err) {
      console.error("Failed to fetch enforcements:", err);
    }
  };

  useEffect(() => {
    if (assignmentId) {
      fetchEnforcements();
    }
  }, [assignmentId]);

  // 2) 등록/수정
  const openCreateForm = () => {
    setCurrentEnf(null);
    setIsFormOpen(true);
  };
  const openEditForm = (eItem) => {
    setCurrentEnf(eItem);
    setIsFormOpen(true);
  };
  const handleFormSuccess = () => {
    setIsFormOpen(false);
    fetchEnforcements();
  };

  // 3) 상세 펼침
  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <section className="mb-6 p-4 rounded shadow-md shadow-gray-7 bg-gray-2 text-gray-12">
      <Flex justify="between" align="center" className="mb-3">
        <Text as="h2" className="font-semibold text-lg">
          회수 활동
        </Text>
        {isAdmin && <Button onClick={openCreateForm}>등록</Button>}
      </Flex>

      {enforcements.length === 0 ? (
        <Text>등록된 회수활동이 없습니다.</Text>
      ) : (
        <ul className="space-y-3">
          {enforcements.map((enf) => (
            <li
              key={enf.id}
              className="p-3 bg-gray-3 border border-gray-6 rounded flex flex-col gap-2"
            >
              <Flex justify="between" align="center">
                <Box className="flex flex-col mr-2" style={{ maxWidth: "80%" }}>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={enf.status} />
                    <Text className="font-medium">
                      {enf.type} - {enf.amount?.toLocaleString()}원
                    </Text>
                  </div>
                  <Text size="2" color="gray">
                    상태: {enf.latestTimeline}
                  </Text>
                  <Text size="2" color="gray">
                    기일: {enf.nextDeadline}
                  </Text>
                </Box>
                {/* 우측 버튼 */}
                <Flex gap="2" className="items-center flex-col">
                  {isAdmin && (
                    <Button variant="soft" onClick={() => openEditForm(enf)}>
                      수정
                    </Button>
                  )}
                  <Button variant="ghost" onClick={() => toggleExpand(enf.id)}>
                    {expandedId === enf.id ? "닫기" : "상세보기"}
                  </Button>
                </Flex>
              </Flex>

              {/* 펼쳐진 상세 내용 */}
              {expandedId === enf.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden p-2 bg-gray-2 border border-gray-6 rounded"
                >
                  <EnforcementDeadlines
                    enforcementId={enf.id}
                    isAdmin={isAdmin}
                    handleSuccess={fetchEnforcements}
                  />
                  <EnforcementTimelines
                    enforcementId={enf.id}
                    isAdmin={isAdmin}
                    handleSuccess={fetchEnforcements}
                  />
                </motion.div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* 등록/수정 다이얼로그 */}
      {isFormOpen && (
        <EnforcementForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          assignmentId={assignmentId}
          enforcementData={currentEnf}
          onSuccess={handleFormSuccess}
        />
      )}
    </section>
  );
}
