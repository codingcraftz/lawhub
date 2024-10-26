// src/app/client/cases/ClientCaseTimeline.jsx

import React, { useState, useEffect } from "react";
import { Box, Flex, Text, Badge, Button } from "@radix-ui/themes";
import { supabase } from "@/utils/supabase";

const ClientCaseTimeline = ({ caseId, caseStatus, onClose }) => {
  const [timelineItems, setTimelineItems] = useState([]);

  useEffect(() => {
    fetchTimelineItems();
  }, [caseId]);

  const fetchTimelineItems = async () => {
    const { data, error } = await supabase
      .from("case_timelines")
      .select(
        `
        *,
        manager:users!fk_manager(id, name),
        handler:users!fk_handler(id, name),
        requested_to:users!fk_requested_to(id, name)
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

  return (
    <Box>
      <Flex direction="column" gap="4">
        <Text size="5" weight="bold">
          사건 타임라인
        </Text>
        {/* 타임라인 항목들 */}
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
                    {new Date(item.created_at).toLocaleString()}
                  </Text>
                  <Badge>{item.type}</Badge>
                </Flex>
              </Flex>
              <Text size="3" mt="1">
                {item.description}
              </Text>
              <Text size="2" color="gray" mt="1">
                담당자: {item.manager?.name || "없음"}
                {item.handler && `| 처리자: ${item.handler.name}`}
              </Text>
            </Box>
          ))}
        </Flex>
        {/* 하단 버튼 */}
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
