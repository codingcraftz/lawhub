// src/app/client/cases/[id]/page.jsx

"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { Box, Text, Flex } from "@radix-ui/themes";
import { ArrowLeftIcon } from "@radix-ui/react-icons";
import ClientCaseTimeline from "../ClientCaseTimeline";
import { useUser } from "@/hooks/useUser";
import useAuthRedirect from "@/hooks/useAuthRedirect";

const CasePage = () => {
  const { id } = useParams();
  const [caseData, setCaseData] = useState(null);
  const router = useRouter();
  const { user } = useUser();

  useAuthRedirect(["client", "staff", "admin"], "/login");

  useEffect(() => {
    const fetchCase = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("cases")
        .select(
          `
          *,
          case_categories (id, name),
          case_clients!inner(client:users (id, name)),
          case_staff (staff:users (id, name)),
          case_opponents (opponent:opponents (id, name))
        `,
        )
        .eq("id", id)
        .eq("case_clients.client_id", user.id)
        .single();
      console.log(data);

      if (error) {
        console.error("Error fetching case:", error);
        router.push("/client/cases");
      } else {
        setCaseData(data);
      }
    };

    fetchCase();
  }, [id, user]);

  if (!caseData) {
    return <Text>Loading...</Text>;
  }

  return (
    <Box className="p-8 px-16 max-w-7xl w-full mx-auto">
      <Flex direction="column" gap="4">
        <Flex direction={"row"} align="center">
          <ArrowLeftIcon
            className="w-8 h-8 cursor-pointer mr-3"
            onClick={() => router.back()}
          />
          <Text size="6" weight="bold">
            {caseData.title}
          </Text>
        </Flex>
        <ClientCaseTimeline
          caseId={caseData.id}
          caseStatus={caseData.status}
          description={caseData.description}
        />
      </Flex>
    </Box>
  );
};

export default CasePage;
