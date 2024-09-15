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
  if (
    !caseItem ||
    !caseItem.client ||
    !caseItem.assigned_to ||
    !caseItem.category
  ) {
    return null;
  }

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
        <Text>
          {caseItem.client.name} - {caseItem.client.phone_number}
        </Text>
        <Text>담당자: {caseItem.assigned_to.name}</Text>
        <Text>
          시작일: {new Date(caseItem.start_date).toLocaleDateString()}
        </Text>
      </Flex>
    </Card>
  );
};

export default CaseCard;
