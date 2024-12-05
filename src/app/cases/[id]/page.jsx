"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { Box, Text, Flex } from "@radix-ui/themes";
import CaseTimeline from "@/app/case-management/_components/CaseTimeline";
import { ArrowLeftIcon } from "@radix-ui/react-icons";
import useAuthRedirect from "@/hooks/useAuthRedirect";

const CasePage = () => {
  const { id } = useParams();
  const [caseData, setCaseData] = useState(null);
  const router = useRouter();

  useAuthRedirect(["staff", "admin"], "/");

  useEffect(() => {
    const fetchCase = async () => {
      const { data, error } = await supabase
        .from("cases")
        .select(
          `
          *,
          case_categories (id, name),
          case_clients (client:users (id, name)),
          case_staff (staff:users (id, name)),
          case_opponents (opponent:opponents (id, name))
        `,
        )
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching case:", error);
      } else {
        setCaseData(data);
      }
    };

    if (id) {
      fetchCase();
    }
  }, [id]);

  if (!caseData) {
    return <Text>Loading...</Text>;
  }

  return (
    <Box className="p-8 px-16 max-w-7xl w-full mx-auto">
      <Flex direction="column" gap="4">
        <Flex direction={"row"} align={"center"}>
          <ArrowLeftIcon
            className="w-8 h-8 cursor-pointer mr-3"
            onClick={() => router.back()}
          />
          <Text size="6" weight="bold">
            {caseData.title}
          </Text>
        </Flex>
        <CaseTimeline
          caseId={caseData.id}
          caseStatus={caseData.status}
          description={caseData.description}
        />
      </Flex>
    </Box>
  );
};

export default CasePage;
