// src/app/client/cases/ClientCaseTimeline.jsx

const getTypeColor = (type) => {
  switch (type) {
    case "요청":
      return "bg-blue-200 text-blue-900";
    case "완료":
      return "bg-green-200 text-green-900";
    case "상담":
      return "bg-purple-200 text-purple-900";
    case "접수":
      return "bg-yellow-200 text-yellow-900";
    default:
      return "bg-gray-200 text-gray-900";
  }
};

import React, { useState, useEffect } from "react";
import { Box, Flex, Text, Badge, Button } from "@radix-ui/themes";
import { supabase } from "@/utils/supabase";

const ClientCaseTimeline = ({ caseId, onClose }) => {
  const [timelineItems, setTimelineItems] = useState([]);
  const [deadlines, setDeadlines] = useState([]);

  useEffect(() => {
    fetchTimelineItems();
    fetchDeadlines();
  }, [caseId]);

  const fetchTimelineItems = async () => {
    const { data, error } = await supabase
      .from("case_timelines")
      .select(
        `
        *,
 created_by:users!case_timelines_created_by_fkey(id, name),
        requested_to:users!case_timelines_requested_to_fkey(id, name)
      `,
      )
      .eq("case_id", caseId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching timeline items:", error);
    } else {
      setTimelineItems(data);
    }
  };

  const fetchDeadlines = async () => {
    try {
      const { data, error } = await supabase
        .from("case_deadlines")
        .select("*")
        .eq("case_id", caseId)
        .order("deadline_date", { ascending: true });

      if (error) {
        console.error("Error fetching deadlines:", error);
      } else {
        setDeadlines(data);
      }
    } catch (error) {
      console.error("Error fetching deadlines:", error);
    }
  };

  return (
    <Box>
      {deadlines.length > 0 && (
        <Box mb="4">
          <Flex direction="column" gap="2">
            {deadlines.map((deadline) => (
              <Flex
                key={deadline.id}
                justify="between"
                align="center"
                className="p-2 border rounded-md"
                style={{
                  backgroundColor: "var(--gray-2)",
                  border: "1px solid var(--gray-6)",
                }}
              >
                <Text size="3" weight="bold">
                  {deadline.type}
                </Text>
                <Text size="2" color="gray">
                  {new Date(deadline.deadline_date).toLocaleDateString(
                    "ko-KR",
                    {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    },
                  )}
                </Text>
              </Flex>
            ))}
          </Flex>
        </Box>
      )}

      <Flex direction="column" gap="4">
        <Text size="5" weight="bold">
          사건 타임라인
        </Text>
        <Flex direction="column" gap="3">
          {timelineItems.map((item) => (
            <Box
              key={item.id}
              style={{
                borderLeft: "2px solid var(--gray-6)",
                paddingLeft: "1rem",
                position: "relative",
              }}
            >
              <Box
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: "var(--gray-6)",
                  position: "absolute",
                  left: "-6px",
                  top: "6px",
                }}
              />
              <Flex justify="between" align="center">
                <Flex align="center" gap="2">
                  <Text size="2" color="gray">
                    {new Date(item.created_at).toLocaleString("ko-KR", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </Text>
                  <Badge className={getTypeColor(item.type)}>{item.type}</Badge>
                </Flex>
              </Flex>
              <Flex className="justify-between">
                <Text size="3" mt="1">
                  {item.description}
                </Text>
                <Text
                  size="2"
                  color="gray"
                  mt="1"
                  style={{
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                    marginLeft: "8px",
                  }}
                >
                  {item.created_by?.name &&
                    (item.type === "요청" && item.requested_to?.name
                      ? `${item.created_by.name} → ${item.requested_to.name}`
                      : item.created_by.name)}
                </Text>
              </Flex>
            </Box>
          ))}
        </Flex>
        <Flex justify="end" mt="4">
          <Button size="2" onClick={onClose}>
            확인
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
};

export default ClientCaseTimeline;
