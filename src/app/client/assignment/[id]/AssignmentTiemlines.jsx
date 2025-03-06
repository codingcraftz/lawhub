// src/app/client/assignment/[id]/AssignmentTimelines.jsx

"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Button, Flex, Text, Box } from "@radix-ui/themes";
import { motion } from "framer-motion";
import TimelineForm from "../_components/dialogs/TimelineForm";

const AssignmentTimelines = ({ assignmentId, user, isSosong }) => {
  const [timelines, setTimelines] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentTimeline, setCurrentTimeline] = useState(null);
  const isAdmin = user?.role === "staff" || user?.role === "admin";

  const fetchTimelines = async () => {
    const { data, error } = await supabase
      .from("assignment_timelines")
      .select("*")
      .eq("assignment_id", assignmentId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setTimelines(data);
    } else {
      console.error("Failed to fetch timelines:", error);
    }
  };

  useEffect(() => {
    fetchTimelines();
  }, [assignmentId]);

  // Handle delete
  const handleDeleteTimeline = async (timelineId) => {
    const { error } = await supabase
      .from("assignment_timelines")
      .delete()
      .eq("id", timelineId);

    if (error) {
      console.error("Failed to delete timeline:", error);
      alert("목표 삭제 중 오류가 발생했습니다.");
    } else {
      await fetchTimelines(); // Reload timelines after delete
    }
  };

  return (
    <section className="mb-6 p-4 rounded shadow-md shadow-gray-7 bg-gray-2 text-gray-12">
      <Flex justify="between" align="center" className="mb-3">
        <Text as="h2" className="font-semibold text-lg">
          {isSosong ? "소송 진행 상황" : "회수 진행 상황"}
        </Text>
        {isAdmin && (
          <Button
            onClick={() => {
              setCurrentTimeline(null);
              setIsFormOpen(true);
            }}
          >
            등록
          </Button>
        )}
      </Flex>

      {timelines.length === 0 ? (
        <Text>등록된 현황이 없습니다.</Text>
      ) : (
        <>
          <Flex justify="between" align="center" className="mb-3">
            <Box className="font-semibold w-full">
              <Text as="p" className="font-semibold">
                {" "}
                {timelines[timelines.length - 1]?.description || "정보 없음"}
              </Text>
              <div className="flex gap-2 pr-2 items-center justify-end w-full">
                <Text
                  as="p"
                  size="2"
                  color="gray"
                  className="whitespace-nowrap"
                >
                  {new Date(
                    timelines[timelines.length - 1]?.created_at,
                  ).toLocaleString("ko-KR", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  }) || "정보 없음"}
                </Text>
                {isAdmin && (
                  <>
                    <Button
                      variant="soft"
                      size="2"
                      onClick={() => {
                        setCurrentTimeline(timelines[timelines.length - 1]);
                        setIsFormOpen(true);
                      }}
                    >
                      수정
                    </Button>
                    <Button
                      variant="soft"
                      color="red"
                      size="2"
                      onClick={() =>
                        handleDeleteTimeline(timelines[timelines.length - 1].id)
                      }
                    >
                      삭제
                    </Button>
                  </>
                )}
              </div>
            </Box>
          </Flex>

          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: isExpanded ? "auto" : 0,
              opacity: isExpanded ? 1 : 0,
            }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {timelines
              .slice(0, -1)
              .reverse()
              .map((timeline) => (
                <Box
                  key={timeline.id}
                  className="mb-4 p-3 bg-gray-2 rounded border border-gray-6"
                >
                  <Flex justify="between" align="center">
                    <Box className="font-semibold w-full">
                      <Text as="p">{timeline.description}</Text>
                      <div className="flex gap-2 pr-2 items-center justify-end w-full">
                        <Text
                          as="p"
                          size="2"
                          color="gray"
                          className="whitespace-nowrap"
                        >
                          {new Date(timeline.created_at).toLocaleString(
                            "ko-KR",
                            {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                            },
                          )}
                        </Text>
                        {isAdmin && (
                          <>
                            <Button
                              variant="soft"
                              size="2"
                              onClick={() => {
                                setCurrentTimeline(timeline);
                                setIsFormOpen(true);
                              }}
                            >
                              수정
                            </Button>
                            <Button
                              variant="soft"
                              color="red"
                              size="2"
                              onClick={() => handleDeleteTimeline(timeline.id)}
                            >
                              삭제
                            </Button>
                          </>
                        )}
                      </div>
                    </Box>
                  </Flex>
                </Box>
              ))}
          </motion.div>
          {timelines.length > 1 && (
            <Button
              className="ml-auto w-full"
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "닫기" : "더보기"}
            </Button>
          )}
        </>
      )}
      {isFormOpen && (
        <TimelineForm
          open={isFormOpen}
          assignmentId={assignmentId}
          timelineData={currentTimeline}
          onOpenChange={setIsFormOpen}
          onSuccess={fetchTimelines} // Refresh after save
        />
      )}
    </section>
  );
};

export default AssignmentTimelines;
