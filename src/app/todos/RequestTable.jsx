// src/app/todos/RequestTable.jsx

import React from "react";
import { Table, Box, Button, Flex } from "@radix-ui/themes";
import Pagination from "@/components/Pagination";

const RequestTable = ({
  requests,
  onRequestClick,
  paginationData,
  onPageChange,
  onRequestComplete,
}) => {
  const pageSize = 6;

  const truncateText = (text, maxLength = 50) => {
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  };

  return (
    <Box>
      <Table.Root mb="6">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>사건</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>요청자/수신자</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>설명</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>작업</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {requests.map((request) => (
            <Table.Row key={request.id}>
              <Table.Cell>
                {request.case_timelines.case?.title || "없음"}
              </Table.Cell>
              <Table.Cell>
                {request.requester?.name ||
                  request.receiver?.name ||
                  "알 수 없음"}
              </Table.Cell>
              <Table.Cell>
                {truncateText(request.case_timelines.description)}
              </Table.Cell>
              <Table.Cell>
                <Flex gap="2">
                  <Button onClick={() => onRequestClick(request)}>보기</Button>
                  {onRequestComplete && (
                    <Button
                      onClick={() =>
                        onRequestComplete(request.id, request.case_timelines.id)
                      }
                      variant="soft"
                    >
                      완료
                    </Button>
                  )}
                </Flex>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
      <Pagination
        currentPage={paginationData.page}
        totalPages={Math.ceil(paginationData.count / pageSize)}
        onPageChange={onPageChange}
      />
    </Box>
  );
};

export default RequestTable;
