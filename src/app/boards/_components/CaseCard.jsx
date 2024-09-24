import React from "react";
import { Card, Flex, Text, Badge } from "@radix-ui/themes";

const categoryColors = {
  민사: "blue",
  형사: "red",
  집행: "green",
  파산: "orange",
  회생: "purple",
};

const CaseCard = ({ caseItem, onClick }) => {
  if (!caseItem || !caseItem.category) {
    return null;
  }

  const clientNames = caseItem.clients
    ? caseItem.clients.map((c) => c.profiles.name).join(", ")
    : "없음";

  const staffNames = caseItem.staff
    ? caseItem.staff.map((s) => s.profiles.name).join(", ")
    : "없음";

  return (
    <Card style={{ width: "300px", cursor: "pointer" }} onClick={onClick}>
      <Flex direction="column" gap="2">
        <Flex justify="between" align="center">
          <Text size="5" weight="bold">
            {caseItem.title}
          </Text>
          <Badge color={categoryColors[caseItem.category.name] || "gray"}>
            {caseItem.category.name}
          </Badge>
        </Flex>
        <Text>의뢰인: {clientNames}</Text>
        <Text>담당자: {staffNames}</Text>
        <Text>
          시작일: {new Date(caseItem.start_date).toLocaleDateString()}
        </Text>
      </Flex>
    </Card>
  );
};

export default CaseCard;
